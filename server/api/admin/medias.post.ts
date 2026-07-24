import { exigerCompte } from '../../utils/session'
import { traiterImage } from '../../utils/image'
import { stockage } from '../../utils/stockage'
import { enregistrerMedia } from '../../services/medias'
import { ErreurValidation } from '../../validation/erreurs'
import type { MediaTeleverseDTO } from '../../../shared/types/dto.ts'

// POST /api/admin/medias — téléverser une image (FR-019/020, D5).
//
// GARDÉE par `exigerCompte`. La chaîne : lire le multipart → `traiterImage`
// (sharp, en mémoire) → clé opaque `.webp` → **`Stockage.put`** (seule porte
// vers le disque) → `enregistrerMedia` (une clé, jamais une URL). La réponse
// porte `{ id, cle, url }`, `url` étant l'adresse d'application `/medias/<clé>`.

/** Plafond avant traitement, sur l'octet reçu. Au-delà : 413. */
const POIDS_MAX = 10 * 1024 * 1024 // 10 Mo

export default defineEventHandler(async (event): Promise<MediaTeleverseDTO> => {
  await exigerCompte(event)

  const parties = await readMultipartFormData(event)
  const partie
    = parties?.find((p) => p.name === 'fichier' && p.data?.length)
      ?? parties?.find((p) => p.filename && p.data?.length)

  if (!partie?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier reçu.' })
  }
  if (partie.data.length > POIDS_MAX) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Le fichier dépasse la taille maximale autorisée (10 Mo).',
    })
  }

  // `traiterImage` lève `ErreurValidation` sur un non-image → 415 (type non
  // accepté), distinct du 400 (fichier absent) et du 413 (trop lourd).
  let traitee
  try {
    traitee = await traiterImage(partie.data)
  }
  catch (erreur) {
    if (erreur instanceof ErreurValidation) {
      throw createError({ statusCode: 415, statusMessage: erreur.message })
    }
    throw erreur
  }

  // Clé opaque (non énumérable), extension WebP — le format canonique produit.
  // Le préfixe `televersements/` distingue les images téléversées des clés de
  // seed ; `stockage.url` ajoute seul le préfixe public `/medias/`.
  const cle = `televersements/${crypto.randomUUID()}.webp`
  await stockage.put(cle, traitee.buffer, traitee.typeMime)

  const media = await enregistrerMedia({
    cle,
    largeur: traitee.largeur,
    hauteur: traitee.hauteur,
    poids: traitee.poids,
  })

  setResponseStatus(event, 201)
  return { id: media.id, cle: media.cle, url: stockage.url(media.cle) }
})
