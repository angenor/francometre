import { exigerCompte } from '../../../utils/session'
import { traiterMetier } from '../../../utils/metier'
import { articleAdminParId, creerArticle } from '../../../services/articles'
import { articleEditionDe } from '../../../utils/presentation'
import type { ArticleEditionDTO } from '../../../../shared/types/dto.ts'

// POST /api/admin/articles — créer (FR-009). Sert la CRÉATION PARESSEUSE de
// l'autosave (research.md D8) : le premier enregistrement d'un article neuf
// crée le brouillon, la suite passe en PATCH.
//
// GARDÉE par `exigerCompte`. `creerArticle` (002) valide → **assainit** → écrit.
// Le `statut` du client n'est JAMAIS transmis : une création reste un brouillon
// (défaut du service), la publication ne passe que par la route dédiée.

export default defineEventHandler(async (event): Promise<ArticleEditionDTO> => {
  await exigerCompte(event)

  return traiterMetier(async () => {
    const body = await readBody(event)

    // Liste blanche des champs éditables — `statut`/`publieLe`/`rangUne` exclus :
    // ni la création ni l'autosave ne publient (contrat routes-serveur).
    const cree = await creerArticle({
      titre: body?.titre,
      chapo: body?.chapo,
      corps: body?.corps ?? '',
      rubriqueId: body?.rubriqueId,
      sousTheme: body?.sousTheme,
      auteur: body?.auteur,
      couvertureId: body?.couvertureId,
      couvertureAlt: body?.couvertureAlt,
    })

    // Relu complet (couverture jointe) pour renvoyer l'état d'édition — le client
    // bascule alors en édition sur l'`id` obtenu.
    const complet = await articleAdminParId(cree.id)
    setResponseStatus(event, 201)
    return articleEditionDe(complet!)
  })
})
