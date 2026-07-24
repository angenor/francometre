import { prisma } from '../utils/db'
import { deriverSlug } from '../utils/slug'
import { filtreVisible } from '../utils/visibilite'
import { assainir } from '../validation/assainir'
import { ErreurValidation, valider } from '../validation/erreurs'
import {
  schemaCreationArticle,
  schemaModificationArticle,
  type DonneesCreationArticle,
  type DonneesModificationArticle,
} from '../validation/article'

// Articles — la couche qui porte les invariants que le schéma ne sait pas
// exprimer (research.md D13) :
//
//   · rang de Une dans 1–5          — aucun CHECK exprimable en Prisma
//   · à la Une ⇒ publié             — contrainte inter-colonnes
//   · publié ⇒ couverture et alt    — contrainte conditionnelle
//   · éviction atomique du rang     — deux écritures, une seule opération logique
//
// Ces quatre invariants sont exactement ceux qu'un accès direct à Prisma
// contournerait. C'est pourquoi rien, en dehors de `server/services/`, n'appelle
// `prisma.article.update` ni ses semblables.

/** Client ou client transactionnel : les fonctions internes acceptent les deux. */
type ClientPrisma = Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma

/**
 * Trouve un slug libre à partir d'une base dérivée du titre.
 *
 * La relecture se fait DANS la transaction d'insertion, jamais par une
 * vérification préalable qui laisserait une fenêtre de concurrence, et jamais
 * par un compteur en mémoire qui ignorerait ce que la base contient déjà
 * (research.md D17).
 */
async function slugLibre(tx: ClientPrisma, base: string): Promise<string> {
  let candidat = base
  let suffixe = 2

  while (await tx.article.findUnique({ where: { slug: candidat }, select: { id: true } })) {
    candidat = `${base}-${suffixe}`
    suffixe += 1
  }

  return candidat
}

/** Refuse une rubrique absente ou inconnue (FR-006). */
async function exigerRubrique(tx: ClientPrisma, rubriqueId: string): Promise<void> {
  const rubrique = await tx.rubrique.findUnique({ where: { id: rubriqueId }, select: { id: true } })
  if (!rubrique) {
    throw new ErreurValidation(`La rubrique « ${rubriqueId} » n'existe pas.`)
  }
}

/**
 * Crée un article.
 *
 * L'ordre des opérations est le contrat : valider, PUIS assainir, PUIS écrire.
 * Le corps n'atteint jamais la base sans être passé par la liste blanche
 * (FR-011, porte 11).
 */
export async function creerArticle(donnees: DonneesCreationArticle) {
  const valides = valider(schemaCreationArticle, donnees)

  return prisma.$transaction(async (tx) => {
    await exigerRubrique(tx, valides.rubriqueId)

    let slug: string
    if (valides.slug === undefined) {
      // Slug dérivé : une collision se résout par un suffixe distinctif.
      slug = await slugLibre(tx, deriverSlug(valides.titre))
    }
    else {
      // Slug CHOISI : une collision est un refus. Y coller un suffixe donnerait
      // à l'auteur une adresse qu'il n'a pas demandée, en silence (FR-009).
      const occupe = await tx.article.findUnique({
        where: { slug: valides.slug },
        select: { id: true },
      })
      if (occupe) {
        throw new ErreurValidation(`Le slug « ${valides.slug} » est déjà pris.`)
      }
      slug = valides.slug
    }

    return tx.article.create({
      data: {
        ...valides,
        slug,
        corps: assainir(valides.corps),
        statut: valides.statut ?? 'brouillon',
      },
    })
  })
}

/**
 * Modifie un article. Partiel, avec les mêmes garanties que la création :
 * mêmes bornes, même assainissement, mêmes refus.
 */
export async function modifierArticle(id: string, donnees: DonneesModificationArticle) {
  const valides = valider(schemaModificationArticle, donnees)

  return prisma.$transaction(async (tx) => {
    const existant = await tx.article.findUnique({ where: { id }, select: { id: true } })
    if (!existant) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${id} ».`)
    }

    if (valides.rubriqueId !== undefined) {
      await exigerRubrique(tx, valides.rubriqueId)
    }

    if (valides.slug !== undefined) {
      const occupe = await tx.article.findUnique({
        where: { slug: valides.slug },
        select: { id: true },
      })
      if (occupe && occupe.id !== id) {
        throw new ErreurValidation(`Le slug « ${valides.slug} » est déjà pris.`)
      }
    }

    return tx.article.update({
      where: { id },
      data: {
        ...valides,
        // Le corps modifié repasse par la liste blanche : un HTML déjà stocké
        // était sûr, celui qui arrive ne l'est pas encore.
        ...(valides.corps !== undefined ? { corps: assainir(valides.corps) } : {}),
      },
    })
  })
}

/**
 * Supprime un article, DÉFINITIVEMENT : ni corbeille, ni archivage (FR-029).
 *
 * Refusée tant que l'article occupe un rang de Une. Le retirer d'abord est un
 * geste éditorial délibéré ; l'automatiser ici ferait disparaître un article de
 * la page d'accueil sans que personne l'ait décidé.
 */
export async function supprimerArticle(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({
      where: { id },
      select: { id: true, rangUne: true },
    })

    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${id} ».`)
    }

    if (article.rangUne !== null) {
      throw new ErreurValidation(
        `Cet article occupe le rang ${article.rangUne} de la Une : retirez-le de la Une avant de le supprimer.`,
      )
    }

    await tx.article.delete({ where: { id } })
  })
}

