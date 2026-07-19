// Extension explicite : ce module est aussi chargé par
// `node --experimental-strip-types` (scripts/essai-eyebrow.ts), qui exige le
// chemin réel là où Vite tolère l'omission.
import { libelleRubrique, type RubriqueId } from './rubriques.ts'

// L'eyebrow — une règle d'AFFICHAGE, jamais une colonne (FR-020).
//
// Le libellé posé au-dessus du titre d'une vignette n'est pas stocké : il se
// calcule à partir de deux informations que l'article porte déjà, et d'un
// contexte fourni par l'appelant.
//
//   lecteur DANS la rubrique de l'article ET sous-thème présent → le SOUS-THÈME
//   tout autre cas                                              → le LIBELLÉ DE RUBRIQUE
//
// La fonction est PURE : mêmes entrées, même sortie, aucun accès à la base,
// aucune dépendance serveur. Elle vit dans `shared/utils/` et sert donc au
// serveur comme au client.
//
// Elle ne préfixe JAMAIS le titre. La composition « Sous-thème : Titre » qu'on
// lit sur les maquettes est de l'affichage — le titre reste stocké nu.

/** Ce que la règle a besoin de connaître d'un article, et rien de plus. */
export interface ArticleEyebrow {
  rubriqueId: string
  sousTheme?: string | null
}

/**
 * Le libellé à afficher au-dessus du titre.
 *
 * @param contexte La rubrique où se trouve le lecteur, ou `null`/`undefined`
 *   s'il n'est dans aucune (accueil, listes toutes rubriques, résultats de
 *   recherche).
 */
export function eyebrowDe(
  article: ArticleEyebrow,
  contexte?: RubriqueId | string | null,
): string {
  const dansLaRubrique = contexte != null && contexte === article.rubriqueId
  const sousTheme = article.sousTheme?.trim()

  // Un sous-thème vide ou fait d'espaces n'est pas un sous-thème : il ne doit
  // pas produire un eyebrow blanc là où la rubrique aurait fait l'affaire.
  if (dansLaRubrique && sousTheme) return sousTheme

  // Le repli sur l'identifiant couvre le cas d'une rubrique inconnue : mieux
  // vaut un eyebrow imparfait qu'une vignette sans surtitre.
  return libelleRubrique(article.rubriqueId) ?? article.rubriqueId
}
