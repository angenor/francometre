import { prisma } from '../utils/db'
import { schemaMedia, type DonneesMedia } from '../validation/media'
import { ErreurValidation, valider } from '../validation/erreurs'

// Médias — la base ne range que des CLÉS.
//
// Aucune sortie de ce service ne contient d'URL. L'adresse d'affichage
// s'obtient en passant la clé à `Stockage.url()`, qui est la seule fonction du
// projet autorisée à en fabriquer une (contracts/stockage.md).
//
// Cette feature ne téléverse rien : le fichier lui-même n'est pas géré ici.
// Seule la représentation est posée.

/** Enregistre un média. Une clé ressemblant à une URL est refusée (FR-023). */
export async function enregistrerMedia(donnees: DonneesMedia) {
  const valides = valider(schemaMedia, donnees)

  const existant = await prisma.media.findUnique({
    where: { cle: valides.cle },
    select: { id: true },
  })
  if (existant) {
    throw new ErreurValidation(`Un média porte déjà la clé « ${valides.cle} ».`)
  }

  return prisma.media.create({ data: valides })
}

/** Le média portant cet identifiant, ou `null`. */
export async function mediaParId(id: string) {
  return prisma.media.findUnique({ where: { id } })
}

/**
 * Supprime un média — REFUSÉE tant qu'un article le référence.
 *
 * Le schéma porte déjà `onDelete: Restrict`, mais la base produirait une erreur
 * technique brute. Le refus est donc formulé ici, en français, avant d'y
 * arriver : SC-007 porte sur la clarté du refus autant que sur son existence.
 *
 * Le FICHIER n'est pas effacé : il n'y a pas encore de téléversement, donc pas
 * encore de fichier à effacer (contracts/stockage.md §4).
 */
export async function supprimerMedia(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const media = await tx.media.findUnique({ where: { id }, select: { id: true } })
    if (!media) {
      throw new ErreurValidation(`Aucun média ne porte l'identifiant « ${id} ».`)
    }

    const references = await tx.article.count({ where: { couvertureId: id } })
    if (references > 0) {
      throw new ErreurValidation(
        `Ce média est la couverture de ${references} article(s) : retirez-le d'abord de leur couverture.`,
      )
    }

    await tx.media.delete({ where: { id } })
  })
}
