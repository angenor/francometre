import { articlePublicParSlug, listerArticlesPublics } from '../../services/articles'
import { articleDe, carteDe } from '../../utils/presentation'
import type { RubriqueId } from '../../../shared/utils/rubriques.ts'
import type { ArticlePageDTO } from '../../../shared/types/dto.ts'

// GET /api/articles/[slug] — la page article complète (US2, contrat routes-serveur).
//
// `articlePublicParSlug` applique la visibilité : un slug inexistant OU un
// brouillon renvoient tous deux `null`, donc 404, sans distinction — distinguer
// les deux renseignerait un visiteur sur l'existence d'un brouillon (research 002).

/** Nombre d'articles « à lire aussi » — grille de trois (structure `article.html`). */
const A_LIRE_AUSSI = 3

export default defineEventHandler(async (event): Promise<ArticlePageDTO> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Adresse introuvable' })
  }

  const article = await articlePublicParSlug(slug)
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Adresse introuvable' })
  }

  // « À lire aussi » : la même rubrique, l'article courant exclu. On lit un de
  // plus pour compenser l'éventuelle exclusion du courant, puis on borne.
  const rubriqueId = article.rubriqueId as RubriqueId
  const memeRubrique = await listerArticlesPublics({
    rubriqueId,
    limite: A_LIRE_AUSSI + 1,
  })
  const aLireAussi = memeRubrique
    .filter((autre) => autre.slug !== article.slug)
    .slice(0, A_LIRE_AUSSI)
    // Contexte = la rubrique de l'article : l'eyebrow bascule sur le sous-thème.
    .map((autre) => carteDe(autre, rubriqueId))

  return { article: articleDe(article), aLireAussi }
})
