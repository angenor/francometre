// Les rôles de compte — source UNIQUE.
//
// Le principe VI proscrit un enum porté par la base : le rôle est un `String`
// en base (`Compte.role`), et c'est ICI, dans un enum applicatif Zod, qu'il est
// contraint. Un seul rôle au MVP ; le champ existe pour ne pas re-migrer plus
// tard, sans sur-conception (ni table de rôles, ni permissions fines).
//
// Importée par le seed (valeur écrite), le service `comptes.ts` (validation) et,
// à venir, le back-office. Un seul endroit déclare les rôles.

import { z } from 'zod'

export const ROLES = ['redaction'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_PAR_DEFAUT: Role = 'redaction'

/** Enum applicatif Zod — jamais un enum de base (principe VI). */
export const schemaRole = z.enum(ROLES)
