import { prisma } from '../utils/db'

// Rubriques — LECTURE SEULE, et c'est le point du contrat.
//
// Aucune fonction de création, de modification ou de suppression n'existe ici.
// L'ensemble des huit n'est pas protégé par une vérification qu'on pourrait
// contourner ou oublier : il est figé par l'ABSENCE d'API (FR-004). La source
// de vérité reste `shared/utils/rubriques.ts` ; la table en est le reflet,
// alimenté par le seed, et n'existe que pour porter les clés étrangères.

/** Les huit rubriques, par `ordre` croissant — l'ordre du rail (FR-001, FR-002). */
export async function listerRubriques() {
  return prisma.rubrique.findMany({ orderBy: { ordre: 'asc' } })
}

/** La rubrique portant cet identifiant d'URL, ou `null`. */
export async function rubriqueParId(id: string) {
  return prisma.rubrique.findUnique({ where: { id } })
}
