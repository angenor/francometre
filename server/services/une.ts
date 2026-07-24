import { prisma } from '../utils/db'
import { rangUne as schemaRang } from '../validation/article'
import { schemaOrdreUne } from '../validation/une'
import { ErreurValidation, valider } from '../validation/erreurs'

// La Une — cinq rangs ordonnés.
//
// Deux garanties de nature DIFFÉRENTE se répartissent ici, et les confondre
// serait une erreur de raisonnement (research.md D6) :
//
//   · l'UNICITÉ du rang est garantie par la BASE (`@unique`) — deux écritures
//     concurrentes ne peuvent pas passer toutes les deux ;
//   · l'INTERVALLE 1–5 est garanti par Zod — aucune contrainte de base ne
//     l'exprime, et l'unicité n'en dit rien.
//
// Limite explicite et assumée : rien ne garantit que les cinq rangs soient tous
// pourvus. Un trou (1, 2, 4, 5) est un état VALIDE du modèle. C'est au
// back-office de le rendre visible ; le prétendre invariant reviendrait à
// interdire tout état transitoire de composition.

/** L'état de la Une après opération : les articles placés, par rang croissant. */
async function etatDeLaUne(tx: { article: typeof prisma.article }) {
  return tx.article.findMany({
    where: { rangUne: { not: null } },
    orderBy: { rangUne: { sort: 'asc', nulls: 'last' } },
  })
}

/**
 * Place un article à un rang de la Une.
 *
 * ÉVICTION (FR-016a) : placer un article sur un rang occupé déloge l'occupant,
 * qui quitte la Une. L'opération RÉUSSIT, elle n'échoue pas.
 *
 * Le tout s'exécute dans UNE transaction. Sans elle, la contrainte d'unicité
 * rejetterait l'instant où deux articles portent brièvement le même rang — ou
 * pire, laisserait la Une trouée si la seconde écriture échouait.
 */
export async function placerALaUne(articleId: string, rang: number) {
  // L'intervalle est vérifié AVANT d'ouvrir la transaction : inutile de
  // toucher la base pour un rang 6.
  const rangValide = valider(schemaRang, rang)

  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({
      where: { id: articleId },
      select: { id: true, statut: true },
    })

    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${articleId} ».`)
    }

    // À la Une ⇒ publié (FR-017). Un brouillon en page d'accueil serait le même
    // incident éditorial que la fuite de visibilité d'US3.
    if (article.statut !== 'publie') {
      throw new ErreurValidation(
        'Un brouillon ne peut pas être placé à la Une : publiez-le d\'abord.',
      )
    }

    // 1. L'occupant du rang libère la place — y compris si c'est l'article
    //    lui-même, auquel cas l'opération est un déplacement sans effet.
    await tx.article.updateMany({
      where: { rangUne: rangValide },
      data: { rangUne: null },
    })

    // 2. L'article prend le rang. Entre les deux, aucun état à deux articles
    //    au même rang n'existe — la transaction le rend inobservable.
    await tx.article.update({
      where: { id: articleId },
      data: { rangUne: rangValide },
    })

    return etatDeLaUne(tx)
  })
}

/**
 * Épingle un article à un rang — en PUBLIANT d'abord s'il est brouillon (D11,
 * chemin éditeur FR-021/025). Dans UNE transaction : si l'article est brouillon,
 * on applique les MÊMES gardes que `publierArticle` (couverture + `alt` requis)
 * puis on passe `publie` (sans redater une republication) ; ensuite éviction du
 * rang et placement, comme `placerALaUne`.
 *
 * Une transaction unique évite la fenêtre où l'article serait publié mais non
 * placé (ou l'inverse) si l'orchestration se faisait en deux appels.
 */
export async function epinglerArticle(articleId: string, rang: number) {
  const rangValide = valider(schemaRang, rang)

  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({ where: { id: articleId } })
    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${articleId} ».`)
    }

    // Brouillon : gardes de publication (couverture + alt), puis publie.
    if (article.statut !== 'publie') {
      if (!article.couvertureId) {
        throw new ErreurValidation('Un article ne peut pas être publié sans image de couverture.')
      }
      if (!article.couvertureAlt || article.couvertureAlt.trim() === '') {
        throw new ErreurValidation('La couverture doit porter un texte alternatif réel avant publication.')
      }
      await tx.article.update({
        where: { id: articleId },
        data: { statut: 'publie', publieLe: article.publieLe ?? new Date() },
      })
    }

    // Éviction du rang occupé puis placement — aucun état à deux articles au
    // même rang n'est observable (la transaction le rend indivisible).
    await tx.article.updateMany({ where: { rangUne: rangValide }, data: { rangUne: null } })
    await tx.article.update({ where: { id: articleId }, data: { rangUne: rangValide } })

    return etatDeLaUne(tx)
  })
}

