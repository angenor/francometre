import { lireUne, listerArticlesPublics } from '../services/articles'
import { carteDe, uneDe } from '../utils/presentation'
import { libelleRubrique, type RubriqueId } from '../../shared/utils/rubriques.ts'
import type { AccueilDTO, SectionAccueilDTO } from '../../shared/types/dto.ts'

// GET /api/accueil — compose l'accueil éditorialisé (contrat routes-serveur).
//
// Trois blocs, tous dérivés des lectures publiques de 002 : la Une (rangs 1–5),
// les derniers articles toutes rubriques, et les sections des rubriques mises en
// avant. Invariants : jamais de héros vide, jamais de vignette vide, jamais de
// section vide (FR-008).

/** Nombre de derniers articles — aligné sur la grille de `accueil.html` (grid-4). */
const DERNIERS = 8
/** Articles par section de rubrique — grille à quatre colonnes. */
const PAR_SECTION = 4

/** Rubriques mises en avant, dans l'ordre imposé (contrat routes-serveur). */
const MISES_EN_AVANT: RubriqueId[] = ['environnement', 'economie', 'culture']

export default defineEventHandler(async (): Promise<AccueilDTO> => {
  const [placesUne, derniers] = await Promise.all([
    lireUne(),
    listerArticlesPublics({ limite: DERNIERS }),
  ])

  // Une section de rubrique SANS article publié est omise — jamais rendue vide.
  const sections: SectionAccueilDTO[] = []
  for (const id of MISES_EN_AVANT) {
    const articles = await listerArticlesPublics({ rubriqueId: id, limite: PAR_SECTION })
    if (articles.length === 0) continue
    sections.push({
      rubrique: { id, libelle: libelleRubrique(id) ?? id, chemin: `/rubrique/${id}` },
      // Contexte = la rubrique de la section : l'eyebrow de ses cartes bascule
      // sur le sous-thème.
      articles: articles.map((article) => carteDe(article, id)),
    })
  }

  return {
    une: uneDe(placesUne),
    // Les derniers sont toutes rubriques confondues : eyebrow = la rubrique.
    derniers: derniers.map((article) => carteDe(article, null)),
    sections,
  }
})
