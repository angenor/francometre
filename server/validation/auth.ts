import { z } from 'zod'

// Validation de la connexion — STRUCTURER l'entrée, pas RENSEIGNER sur l'échec.
//
// Zod garantit ici la seule chose qui compte pour la route : les deux champs
// sont présents. Il ne pose NI borne de longueur, NI format e-mail bloquant —
// un identifiant mal formé, un mot de passe trop court, un champ vide aboutissent
// tous au MÊME échec générique (data-model §4, FR-009/FR-011). Les messages Zod
// par champ restent internes : l'utilisateur ne voit jamais que le message unique.

export const schemaConnexion = z.object({
  identifiant: z.string({ error: 'L\'identifiant est requis.' }).trim().min(1, {
    error: 'L\'identifiant est requis.',
  }),
  // Aucune borne haute : la politique de longueur ne doit pas transparaître, et
  // un ancien mot de passe plus court que le minimum de CRÉATION doit pouvoir se
  // vérifier. Toute erreur de saisie retombe sur le message unique.
  motDePasse: z.string({ error: 'Le mot de passe est requis.' }).min(1, {
    error: 'Le mot de passe est requis.',
  }),
})

export type DonneesConnexion = z.infer<typeof schemaConnexion>

/**
 * Le message d'échec — UNIQUE et indistinct. Servi à l'identique pour un
 * identifiant inconnu, un mot de passe faux, un champ vide ou un débit dépassé :
 * aucun de ces cas ne se distingue d'un autre (FR-009/FR-011/FR-011a).
 */
export const MESSAGE_ECHEC = 'E-mail ou mot de passe incorrect.'

/**
 * Ramène un paramètre `retour` à un chemin INTERNE sûr, ou à `/admin`.
 *
 * Anti-open-redirect (FR-007) : un `retour` n'est accepté que s'il commence par
 * un seul `/` — donc un chemin du site — et jamais par `//` ni `/\`, que les
 * navigateurs interprètent comme une autorité externe (`//evil.com`). Tout le
 * reste (absent, absolu, protocole, non-chaîne) retombe sur `/admin`.
 */
export function cheminDeRetourSur(retour: unknown): string {
  if (typeof retour !== 'string') return '/admin'
  if (!retour.startsWith('/')) return '/admin'
  if (retour.startsWith('//') || retour.startsWith('/\\')) return '/admin'
  return retour
}
