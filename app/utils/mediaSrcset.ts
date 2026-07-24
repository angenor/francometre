// `srcset` webp d'une vignette, servi par la route `/medias/**` (US4, D10).
//
// Auto-importé par Nuxt (`app/utils/`). La route média produit les variantes EN
// LIGNE via `sharp` (`?w=&f=&q=`), à partir du tampon lu par `Stockage`
// (porte 9) : portable, sans service tiers ni requête interne. On compose ici le
// `srcset` d'une VIGNETTE avec un `<img>` natif — le repli `@error` d'un `<img>`
// se déclenche de façon fiable même quand la requête échoue AVANT l'hydratation,
// là où l'évènement `error` de `<NuxtImg>` peut être manqué.

/** Largeurs de variante d'une vignette (25vw bureau / 50vw mobile, DPR compris). */
const LARGEURS_VIGNETTE = [384, 640, 960] as const

/**
 * Le `srcset` webp d'une vignette. `undefined` hors `/medias/` (SVG de la planche
 * de style, actifs de `public/`) : ces sources ne se redimensionnent pas — le
 * `<img>` sert alors sa source telle quelle.
 */
export function srcsetVignette(src: string | null | undefined): string | undefined {
  if (!src || !src.startsWith('/medias/')) return undefined
  return LARGEURS_VIGNETTE.map((w) => `${src}?w=${w}&f=webp&q=75 ${w}w`).join(', ')
}
