import { exigerCompte } from '../../../utils/session'
import { articlesEpingles, articlesPubliables } from '../../../services/une'
import { articlePubliableDe, emplacementsUneDe } from '../../../utils/presentation'
import type { CompositionUneDTO } from '../../../../shared/types/dto.ts'

// GET /api/admin/une — composition courante + publiables (FR-022/023).
//
// GARDÉE par `exigerCompte`. Cinq emplacements (rang 1..5, article ou null) et
// les articles publiés NON épinglés, filtrables par `q` (colonne d'épinglage).

export default defineEventHandler(async (event): Promise<CompositionUneDTO> => {
  await exigerCompte(event)

  const brut = getQuery(event).q
  const q = typeof brut === 'string' && brut.trim() !== '' ? brut.trim() : undefined

  const [epingles, publiables] = await Promise.all([
    articlesEpingles(),
    articlesPubliables(q),
  ])

  return {
    emplacements: emplacementsUneDe(epingles),
    publiables: publiables.map(articlePubliableDe),
  }
})
