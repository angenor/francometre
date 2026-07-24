import { stockage } from '../../utils/stockage'

// GET /medias/<clé> — servir un média (research.md D6). **PUBLIQUE**, non gardée.
//
// C'est l'unique indirection de portabilité : disque aujourd'hui, objet demain,
// sans changer les adresses `/medias/<clé>` rangées dans les corps d'article.
// Les couvertures d'articles publiés sont publiques, et les clés sont opaques
// (`cuid`), donc non énumérables — la route sert des octets par clé, rien d'autre.
//
// C'est aussi l'adresse que `stockage.url()` (disque) désigne déjà
// (`PREFIXE_PUBLIC = '/medias'`) : rien ne servait `/medias/*` avant cette
// feature, le téléversement n'existant pas.

/**
 * `Content-Type` dérivé de l'EXTENSION de la clé, jamais deviné du contenu.
 *
 * Les téléversements produisent du WebP (`server/utils/image.ts`), mais les clés
 * d'exemple du seed sont en `.jpg` : la table couvre les deux. Défaut prudent —
 * un flux binaire opaque plutôt qu'un type inventé.
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

  const octets = await stockage.get(cle)
  if (!octets) {
    // Absence de fichier et clé remontante (rejetée par `stockage`) se répondent
    // pareil : 404. Distinguer renseignerait sur ce qui existe (D6).
    throw createError({ statusCode: 404, statusMessage: 'Média introuvable' })
  }

  setResponseHeader(event, 'Content-Type', typeMime(cle))
  // Les clés sont immuables (un contenu, une clé) : cache long et immuable.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return octets
})
