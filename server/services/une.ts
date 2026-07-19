import { prisma } from '../utils/db'
import { rangUne as schemaRang } from '../validation/article'
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