// ---------------------------------------------------------------------------
// Lecture publique
//
// Ces trois fonctions appliquent TOUTES le critère de visibilité, et il n'existe
// AUCUN paramètre pour le désactiver (FR-013). Une fonction capable de montrer
// un brouillon sur simple argument serait une fuite en attente d'un appel
// négligent. Une page qui aurait besoin de voir un brouillon relève de
// l'administration, donc d'un autre contrat, fermé par défaut.
// ---------------------------------------------------------------------------

export interface OptionsListe {
  /** Restreint à une rubrique. Absent : toutes rubriques. */
  rubriqueId?: string
  /** Instant d'évaluation de la visibilité. Par défaut, maintenant. */
  instant?: Date
  limite?: number
  decalage?: number
}

/** Les articles visibles du public, les plus récents d'abord. */
export async function listerArticlesPublics(options: OptionsListe = {}) {
  const { rubriqueId, instant, limite, decalage } = options

  return prisma.article.findMany({
    where: {
      ...filtreVisible(instant),
      ...(rubriqueId ? { rubriqueId } : {}),
    },
    // La couverture est jointe pour que la couche de présentation dispose de sa
    // CLÉ de stockage et en calcule l'URL à la lecture (research D9). Ajout
    // rétrocompatible : les appelants existants reçoivent un champ en plus. La
    // base ne range toujours qu'une clé, jamais une URL (porte 9).
    include: { couverture: true },
    orderBy: { publieLe: 'desc' },
    ...(limite !== undefined ? { take: limite } : {}),
    ...(decalage !== undefined ? { skip: decalage } : {}),
  })
}

/**
 * Compte les articles visibles du public — total de pagination (research D3).
 *
 * Emploie EXACTEMENT le même `where` que `listerArticlesPublics` : un total qui
 * dériverait d'un autre filtre trahirait le découpage des pages (SC-002). C'est
 * la raison d'être de `filtreVisible`, partagé et jamais recopié.
 */
export async function compterArticlesPublics(
  options: Pick<OptionsListe, 'rubriqueId' | 'instant'> = {},
): Promise<number> {
  const { rubriqueId, instant } = options

  return prisma.article.count({
    where: {
      ...filtreVisible(instant),
      ...(rubriqueId ? { rubriqueId } : {}),
    },
  })
}

/**
 * L'article portant ce slug, ou `null` s'il n'est PAS VISIBLE.
 *
 * Le `null` recouvre deux cas — l'article n'existe pas, l'article existe mais
 * n'est pas paru — et c'est délibéré : distinguer les deux renseignerait un
 * visiteur sur l'existence d'un brouillon.
 */
export async function articlePublicParSlug(slug: string, instant?: Date) {
  return prisma.article.findFirst({
    where: { slug, ...filtreVisible(instant) },
    include: { couverture: true },
  })
}

/**
 * Les articles à la Une, PAR RANG CROISSANT (FR-018).
 *
 * Le `nulls: 'last'` n'est pas cosmétique. L'ordre des nuls au tri est OPPOSÉ
 * entre les deux moteurs — SQLite les place en tête en ordre croissant,
 * PostgreSQL en queue (research.md D7). Un `orderBy: { rangUne: 'asc' }` nu
 * donnerait une Une parfaitement correcte en développement et retournerait,
 * après migration, tous les articles hors Une d'abord : ni erreur, ni
 * avertissement, sur la page d'accueil.
 *
 * Le filtre `not: null` rend de toute façon le tri insensible aux nuls. Le
 * `nulls: 'last'` est conservé comme ceinture et bretelles : le jour où
 * quelqu'un réutilisera ce tri sans le filtre, le comportement restera juste.
 */
export async function lireUne(instant?: Date) {
  return prisma.article.findMany({
    where: { rangUne: { not: null }, ...filtreVisible(instant) },
    include: { couverture: true },
    orderBy: { rangUne: { sort: 'asc', nulls: 'last' } },
  })
}

// ---------------------------------------------------------------------------
// Lecture d'ADMINISTRATION
//
// Un chemin de lecture DISTINCT des lectures publiques (research.md D12) : il
// n'applique PAS `filtreVisible`, donc l'admin voit les brouillons ET les
// articles datés du futur. Il ne rouvre pas la fuite fermée par la 002 — il vit
// derrière `exigerCompte`, contrat fermé par défaut.
// ---------------------------------------------------------------------------

