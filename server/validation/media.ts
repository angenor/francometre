import { z } from 'zod'

// Validation des médias — porte 9 de la constitution.
//
// La règle « aucune URL en base » n'est pas une convention de nommage : c'est ce
// qui rend la bascule disque → S3 indolore. Une URL persistée serait fausse le
// jour du changement d'hébergement, sur TOUTE la profondeur de l'historique.
//
// Le contrôle est donc ACTIF, pas documentaire (FR-023).

/**
 * Ce qui trahit une adresse déguisée en clé. Les quatre formes sont celles que
 * `scripts/verifier.mjs` rejette également — la validation empêche la cause, le
 * vérifieur constate le symptôme.
 */
const RESSEMBLE_A_UNE_URL = /^(https?:)?\/\/|^data:|^[a-z][a-z0-9+.-]*:\/\//i

const cle = z
  .string({ error: 'La clé de stockage est obligatoire.' })
  .trim()
  .min(1, { error: 'La clé de stockage ne peut pas être vide.' })
  .refine((valeur) => !RESSEMBLE_A_UNE_URL.test(valeur), {
    error:
      'La clé de stockage ne peut pas être une URL : la base ne range que des clés, '
      + 'et l\'adresse se calcule à la lecture par Stockage.url().',
  })

/** Pixels et octets : des entiers strictement positifs, jamais zéro ni négatifs. */
function entierPositif(intitule: string) {
  return z
    .number({ error: `${intitule} doit être un nombre.` })
    .int({ error: `${intitule} doit être un entier.` })
    .positive({ error: `${intitule} doit être strictement positif.` })
}

export const schemaMedia = z.object({
  cle,
  largeur: entierPositif('La largeur'),
  hauteur: entierPositif('La hauteur'),
  poids: entierPositif('Le poids'),
  altParDefaut: z.string().trim().optional(),
})

export type DonneesMedia = z.infer<typeof schemaMedia>
