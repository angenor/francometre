import { z } from 'zod'

// Validation de l'ordre de la Une (FR-024/026/027, D10).
//
// La forme est vérifiée ici ; l'EXISTENCE et le STATUT « publié » de chaque
// identifiant se vérifient dans le service (une requête base par identifiant).
// Ce qui relève de la forme : au plus cinq rangs, des identifiants non vides et
// UNIQUES (un même article ne peut pas occuper deux rangs).

export const schemaOrdreUne = z.object({
  ordre: z
    .array(
      z
        .string({ error: 'Un identifiant d\'article est attendu.' })
        .trim()
        .min(1, { error: 'Un identifiant d\'article ne peut pas être vide.' }),
    )
    .max(5, { error: 'La Une ne peut porter que cinq articles au maximum.' })
    .refine((liste) => new Set(liste).size === liste.length, {
      error: 'Un même article ne peut pas occuper deux rangs de la Une.',
    }),
})

export type DonneesOrdreUne = z.infer<typeof schemaOrdreUne>
