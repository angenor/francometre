import { exigerCompte } from '../../../../utils/session'
import { traiterMetier } from '../../../../utils/metier'
import { articleAdminParId, depublierArticle } from '../../../../services/articles'
import { articleEditionDe } from '../../../../utils/presentation'
import type { ArticleEditionDTO } from '../../../../../shared/types/dto.ts'

// POST /api/admin/articles/[id]/depublier — repasser en brouillon (FR-017).
//
// GARDÉE par `exigerCompte`. `depublierArticle` (002) remet le statut à
// `brouillon` et LIBÈRE `rangUne` (un article invisible ne peut occuper la Une),
// mais CONSERVE `publieLe` — republier ne redate pas.

export default defineEventHandler(async (event): Promise<ArticleEditionDTO> => {
  await exigerCompte(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  return traiterMetier(async () => {
    await depublierArticle(id)

    const complet = await articleAdminParId(id)
    if (!complet) {
      throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
    }
    return articleEditionDe(complet)
  })
})
