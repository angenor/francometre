import { exigerCompte } from '../../../utils/session'
import { articleAdminParId } from '../../../services/articles'
import { articleEditionDe } from '../../../utils/presentation'
import type { ArticleEditionDTO } from '../../../../shared/types/dto.ts'

// GET /api/admin/articles/[id] — lire pour édition (brouillon compris).
//
// GARDÉE par `exigerCompte`. Montre ce que les lectures publiques cachent (le
// corps complet, un brouillon). 404 si l'identifiant est inconnu.

export default defineEventHandler(async (event): Promise<ArticleEditionDTO> => {
  await exigerCompte(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  const article = await articleAdminParId(id)
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  return articleEditionDe(article)
})
