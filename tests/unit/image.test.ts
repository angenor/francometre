import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { traiterImage } from '../../server/utils/image'

// US2 — Le téléversement traite l'image EN MÉMOIRE : type réel, WebP canonique,
// dimensions/poids cohérents, largeur plafonnée (research.md D5).

/** Fabrique une image PNG de test des dimensions demandées. */
async function imagePng(largeur: number, hauteur: number): Promise<Buffer> {
  return sharp({
    create: {
      width: largeur,
      height: hauteur,
      channels: 3,
      background: { r: 100, g: 120, b: 140 },
    },
  }).png().toBuffer()
}

describe('Traitement d\'image', () => {
  it('refuse un fichier qui n\'est pas une image', async () => {
    await expect(traiterImage(Buffer.from('ceci n\'est pas une image'))).rejects.toThrow(/image/i)
  })

  it('convertit en WebP et renvoie des dimensions cohérentes', async () => {
    const resultat = await traiterImage(await imagePng(800, 450))

    expect(resultat.typeMime).toBe('image/webp')
    expect(resultat.largeur).toBe(800)
    expect(resultat.hauteur).toBe(450)
    expect(resultat.poids).toBeGreaterThan(0)

    // Le buffer produit est bien du WebP.
    const meta = await sharp(resultat.buffer).metadata()
    expect(meta.format).toBe('webp')
  })

  it('plafonne la largeur à 2000 px, ratio préservé, sans agrandir', async () => {
    const grande = await traiterImage(await imagePng(3000, 1500))
    expect(grande.largeur).toBe(2000)
    expect(grande.hauteur).toBe(1000)

    // `withoutEnlargement` : une petite image n'est pas étirée.
    const petite = await traiterImage(await imagePng(500, 500))
    expect(petite.largeur).toBe(500)
  })
})
