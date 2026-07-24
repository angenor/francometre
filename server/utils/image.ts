import sharp from 'sharp'
import { ErreurValidation } from '../validation/erreurs'

// Traitement d'image au téléversement — EN MÉMOIRE (research.md D5/D7).
//
// Ce module ne touche JAMAIS `node:fs` (porte 9) : il reçoit un buffer, en rend
// un autre. Seul `Stockage.put` écrira, ensuite, par l'interface unique. `sharp`
// est un module natif externalisé au build Nitro (`nuxt.config.ts`).
//
// La chaîne : valider le type RÉEL (magic bytes, jamais l'extension cliente),
// auto-orienter d'après l'EXIF puis l'oublier, retirer toute métadonnée,
// plafonner la largeur, convertir en WebP. On obtient une image canonique + ses
// dimensions et son poids réels.

/** Plafond de largeur : au-delà, l'image est réduite (jamais agrandie). */
const LARGEUR_MAX = 2000

/**
 * Les formats matriciels acceptés. `svg` est EXCLU délibérément : un SVG peut
 * porter du script, il n'a pas sa place dans une couverture ou un corps.
 */
const FORMATS_ACCEPTES = new Set(['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'])

export interface ImageTraitee {
  buffer: Buffer
  largeur: number
  hauteur: number
  poids: number
  typeMime: string
}

/**
 * Convertit un buffer d'image en WebP canonique, ou lève une `ErreurValidation`
 * (→ 415 côté route) si l'entrée n'est pas une image reconnue.
 */
export async function traiterImage(entree: Buffer): Promise<ImageTraitee> {
  const source = sharp(entree)

  // 1. Type RÉEL. `metadata()` lit l'en-tête ; un non-image y échoue.
  let format: string | undefined
  try {
    format = (await source.metadata()).format
  }
  catch {
    throw new ErreurValidation('Le fichier n\'est pas une image reconnue.')
  }
  if (!format || !FORMATS_ACCEPTES.has(format)) {
    throw new ErreurValidation(
      'Le fichier n\'est pas une image acceptée (JPEG, PNG, WebP, AVIF, GIF ou TIFF).',
    )
  }

  // 2. Auto-orientation EXIF (puis oubliée), plafond de largeur, WebP. Aucune
  //    métadonnée n'est réémise : `sharp` les retire par défaut faute de
  //    `withMetadata()`. Les dimensions et le poids RETENUS sont ceux de la
  //    sortie (`info`), pas de l'entrée.
  const { data, info } = await source
    .rotate()
    .resize({ width: LARGEUR_MAX, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: data,
    largeur: info.width,
    hauteur: info.height,
    poids: info.size,
    typeMime: 'image/webp',
  }
}