/** Retire un article de la Une. Son rang redevient libre. */
export async function retirerDeLaUne(articleId: string) {
  return prisma.$transaction(async (tx) => {
    const article = await tx.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    })

    if (!article) {
      throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${articleId} ».`)
    }

    await tx.article.update({ where: { id: articleId }, data: { rangUne: null } })

    return etatDeLaUne(tx)
  })
}

/**
 * Réordonne la Une (D10) — `ordre` est la liste ordonnée (≤ 5) des identifiants.
 * En UNE transaction : table rase des rangs, puis `rangUne = index + 1`. L'ordre
 * du tableau DEVIENT l'ordre de l'accueil (FR-027).
 *
 * REFUSE un identifiant inconnu ou non publié (à la Une ⇒ publié, FR-017), un
 * doublon ou une longueur > 5 (Zod). La table rase couvre les rangs de la liste
 * ET les épinglés absents de la liste : on repart d'un état propre, sans qu'un
 * doublon de rang puisse jamais exister (la contrainte `@unique` le garantit
 * aussi).
 */
export async function reordonnerUne(ordre: string[]) {
  const valides = valider(schemaOrdreUne, { ordre }).ordre

  return prisma.$transaction(async (tx) => {
    for (const id of valides) {
      const article = await tx.article.findUnique({
        where: { id },
        select: { id: true, statut: true },
      })
      if (!article) {
        throw new ErreurValidation(`Aucun article ne porte l'identifiant « ${id} ».`)
      }
      if (article.statut !== 'publie') {
        throw new ErreurValidation(
          'Un brouillon ne peut pas figurer à la Une : publiez-le d\'abord.',
        )
      }
    }

    // Table rase : tous les rangs libérés d'abord.
    await tx.article.updateMany({
      where: { rangUne: { not: null } },
      data: { rangUne: null },
    })
    // Réassignation dans l'ordre du tableau.
    for (const [index, id] of valides.entries()) {
      await tx.article.update({ where: { id }, data: { rangUne: index + 1 } })
    }

    return etatDeLaUne(tx)
  })
}

/** Les articles épinglés (rangUne 1..5), par rang croissant, couverture jointe. */
export async function articlesEpingles() {
  return prisma.article.findMany({
    where: { rangUne: { not: null } },
    include: { couverture: true },
    orderBy: { rangUne: { sort: 'asc', nulls: 'last' } },
  })
}

/**
 * Les articles PUBLIABLES pour la colonne d'épinglage : publiés, NON épinglés,
 * filtrables par titre. Un article daté du futur (embargo) reste publiable — il
 * paraîtra en Une à son échéance.
 */
export async function articlesPubliables(q?: string) {
  return prisma.article.findMany({
    where: {
      statut: 'publie',
      rangUne: null,
      ...(q ? { titre: { contains: q } } : {}),
    },
    include: { couverture: true },
    orderBy: { publieLe: 'desc' },
  })
}
