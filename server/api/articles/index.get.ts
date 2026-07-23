import { compterArticlesPublics, listerArticlesPublics } from '../../services/articles'
import { rubriqueParId } from '../../services/rubriques'
import { listePagineeDe } from '../../utils/presentation'
import type { RubriqueId } from '../../../shared/utils/rubriques.ts'

// GET /api/articles — liste paginée (contrat routes-serveur).
//
// Sert DEUX écrans : `/articles` (toutes rubriques) et `/rubrique/[id]` (une
// rubrique). La visibilité de 002 s'applique sans échappatoire ; la route ne
// fait que paginer, valider et mapper en DTO.

/** Taille de page — fixée à l'implémentation (research D3, spec pagination). */
const TAILLE = 12

/**
 * Lit `page` de la requête : un entier ≥ 1, défaut 1. Toute autre forme
 * (non entière, < 1, non numérique) est un 404 — pas un repli silencieux sur 1,
 * qui servirait un 200 sur une adresse fautive (mauvais pour le SEO, research D3).
 */
function lirePage(brut: unknown): number {
  if (brut === undefined) return 1
  const valeur = Array.isArray(brut) ? brut[0] : brut
  const texte = String(valeur)
  // `Number()` accepte les décimaux et les espaces ; on exige des chiffres nus.
  if (!/^\d+$/.test(texte)) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
  }
  const page = Number.parseInt(texte, 10)
  if (page < 1) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
  }
  return page
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = lirePage(query.page)

  // Rubrique optionnelle. Fournie mais inconnue → 404 (et non « toutes rubriques »).
  let rubrique: { id: RubriqueId, libelle: string } | null = null
  let rubriqueId: RubriqueId | undefined
  if (query.rubrique !== undefined) {
    const id = Array.isArray(query.rubrique) ? query.rubrique[0] : String(query.rubrique)
    const trouvee = await rubriqueParId(id)
    if (!trouvee) {
      throw createError({ statusCode: 404, statusMessage: 'Rubrique introuvable' })
    }
    rubriqueId = trouvee.id as RubriqueId
    rubrique = { id: trouvee.id as RubriqueId, libelle: trouvee.libelle }
  }

  const total = await compterArticlesPublics({ rubriqueId })
  const totalPages = Math.ceil(total / TAILLE)

  // Hors bornes → 404. Une rubrique VIDE (total 0, page 1) n'est pas une erreur :
  // c'est l'état vide, rendu par la page rubrique (research D3).
  if (total > 0 && page > totalPages) {
    throw createError({ statusCode: 404, statusMessage: 'Page introuvable' })
  }

  const articles = await listerArticlesPublics({
    rubriqueId,
    limite: TAILLE,
    decalage: (page - 1) * TAILLE,
  })

  return listePagineeDe({
    articles,
    page,
    taille: TAILLE,
    total,
    // Dans une rubrique, l'eyebrow bascule sur le sous-thème ; sinon la rubrique.
    contexte: rubriqueId ?? null,
    rubrique,
  })
})
