// Le temps de lecture — une valeur DÉRIVÉE, jamais une colonne (FR-014).
//
// Il se recalcule à chaque affichage à partir du corps de l'article : le
// stocker le désynchroniserait à la première édition. La fonction est PURE —
// mêmes entrées, même sortie, aucun accès à la base ni dépendance serveur — et
// vit dans `shared/utils/` pour servir le serveur (DTO) comme le client, à
// l'image de `shared/utils/eyebrow.ts`.

/** Cadence de lecture retenue : une allure usuelle pour du texte courant en
 *  français. Prudente à dessein — mieux vaut une promesse tenue au lecteur
 *  (research D4). */
const MOTS_PAR_MINUTE = 200

/**
 * Estime le temps de lecture d'un corps HTML, en MINUTES entières.
 *
 * Le balisage est retiré avant le comptage : on compte les mots du texte, pas
 * les balises. Le résultat est arrondi au supérieur et ne descend jamais sous
 * 1 minute — un article, même bref, se lit en un temps non nul (FR-014).
 *
 * @param corpsHtml Le corps de l'article, tel que stocké (déjà assaini).
 * @returns Un entier ≥ 1 : le nombre de minutes.
 */
export function tempsLecture(corpsHtml: string): number {
  // Les balises deviennent des espaces (et non le vide), pour que deux mots
  // séparés par une seule balise — « fin</p><p>Suite » — ne se collent pas en un
  // seul. Les entités ne sont pas décodées : elles ne changent pas le compte.
  const texte = corpsHtml.replace(/<[^>]*>/g, ' ')

  const mots = texte.split(/\s+/).filter((mot) => mot.length > 0)

  return Math.max(1, Math.ceil(mots.length / MOTS_PAR_MINUTE))
}
