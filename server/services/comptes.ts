import argon2 from 'argon2'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ErreurValidation, valider } from '../validation/erreurs'

// Comptes — représentés, pas encore employés.
//
// L'authentification, les sessions et la fermeture des routes d'administration
// sont HORS PÉRIMÈTRE (feature 003). Ce qui est livré ici, c'est la
// représentation et l'impossibilité STRUCTURELLE d'une fuite d'empreinte
// (research.md D11).
//
// Le point qui compte : aucune opération de lecture exposée ne retourne
// `motDePasseHache`. Le type de retour l'exclut — ce n'est pas une omission de
// politesse, c'est une impossibilité de contrat. Un `select` explicite le
// garantit à l'exécution, le type le garantit à la compilation.

/** Les champs qu'un compte expose. `motDePasseHache` n'en fait pas partie. */
const CHAMPS_PUBLICS = {
  id: true,
  identifiant: true,
  nomAffichable: true,
  creeLe: true,
} as const

export interface ComptePublic {
  id: string
  identifiant: string
  nomAffichable: string
  creeLe: Date
}

const schemaCompte = z.object({
  identifiant: z
    .string({ error: 'L\'identifiant est obligatoire.' })
    .trim()
    .min(3, { error: 'L\'identifiant doit compter au moins 3 caractères.' })
    .max(60, { error: 'L\'identifiant ne peut pas dépasser 60 caractères.' }),
  motDePasse: z
    .string({ error: 'Le mot de passe est obligatoire.' })
    .min(12, { error: 'Le mot de passe doit compter au moins 12 caractères.' }),
  nomAffichable: z
    .string({ error: 'Le nom affichable est obligatoire.' })
    .trim()
    .min(1, { error: 'Le nom affichable ne peut pas être vide.' })
    .max(80, { error: 'Le nom affichable ne peut pas dépasser 80 caractères.' }),
})

export type DonneesCompte = z.infer<typeof schemaCompte>

/**
 * Crée un compte. Le mot de passe est haché en argon2id AVANT d'atteindre la
 * base : aucun secret en clair, nulle part (FR-021).
 */
export async function creerCompte(donnees: DonneesCompte): Promise<ComptePublic> {
  const valides = valider(schemaCompte, donnees)

  const existant = await prisma.compte.findUnique({
    where: { identifiant: valides.identifiant },
    select: { id: true },
  })
  if (existant) {
    throw new ErreurValidation(`L'identifiant « ${valides.identifiant} » est déjà pris.`)
  }

  // Variante argon2id, paramètres par défaut de la bibliothèque.
  const motDePasseHache = await argon2.hash(valides.motDePasse, { type: argon2.argon2id })

  return prisma.compte.create({
    data: {
      identifiant: valides.identifiant,
      nomAffichable: valides.nomAffichable,
      motDePasseHache,
    },
    select: CHAMPS_PUBLICS,
  })
}

/** Le compte, SANS l'empreinte, ou `null`. */
export async function compteParIdentifiant(identifiant: string): Promise<ComptePublic | null> {
  return prisma.compte.findUnique({
    where: { identifiant },
    select: CHAMPS_PUBLICS,
  })
}

/**
 * Vérifie un mot de passe. Rend un BOOLÉEN et rien d'autre — ni le compte, ni
 * l'empreinte, ni un message distinguant « compte inconnu » de « mot de passe
 * faux » : cette distinction dirait à un attaquant quels identifiants existent.
 */
export async function verifierMotDePasse(
  identifiant: string,
  motDePasse: string,
): Promise<boolean> {
  // Lecture interne, non exposée : c'est le seul endroit du projet qui lit
  // l'empreinte, et elle ne quitte pas cette fonction.
  const compte = await prisma.compte.findUnique({
    where: { identifiant },
    select: { motDePasseHache: true },
  })

  if (!compte) return false

  try {
    return await argon2.verify(compte.motDePasseHache, motDePasse)
  }
  catch {
    // Une empreinte illisible se répond « non », pas par une panne.
    return false
  }
}
