import { stockage } from './stockage'
// Imports RELATIFS, non aliasés : ce module est chargé par Nitro ET par Vitest
// (config Node sans alias Nuxt), comme les services de `server/services/`.
import { eyebrowDe } from '../../shared/utils/eyebrow.ts'
import { tempsLecture } from '../../shared/utils/tempsLecture.ts'
import { libelleRubrique, type RubriqueId } from '../../shared/utils/rubriques.ts'
import type {
  ArticleDTO,
  ArticleEditionDTO,
  ArticlePubliableDTO,
  CarteDTO,
  EmplacementUneDTO,
  LigneArticleAdmin,
  ListePagineeDTO,
  SeoArticleDTO,
  UneHeroDTO,
  UneSecondaireDTO,
} from '../../shared/types/dto.ts'

// La couche de PRÉSENTATION — la frontière serveur→client.
//
// Aucune forme brute Prisma ne la franchit : chaque route publique passe ses
// entités par ces mappeurs, qui produisent des DTO d'affichage (data-model §2).
// Trois calculs vivent ICI, jamais en base :
//
//   · l'URL de couverture, par `stockage.url(cle)` — la base ne range qu'une
//     clé (porte 9) ;
//   · l'eyebrow, par `eyebrowDe(article, contexte)` — règle d'affichage, pas
//     une colonne ;
//   · le temps de lecture, par `tempsLecture(corps)` — valeur dérivée (FR-014).
//
// Le titre est restitué NU : la composition « Sous-thème : Titre » des maquettes
// est de l'affichage, jamais du contenu (FR-019). Rien ici ne préfixe le titre.

/** Le minimum qu'un mappeur lit d'un média joint : sa clé de stockage. */
interface CouvertureJointe {
  cle: string
}

/** La forme d'entité attendue en entrée — un sur-ensemble suffit (les services
 *  renvoient l'article complet + la couverture jointe). */
export interface ArticleEntite {
  titre: string
  slug: string
  chapo: string
  corps: string
  sousTheme: string | null
  auteur: string | null
  publieLe: Date | null
  rubriqueId: string
  couvertureAlt: string | null
  couvertureLegende: string | null
  couverture?: CouvertureJointe | null
}

/** Le contexte de lecture : la rubrique où se trouve le lecteur, ou `null`
 *  (accueil, listes toutes rubriques). Détermine l'eyebrow (sous-thème vs rubrique). */
export type Contexte = RubriqueId | null

// Les DTO produits ici sont typés dans `shared/types/dto.ts`, seule source pour
// le serveur et les composants. Ce module en est le PRODUCTEUR ; il n'en
// redéclare pas les formes.

// ----------------------------------------------------------------- Utilitaires

/** Une date de parution en ISO. Les lectures publiques garantissent une date
 *  non nulle (visible ⇒ publié ⇒ daté) ; le repli couvre le cas impossible. */
function dateISO(valeur: Date | null): string {
  return valeur ? valeur.toISOString() : ''
}

/**
 * L'URL et l'`alt` d'une couverture, ou `null`.
 *
 * `image` et `imageAlt` forment un COUPLE : jamais l'un sans l'autre (contrat
 * `ArticleCard`). Une couverture sans texte alternatif réel n'est donc pas
 * rendue — cas qui ne survient pas sur un article publié (la publication exige
 * l'`alt`), mais dont on ne dépend pas ici.
 */
function couvertureDe(article: ArticleEntite): { url: string, alt: string } | null {
  const cle = article.couverture?.cle
  const alt = article.couvertureAlt?.trim()
  if (!cle || !alt) return null
  return { url: stockage.url(cle), alt }
}

// -------------------------------------------------------------------- Mappeurs

/** La vignette (alimente `ArticleCard`). */
export function carteDe(article: ArticleEntite, contexte: Contexte): CarteDTO {
  const couverture = couvertureDe(article)
  return {
    titre: article.titre,
    slug: article.slug,
    chemin: `/article/${article.slug}`,
    rubrique: article.rubriqueId as RubriqueId,
    eyebrow: eyebrowDe(article, contexte),
    date: dateISO(article.publieLe),
    image: couverture?.url,
    imageAlt: couverture?.alt,
  }
}

/** L'article de rang 01 (héros de la Une). */
export function uneHeroDe(article: ArticleEntite): UneHeroDTO {
  return {
    ...carteDe(article, null),
    numero: '01',
    chapo: article.chapo,
    tempsLecture: tempsLecture(article.corps),
  }
}

