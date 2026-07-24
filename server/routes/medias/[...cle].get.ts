import sharp from 'sharp'
import { z } from 'zod'
import { stockage } from '../../utils/stockage'

// GET /medias/<clé> — servir un média (research.md D6). **PUBLIQUE**, non gardée.
//
// C'est l'unique indirection de portabilité : disque aujourd'hui, objet demain,
// sans changer les adresses `/medias/<clé>` rangées dans les corps d'article.
// Les couvertures d'articles publiés sont publiques, et les clés sont opaques
// (`cuid`), donc non énumérables — la route sert des octets par clé, rien d'autre.
//
// Elle sert AUSSI, à la demande, des VARIANTES redimensionnées (`?w=&f=&q=`) :
// c'est le fournisseur d'images `medias` qui compose ces adresses (US4, D10).
// La transformation se fait ICI, en ligne (jamais par une requête que le serveur
// s'adresse à lui-même), à partir du tampon lu par `Stockage` — portable, sans
// couplage au disque. Le résultat est mémorisé pour ne pas recalculer à chaque
// requête ; les clés d'origine restant immuables, le cache est sûr.

/** Types de sortie proposés aux variantes (ce que `sharp` sait encoder ici). */
type FormatSortie = 'webp' | 'jpeg' | 'png' | 'avif'

/**
 * Paramètres de variante, validés (convention : Zod sur toute entrée de route).
 * Absents → l'original est servi tel quel. Bornes strictes : une largeur hors
 * plage ou un format inconnu est un 400, pas un repli silencieux.
 */
const schemaVariante = z.object({
  // `min(1)` : `<NuxtImg>` émet des variantes de densité 1w/2w (placeholders)
  // que le navigateur ne choisit jamais, mais qui doivent rester valides.
  w: z.coerce.number().int().min(1).max(4000).optional(),
  f: z.enum(['webp', 'jpeg', 'png', 'avif']).optional(),
  q: z.coerce.number().int().min(1).max(100).optional(),
})

const TYPE_MIME: Record<FormatSortie, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
}

/**
 * Cache borné des variantes déjà calculées (clé = `cle|w|f|q`). EN MÉMOIRE, par
 * instance — comme la limitation de débit (research D6), assumé mono-instance.
 * Éviction de la plus ancienne au-delà du plafond : une variante est bon marché
 * à recalculer, la mémoire ne l'est pas.
 */
const variantes = new Map<string, Buffer>()
const PLAFOND_VARIANTES = 256

function memoriser(cle: string, contenu: Buffer): Buffer {
  if (variantes.size >= PLAFOND_VARIANTES) {
    const plusAncienne = variantes.keys().next().value
    if (plusAncienne !== undefined) variantes.delete(plusAncienne)
  }
  variantes.set(cle, contenu)
  return contenu
}

/**
 * `Content-Type` d'un ORIGINAL, dérivé de l'EXTENSION de la clé, jamais deviné
 * du contenu. Les téléversements produisent du WebP (`server/utils/image.ts`),
 * mais les clés d'exemple du seed sont en `.jpg` : la table couvre les deux.
 */
function typeMime(cle: string): string {
  const point = cle.lastIndexOf('.')
  const ext = point === -1 ? '' : cle.slice(point + 1).toLowerCase()
  switch (ext) {
    case 'webp': return 'image/webp'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'avif': return 'image/avif'
    default: return 'application/octet-stream'
  }
}

export default defineEventHandler(async (event) => {
  // `[...cle]` capture le chemin complet ; `getRouterParam` le rend déjà décodé
  // et rejoint (`exemples/lynx-boreal.jpg`).
  const cle = getRouterParam(event, 'cle', { decode: true })
  if (!cle) {
    throw createError({ statusCode: 404, statusMessage: 'Média introuvable' })
  }

  const variante = schemaVariante.parse(getQuery(event))
  const veutVariante = variante.w !== undefined || variante.f !== undefined

  // Les clés sont immuables (un contenu, une clé) : cache long et immuable, que
  // l'on serve l'original ou une variante (dont l'adresse porte ses paramètres).
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  // ---- Original (aucun paramètre de variante) ----
  if (!veutVariante) {
    const octets = await stockage.get(cle)
    if (!octets) {
      throw createError({ statusCode: 404, statusMessage: 'Média introuvable' })
    }
    setResponseHeader(event, 'Content-Type', typeMime(cle))
    return octets
  }

  // ---- Variante redimensionnée / réencodée ----
  const format: FormatSortie = variante.f ?? 'webp'
  const qualite = variante.q ?? 75
  const cleCache = `${cle}|${variante.w ?? 0}|${format}|${qualite}`

  setResponseHeader(event, 'Content-Type', TYPE_MIME[format])

  const enCache = variantes.get(cleCache)
  if (enCache) return enCache

  const octets = await stockage.get(cle)
  if (!octets) {
    throw createError({ statusCode: 404, statusMessage: 'Média introuvable' })
  }

  const transforme = sharp(octets)
  // `withoutEnlargement` : jamais agrandir au-delà de l'original (inutile, plus
  // lourd). `fit: inside` conserve le ratio, la hauteur suit la largeur.
  if (variante.w !== undefined) {
    transforme.resize({ width: variante.w, withoutEnlargement: true })
  }
  const rendu = await transforme.toFormat(format, { quality: qualite }).toBuffer()

  return memoriser(cleCache, rendu)
})
