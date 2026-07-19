// Dérivation de l'identifiant d'URL (research.md D17).
//
// La sortie sert de segment d'adresse : elle doit rester lisible, stable, et ne
// contenir que ce qui traverse une URL sans encodage.

/** Repli lorsque la normalisation ne laisse rien d'exploitable. */
export const SLUG_PAR_DEFAUT = 'article'

/** Les marques diacritiques combinantes, isolées par la décomposition NFD. */
const DIACRITIQUES = /[̀-ͯ]/g

/**
 * Minuscules, diacritiques retirés par normalisation `NFD`, tout ce qui n'est
 * ni lettre ni chiffre remplacé par un tiret, tirets compactés et élagués.
 *
 * Le repli n'est pas un détail de confort : un titre entièrement composé de
 * ponctuation ou d'idéogrammes produirait sinon une chaîne vide, donc un slug
 * vide — et l'unicité en base transformerait le deuxième cas en échec obscur.
 */
export function deriverSlug(source: string): string {
  const slug = source
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug === '' ? SLUG_PAR_DEFAUT : slug
}
