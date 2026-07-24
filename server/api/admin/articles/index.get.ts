import { exigerCompte } from '../../../utils/session'
import { traiterMetier } from '../../../utils/metier'
import { compterArticlesAdmin, listerArticlesAdmin } from '../../../services/articles'
import { ligneArticleAdminDe } from '../../../utils/presentation'
import { valider } from '../../../validation/erreurs'
import { schemaFiltresListe } from '../../../validation/article'
import type { ListeAdminDTO } from '../../../../shared/types/dto.ts'

// GET /api/admin/articles — liste filtrée et paginée (FR-005/007/008).
//
// GARDÉE par `exigerCompte` en première ligne (porte 12) : sans session, 401,
// aucun effet. À la différence des lectures publiques, elle montre les
// brouillons ET les articles datés du futur (chemin d'administration, D12).

export default defineEventHandler(async (event): Promise<ListeAdminDTO> => {
  await exigerCompte(event)

  return traiterMetier(async () => {
    // Un filtre vide n'est pas un refus : on le retire avant validation, plutôt
    // que de rejeter `?q=` (champ effacé côté client) comme une entrée fautive.
    const brut = getQuery(event)
    const propre = Object.fromEntries(
      Object.entries(brut).filter(([, valeur]) => valeur !== '' && valeur != null),
    )
    const filtres = valider(schemaFiltresListe, propre)

    const [articles, total] = await Promise.all([
      listerArticlesAdmin(filtres),
      compterArticlesAdmin(filtres),
    ])

    return {
      articles: articles.map(ligneArticleAdminDe),
      page: filtres.page,
      taille: filtres.taille,
      total,
      totalPages: Math.ceil(total / filtres.taille),
    }
  })
})