/** Un rang 02–05 de la Une — sans image (structure `accueil.html` `.une-secondary`). */
export function uneSecondaireDe(article: ArticleEntite, rang: number): UneSecondaireDTO {
  return {
    numero: String(rang).padStart(2, '0'),
    titre: article.titre,
    slug: article.slug,
    chemin: `/article/${article.slug}`,
    rubrique: article.rubriqueId as RubriqueId,
    eyebrow: eyebrowDe(article, null),
    date: dateISO(article.publieLe),
  }
}

/**
 * La Une, depuis les articles placés (rangs 1–5, déjà triés par `lireUne`).
 *
 * Le héros est `null` si le rang 1 n'est pas pourvu (jamais de héros vide,
 * FR-008). Un rang 02–05 non pourvu est simplement absent — pas de vignette vide.
 */
export function uneDe(
  articles: (ArticleEntite & { rangUne: number | null })[],
): { hero: UneHeroDTO | null, secondaires: UneSecondaireDTO[] } {
  const rang1 = articles.find((a) => a.rangUne === 1)
  const secondaires = articles
    .filter((a) => a.rangUne != null && a.rangUne >= 2 && a.rangUne <= 5)
    .map((a) => uneSecondaireDe(a, a.rangUne!))

  return {
    hero: rang1 ? uneHeroDe(rang1) : null,
    secondaires,
  }
}

/** La page article complète, avec fil d'Ariane et couverture légendée. */
export function articleDe(article: ArticleEntite): ArticleDTO {
  const id = article.rubriqueId as RubriqueId
  const libelle = libelleRubrique(id) ?? id
  const cheminRubrique = `/rubrique/${id}`

  const couverture = couvertureDe(article)

  return {
    titre: article.titre,
    slug: article.slug,
    rubrique: { id, libelle, chemin: cheminRubrique },
    sousTheme: article.sousTheme,
    chapo: article.chapo,
    corpsHtml: article.corps,
    auteur: article.auteur,
    date: dateISO(article.publieLe),
    tempsLecture: tempsLecture(article.corps),
    // La légende éditoriale est DISTINCTE du texte alternatif (principe VIII) :
    // l'`alt` sert l'accessibilité, la `legende` s'affiche sous l'image.
    couverture: couverture
      ? { url: couverture.url, alt: couverture.alt, legende: article.couvertureLegende }
      : null,
    // Le fil d'Ariane ne porte que les ANCÊTRES navigables ; le titre courant
    // est rendu à part par le composant (il n'est pas un lien).
    filAriane: [
      { libelle: 'Accueil', chemin: '/' },
      { libelle, chemin: cheminRubrique },
    ],
  }
}

// ------------------------------------------------------- Métadonnées SEO (US3)

/** L'article, plus sa date de MODIFICATION — le SEO l'expose (`dateModified`),
 *  là où les mappeurs d'affichage n'en ont pas besoin. */
export interface ArticleSeoEntite extends ArticleEntite {
  modifieLe: Date
}

/**
 * Les métadonnées de référencement d'un article (D8, data-model §2).
 *
 * L'URL absolue de l'image passe par `stockage.urlAbsolue` — JAMAIS une
 * concaténation ailleurs (porte 9). `imageAbsolue` est `null` sans couverture :
 * l'affichage retombe alors sur l'image de partage par défaut (D7). La `section`
 * est le libellé français de la rubrique. Aucune URL n'est persistée : tout se
 * calcule ici, à la lecture. La canonique est sans query (l'article n'a pas de
 * pagination) et normalisée sans barre finale superflue.
 */
export function metaSeoArticleDe(article: ArticleSeoEntite, origine: string): SeoArticleDTO {
  const id = article.rubriqueId as RubriqueId
  const cle = article.couverture?.cle
  return {
    canonical: `${origine.replace(/\/+$/, '')}/article/${article.slug}`,
    imageAbsolue: cle ? stockage.urlAbsolue(cle, origine) : null,
    publieISO: dateISO(article.publieLe),
    modifieISO: article.modifieLe.toISOString(),
    section: libelleRubrique(id) ?? id,
    auteur: article.auteur,
  }
}

// -------------------------------------------------------- Mappeurs d'ADMINISTRATION

/** Le minimum qu'un mappeur d'administration lit d'un article de la liste. */
export interface ArticleAdminEntite {
  id: string
  titre: string
  statut: string
  rangUne: number | null
  publieLe: Date | null
  modifieLe: Date
  rubriqueId: string
  couvertureAlt: string | null
  couverture?: CouvertureJointe | null
}

/**
 * Une ligne de la table « Articles » (dérivé 3).
 *
 * `image` est présente dès qu'une couverture existe — la vignette de table est
 * PRÉSENTATIONNELLE (le titre porte le sens), elle peut donc figurer même sur un
 * brouillon dont l'`alt` n'est pas encore posé. L'URL passe par `stockage.url` :
 * la base ne range qu'une clé (porte 9). La date affichée est la parution si
 * l'article est publié, sinon la dernière modification.
 */
