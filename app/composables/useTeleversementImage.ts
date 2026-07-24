import type { MediaTeleverseDTO } from '#shared/types/dto'

// Le téléversement d'une image — geste partagé par la couverture
// (`DeposeCouverture`) et l'image du corps (`BarreOutils`).
//
// Un `multipart/form-data` vers `POST /api/admin/medias` : le serveur traite
// l'image (sharp → WebP), la range par `Stockage.put` et renvoie
// `{ id, cle, url }`. L'URL est l'adresse d'application `/medias/<clé>` — jamais
// une URL de fournisseur (porte 9).

export function useTeleversementImage() {
  /**
   * Téléverse un fichier et renvoie le média créé. Lève une `FetchError`
   * (`statusCode` 413/415/401…) que l'appelant traduit pour l'utilisateur.
   */
  async function televerser(fichier: File): Promise<MediaTeleverseDTO> {
    const donnees = new FormData()
    donnees.append('fichier', fichier)
    return $fetch<MediaTeleverseDTO>('/api/admin/medias', {
      method: 'POST',
      body: donnees,
    })
  }

  return { televerser }
}

/** Traduit l'échec d'un téléversement en message français, par code HTTP. */
export function messageTeleversement(erreur: unknown): string {
  const code = (erreur as { statusCode?: number })?.statusCode
  if (code === 413) return 'Image trop lourde : 10 Mo maximum.'
  if (code === 415) return 'Fichier non pris en charge : choisissez une image.'
  if (code === 401) return 'Session expirée : reconnectez-vous.'
  return 'Le téléversement a échoué. Réessayez.'
}
