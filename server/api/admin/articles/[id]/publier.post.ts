import { exigerCompte } from '../../../../utils/session'
import { traiterMetier } from '../../../../utils/metier'
import {
  articleAdminParId,
  publierArticle,
  verifierCompletudePublication,
} from '../../../../services/articles'
import { epinglerArticle } from '../../../../services/une'
import { articleEditionDe } from '../../../../utils/presentation'
import { valider } from '../../../../validation/erreurs'
import { schemaPublication } from '../../../../validation/article'
import type { ArticleEditionDTO } from '../../../../../shared/types/dto.ts'

// POST /api/admin/articles/[id]/publier — publier (FR-017/021/025).
//
// GARDÉE par `exigerCompte`. La porte de publication, nommant le manquant :
//   1. complétude TEXTUELLE (titre, chapô, corps) — `verifierCompletudePublication` ;
//   2. `publierArticle` — couverture + `alt` requis ; pose `publieLe` si absent,
//      SANS redater une republication ; une date FUTURE est acceptée (embargo) ;
//   3. si `aLaUne`, `epinglerArticle` place au rang (l'article est déjà publié).

export default defineEventHandler(async (event): Promise<ArticleEditionDTO> => {
  await exigerCompte(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  return traiterMetier(async () => {
    const body = await readBody(event)
    const { publieLe, aLaUne } = valider(schemaPublication, body ?? {})

    const article = await articleAdminParId(id)
    if (!article) {
      throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
    }

    // Refus nommé si un champ textuel manque (couverture/alt sont vérifiés ensuite).
    verifierCompletudePublication(article)

    await publierArticle(id, publieLe ? new Date(publieLe) : undefined)
    if (aLaUne) {
      await epinglerArticle(id, aLaUne.rang)
    }

    const complet = await articleAdminParId(id)
    return articleEditionDe(complet!)
  })
})
