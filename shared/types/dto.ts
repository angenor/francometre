// Les DTO de présentation — formes d'AFFICHAGE, jamais des tables (data-model §2).
//
// Ce module ne porte que des TYPES : il est partagé par le serveur, qui les
// produit (`server/utils/presentation.ts`), et par les composants publics, qui
// les consomment. Aucune forme brute Prisma ne franchit cette frontière.

import type { RubriqueId } from '../utils/rubriques.ts'

/** Une référence de rubrique, prête à afficher et à lier. */
export interface RubriqueRef {
  id: RubriqueId
  libelle: string
  chemin: string
}

/** La vignette (alimente `ArticleCard`). `image`/`imageAlt` forment un couple :
 *  jamais l'un sans l'autre. */
export interface CarteDTO {
  titre: string
  slug: string
  chemin: string
  rubrique: RubriqueId
  eyebrow: string
  date: string
  image?: string
  imageAlt?: string
}

/** L'article de rang 01 de la Une (héros). */
export interface UneHeroDTO extends CarteDTO {
  numero: '01'
  chapo: string
  tempsLecture: number
}

/** Un rang 02–05 de la Une — sans image. */
export interface UneSecondaireDTO {
  numero: string
  titre: string
  slug: string
  chemin: string
  rubrique: RubriqueId
  eyebrow: string
  date: string
}

/** Un maillon navigable du fil d'Ariane (ancêtre, jamais le titre courant). */
export interface FilArianeElement {
  libelle: string
  chemin: string
}

/** La page article complète. */
export interface ArticleDTO {
  titre: string
  slug: string
  rubrique: RubriqueRef
  sousTheme: string | null
  chapo: string
  corpsHtml: string
  auteur: string | null
  date: string
  tempsLecture: number
  couverture: { url: string, alt: string, legende: string | null } | null
  filAriane: FilArianeElement[]
}

/** Une liste paginée (rubrique ou « tous les articles »). */
export interface ListePagineeDTO {
  articles: CarteDTO[]
  page: number
  taille: number
  total: number
  totalPages: number
  rubrique: { id: RubriqueId, libelle: string } | null
}

/** Une section de rubrique sur l'accueil. */
export interface SectionAccueilDTO {
  rubrique: RubriqueRef
  articles: CarteDTO[]
}

/** L'accueil éditorialisé au complet. */
export interface AccueilDTO {
  une: { hero: UneHeroDTO | null, secondaires: UneSecondaireDTO[] }
  derniers: CarteDTO[]
  sections: SectionAccueilDTO[]
}

/**
 * Métadonnées de référencement d'un article, DÉRIVÉES à la lecture (data-model
 * §2, D8). Produites AU SERVEUR par `metaSeoArticleDe` ; consommées par la page
 * article pour Open Graph/Twitter et le constructeur JSON-LD. Rien n'est
 * persisté : ni l'URL absolue, ni les ISO ne vivent en base (porte 9).
 */
export interface SeoArticleDTO {
  canonical: string           // {origine}/article/{slug} — absolu
  imageAbsolue: string | null // couverture absolue (Stockage.urlAbsolue) ou null → défaut
  publieISO: string           // date de parution, ISO 8601 (article:published_time)
  modifieISO: string          // dernière modification, ISO 8601 (article:modified_time)
  section: string             // libellé de la rubrique (article:section)
  auteur: string | null       // nom de l'auteur, ou null → repli Organisation
}

/** La réponse de la page article : l'article, ses « à lire aussi » et son SEO. */
export interface ArticlePageDTO {
  article: ArticleDTO
  aLireAussi: CarteDTO[]
  seo: SeoArticleDTO
}

// ---------------------------------------------------------------------------
// DTO d'ADMINISTRATION (data-model §3) — formes d'affichage du back-office,
// produites par les routes `/api/admin/**`, jamais des entités brutes Prisma.
//
// Comme les DTO publics, `image` reste une ADRESSE D'APPLICATION (`/medias/<clé>`,
// calculée par `stockage.url`), jamais persistée : la base ne range qu'une clé.
// ---------------------------------------------------------------------------

/** Une ligne de la table « Articles » (dérivé 3). */
export interface LigneArticleAdmin {
  id: string
  titre: string
  rubrique: { id: RubriqueId, libelle: string }
  statut: 'brouillon' | 'publie'
  rangUne: number | null        // 1..5 ou null (affiché « 01 » … ou « — »)
  date: string                  // publieLe si publié, sinon modifieLe (ISO)
  image?: string                // /medias/<clé> ou absent (brouillon sans couverture)
  imageAlt?: string
}

/** La liste paginée d'administration. */
export interface ListeAdminDTO {
  articles: LigneArticleAdmin[]
  page: number
  taille: number
  total: number
  totalPages: number
}

/** L'article complet chargé dans l'éditeur (brouillon compris). */
export interface ArticleEditionDTO {
  id: string
  titre: string
  slug: string
  chapo: string
  corpsHtml: string             // déjà assaini
  sousTheme: string | null
  auteur: string | null
  statut: 'brouillon' | 'publie'
  publieLe: string | null       // ISO ou null
  rubriqueId: RubriqueId
  rangUne: number | null
  couverture: { id: string, url: string, alt: string | null, legende: string | null } | null
  modifieLe: string             // pour l'indicateur d'autosave
}

/** Un des cinq emplacements de « Composer la Une » (dérivé 1). */
export interface EmplacementUneDTO {
  rang: number                  // 1..5 ; rang 1 = héros
  article: {
    id: string
    titre: string
    rubrique: string            // libellé (eyebrow de rubrique, contexte accueil)
    image?: string
    imageAlt?: string
  } | null                      // null = « Emplacement libre »
}

/** Un article publiable, proposé à l'épinglage (dérivé 2). */
export interface ArticlePubliableDTO {
  id: string
  titre: string
  rubrique: string              // libellé
  image?: string
  imageAlt?: string
}

/** La réponse de GET /api/admin/une. */
export interface CompositionUneDTO {
  emplacements: EmplacementUneDTO[]   // toujours 5, rang 1..5, article ou null
  publiables: ArticlePubliableDTO[]   // publiés NON épinglés, filtrables par recherche
}

/** La réponse de POST /api/admin/medias (téléversement). */
export interface MediaTeleverseDTO {
  id: string
  cle: string
  url: string                   // /medias/<clé> (= stockage.url(cle))
}
