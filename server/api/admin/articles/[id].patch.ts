import { exigerCompte } from '../../../utils/session'
import { traiterMetier } from '../../../utils/metier'
import { articleAdminParId, modifierArticle } from '../../../services/articles'
import { articleEditionDe } from '../../../utils/presentation'
import type { ArticleEditionDTO } from '../../../../shared/types/dto.ts'

// PATCH /api/admin/articles/[id] — modifier / autosave (FR-016, FR-016a).
//
// GARDÉE par `exigerCompte` — un 401 (session expirée) remonte TEL QUEL : le
// client conserve la saisie et redirige vers la connexion. `modifierArticle`
// (002) rassainit le corps à chaque écriture (porte 11). Le `statut` du client
// n'est JAMAIS transmis : PATCH ne publie pas (contrat routes-serveur).

export default defineEventHandler(async (event): Promise<ArticleEditionDTO> => {
  await exigerCompte(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }

  return traiterMetier(async () => {
    const body = await readBody(event)

    // Liste blanche — `statut`/`publieLe`/`rangUne` exclus. Un champ absent
    // (undefined) est ignoré par Prisma ; `couvertureId: null` retire la couverture.
    await modifierArticle(id, {
      titre: body?.titre,
      chapo: body?.chapo,
      corps: body?.corps,
      rubriqueId: body?.rubriqueId,
      sousTheme: body?.sousTheme,
      auteur: body?.auteur,
      couvertureId: body?.couvertureId,
      couvertureAlt: body?.couvertureAlt,
    })

    const complet = await articleAdminParId(id)
    if (!complet) {
      throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
    }
    return articleEditionDe(complet)
  })
})
