import { exigerCompte } from '../../../utils/session'
import { traiterMetier } from '../../../utils/metier'
import { articleAdminParId, supprimerArticle } from '../../../services/articles'
import { retirerDeLaUne } from '../../../services/une'

// DELETE /api/admin/articles/[id] — supprimer DÉFINITIVEMENT (FR-028/029).
//
// GARDÉE par `exigerCompte`. Si l'article occupe un rang de la Une, la route le
// RETIRE DE LA UNE AU PASSAGE (`retirerDeLaUne` puis `supprimerArticle`) : une
// seule action pour la rédaction, et l'accueil ne présente aucun emplacement
// orphelin (US5 sc.4). `supprimerArticle` (002) refuse seul un épinglé — c'est
// la route qui orchestre le dépinglage, sans modifier le service.

export default defineEventHandler(async (event) => {
  await exigerCompte(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  return traiterMetier(async () => {
    const article = await articleAdminParId(id)
    if (!article) {
      throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
    }

    if (article.rangUne !== null) {
      await retirerDeLaUne(id)
    }
    await supprimerArticle(id)

    setResponseStatus(event, 204)
    return null
  })
})