export interface OptionsListeAdmin {
  /** Sous-chaîne du titre, insensible à la casse (LIKE de SQLite). */
  q?: string
  rubriqueId?: string
  statut?: 'brouillon' | 'publie'
  page?: number
  taille?: number
}

/**
 * Le filtre partagé par la liste et son comptage : un total dérivé d'un autre
 * `where` trahirait le découpage des pages. Filtres cumulables, tous côté
 * serveur. Le `contains` de SQLite est insensible à la casse pour l'ASCII —
 * jamais `mode: 'insensitive'`, que l'adaptateur SQLite refuse.
 */
function critereAdmin(options: OptionsListeAdmin) {
  const { q, rubriqueId, statut } = options
  return {
    ...(q ? { titre: { contains: q } } : {}),
    ...(rubriqueId ? { rubriqueId } : {}),
    ...(statut ? { statut } : {}),
  }
}

/** La liste d'administration, la plus récemment MODIFIÉE d'abord (FR-005). */
export async function listerArticlesAdmin(options: OptionsListeAdmin = {}) {
  const { page = 1, taille = 20 } = options
  return prisma.article.findMany({
    where: critereAdmin(options),
    // La couverture est jointe pour la vignette de table (data-model §4).
    include: { couverture: true },
    orderBy: { modifieLe: 'desc' },
    skip: (page - 1) * taille,
    take: taille,
  })
}

/** Le total de la liste d'administration — MÊME critère (research.md D12). */
export async function compterArticlesAdmin(options: OptionsListeAdmin = {}): Promise<number> {
  return prisma.article.count({ where: critereAdmin(options) })
}

/**
 * L'article COMPLET pour l'éditeur — corps compris, couverture jointe, brouillon
 * compris. `null` si l'identifiant est inconnu. Contrat d'administration, gardé :
 * il montre ce que les lectures publiques cachent.
 */
export async function articleAdminParId(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: { couverture: true },
  })
}

// ---------------------------------------------------------------------------
// Transitions de publication
// ---------------------------------------------------------------------------

/**
 * La porte de PUBLICATION sur le CONTENU (FR-014/US3) : titre, chapô et corps
 * non vides. La couverture et son `alt` restent contrôlés par `publierArticle`
 * (002). Cette porte nomme le premier champ TEXTUEL manquant — un brouillon peut
 * être incomplet ; c'est la publication qui exige la complétude.
 *
 * Un corps « vide » est un corps sans texte ET sans média : `<img>` seul est un
 * contenu (une planche photo est publiable).
 */
export function verifierCompletudePublication(article: {
  titre: string
  chapo: string
  corps: string
}): void {
  if (article.titre.trim() === '') {
    throw new ErreurValidation('Un article ne peut pas être publié sans titre.')
  }
  if (article.chapo.trim() === '') {
    throw new ErreurValidation('Un article ne peut pas être publié sans chapô.')
  }
  const texte = article.corps.replace(/<[^>]*>/g, '').trim()
  const aMedia = /<(img|figure)\b/i.test(article.corps)
  if (texte === '' && !aMedia) {
    throw new ErreurValidation('Un article ne peut pas être publié avec un corps vide.')
  }
}

/**
 * Publie un article.
 *
 * REFUSE si la couverture ou son texte alternatif manquent ou sont vides
 * (FR-014). Un brouillon peut être incomplet — c'est la TRANSITION qui est
 * contrôlée, pas l'état de repos. Un `alt` vide est un défaut au sens du
 * principe VIII, pas une valeur.
 *
 * Sans date fournie, pose l'instant du passage. Sur un article déjà publié une
 * fois, laisse `publieLe` INCHANGÉE : republier ne fait pas remonter un article
 * en tête de liste (FR-014a).
 */
export async function publierArticle(id: string, publieLe?: Date) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({ where: { id } })
    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${id} ».`)
    }

    if (!article.couvertureId) {
      throw new ErreurValidation(
        'Un article ne peut pas être publié sans image de couverture.',
      )
    }

    if (!article.couvertureAlt || article.couvertureAlt.trim() === '') {
      throw new ErreurValidation(
        'La couverture doit porter un texte alternatif réel avant publication.',
      )
    }

    return tx.article.update({
      where: { id },
      data: {
        statut: 'publie',
        // Une date explicite prime toujours ; sinon on ne redate JAMAIS un
        // article déjà paru, et on pose l'instant du passage s'il ne l'est pas.
        publieLe: publieLe ?? article.publieLe ?? new Date(),
      },
    })
  })
}

/**
 * Repasse un article en brouillon.
 *
 * `publieLe` est CONSERVÉE pour que la republication ne redate pas (FR-014a).
 * Le rang de Une, lui, est libéré : un article invisible du public ne peut pas
 * occuper une place sur la page d'accueil (FR-017, US4 scénario 4).
 */
export async function depublierArticle(id: string) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({ where: { id }, select: { id: true } })
    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${id} ».`)
    }

    return tx.article.update({
      where: { id },
      data: { statut: 'brouillon', rangUne: null },
    })
  })
}