export function ligneArticleAdminDe(article: ArticleAdminEntite): LigneArticleAdmin {
  const id = article.rubriqueId as RubriqueId
  const cle = article.couverture?.cle
  const alt = article.couvertureAlt?.trim()

  return {
    id: article.id,
    titre: article.titre,
    rubrique: { id, libelle: libelleRubrique(id) ?? id },
    statut: article.statut as 'brouillon' | 'publie',
    rangUne: article.rangUne,
    date: dateISO(article.publieLe ?? article.modifieLe),
    ...(cle ? { image: stockage.url(cle) } : {}),
    ...(cle && alt ? { imageAlt: alt } : {}),
  }
}

/** Le minimum qu'un mappeur d'édition lit d'un article complet. */
export interface ArticleEditionEntite {
  id: string
  titre: string
  slug: string
  chapo: string
  corps: string
  sousTheme: string | null
  auteur: string | null
  statut: string
  publieLe: Date | null
  rubriqueId: string
  rangUne: number | null
  couvertureAlt: string | null
  couvertureLegende: string | null
  modifieLe: Date
  couverture?: { id: string, cle: string } | null
}

/**
 * L'article complet chargé dans l'éditeur (`ArticleEditionDTO`). Le corps est
 * `corpsHtml` — DÉJÀ assaini au stockage. La couverture porte son `url`
 * (calculée par `stockage.url`, jamais persistée), son `alt` d'accessibilité et
 * sa `legende` éditoriale, distincts. `modifieLe` alimente l'indicateur
 * d'autosave.
 */
export function articleEditionDe(article: ArticleEditionEntite): ArticleEditionDTO {
  return {
    id: article.id,
    titre: article.titre,
    slug: article.slug,
    chapo: article.chapo,
    corpsHtml: article.corps,
    sousTheme: article.sousTheme,
    auteur: article.auteur,
    statut: article.statut as 'brouillon' | 'publie',
    publieLe: article.publieLe ? article.publieLe.toISOString() : null,
    rubriqueId: article.rubriqueId as RubriqueId,
    rangUne: article.rangUne,
    couverture: article.couverture
      ? {
          id: article.couverture.id,
          url: stockage.url(article.couverture.cle),
          alt: article.couvertureAlt,
          legende: article.couvertureLegende,
        }
      : null,
    modifieLe: article.modifieLe.toISOString(),
  }
}

// --------------------------------------------------- Composition de la Une (US4)

/** Le minimum qu'un mappeur de « Composer la Une » lit d'un article. */
export interface ArticleUneEntite {
  id: string
  titre: string
  rubriqueId: string
  couvertureAlt: string | null
  couverture?: CouvertureJointe | null
}

/**
 * La forme réduite d'un article dans « Composer la Une » — dérivés 1 et 2.
 * L'eyebrow est le LIBELLÉ DE RUBRIQUE (contexte accueil) ; `image` reste une
 * adresse d'application calculée par `stockage.url`.
 */
function miniArticleUne(article: ArticleUneEntite) {
  const cle = article.couverture?.cle
  const alt = article.couvertureAlt?.trim()
  return {
    id: article.id,
    titre: article.titre,
    rubrique: libelleRubrique(article.rubriqueId) ?? article.rubriqueId,
    ...(cle ? { image: stockage.url(cle) } : {}),
    ...(cle && alt ? { imageAlt: alt } : {}),
  }
}

/** Les CINQ emplacements (rang 1..5), chacun portant son article ou `null`. */
export function emplacementsUneDe(
  epingles: (ArticleUneEntite & { rangUne: number | null })[],
): EmplacementUneDTO[] {
  return [1, 2, 3, 4, 5].map((rang) => {
    const article = epingles.find((e) => e.rangUne === rang)
    return { rang, article: article ? miniArticleUne(article) : null }
  })
}

/** Un article publiable, proposé à l'épinglage (dérivé 2). */
export function articlePubliableDe(article: ArticleUneEntite): ArticlePubliableDTO {
  return miniArticleUne(article)
}

/** Une liste paginée (rubrique ou « tous les articles »). */
export function listePagineeDe(options: {
  articles: ArticleEntite[]
  page: number
  taille: number
  total: number
  contexte: Contexte
  rubrique: { id: RubriqueId, libelle: string } | null
}): ListePagineeDTO {
  return {
    articles: options.articles.map((a) => carteDe(a, options.contexte)),
    page: options.page,
    taille: options.taille,
    total: options.total,
    totalPages: Math.ceil(options.total / options.taille),
    rubrique: options.rubrique,
  }
}
