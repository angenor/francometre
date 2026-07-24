import { exigerCompte } from '../../../utils/session'
import { traiterMetier } from '../../../utils/metier'
import { articlesEpingles, articlesPubliables, reordonnerUne } from '../../../services/une'
import { articlePubliableDe, emplacementsUneDe } from '../../../utils/presentation'
import { valider } from '../../../validation/erreurs'
import { schemaOrdreUne } from '../../../validation/une'
import type { CompositionUneDTO } from '../../../../shared/types/dto.ts'

// PUT /api/admin/une — enregistrer l'ordre (FR-024/026/027, D10).
//
// GARDÉE par `exigerCompte`. `reordonnerUne` réassigne les rangs en UNE
// transaction ; c'est cette route, et elle seule, qui fixe l'ordre de l'accueil.
// REFUSE (400) un identifiant non publié, inconnu ou un doublon (message nommé).

export default defineEventHandler(async (event): Promise<CompositionUneDTO> => {
  await exigerCompte(event)

  return traiterMetier(async () => {
    const body = await readBody(event)
    const { ordre } = valider(schemaOrdreUne, body ?? {})

    await reordonnerUne(ordre)

    const [epingles, publiables] = await Promise.all([
      articlesEpingles(),
      articlesPubliables(),
    ])
    return {
      emplacements: emplacementsUneDe(epingles),
      publiables: publiables.map(articlePubliableDe),
    }
  })
})
