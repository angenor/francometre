import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import { creerArticle } from '../../server/services/articles'
import { enregistrerMedia, mediaParId, supprimerMedia } from '../../server/services/medias'
import { stockage } from '../../server/utils/stockage'
import { semerRubriques } from './harnais'

// US6 — Les médias sont représentés par une CLÉ, jamais par une URL.
// SC-006 : aucune colonne ne contient d'adresse.

const MEDIA = {
  cle: 'articles/2026/07/lynx-boreal.jpg',
  largeur: 1600,
  hauteur: 900,
  poids: 240_000,
}

describe('Médias', () => {
  beforeEach(() => {
    semerRubriques()
  })

  it('accepte une clé de stockage', async () => {
    const media = await enregistrerMedia(MEDIA)

    expect(media.cle).toBe('articles/2026/07/lynx-boreal.jpg')
    expect((await mediaParId(media.id))?.cle).toBe(MEDIA.cle)
  })

  it('REFUSE toute valeur ressemblant à une URL (FR-023)', async () => {
    const adresses = [
      'https://exemple.com/image.jpg',
      'http://exemple.com/image.jpg',
      '//exemple.com/image.jpg',
      'data:image/png;base64,iVBORw0KGgo=',
      's3://seau/image.jpg',
    ]

    for (const cle of adresses) {
      await expect(enregistrerMedia({ ...MEDIA, cle }))
        .rejects.toThrow(/ne peut pas être une URL/)
    }

    // Le refus est à la VALIDATION : rien n'a atteint la base.
    expect(await prisma.media.count()).toBe(0)
  })

  it('exige des dimensions et un poids strictement positifs', async () => {
    await expect(enregistrerMedia({ ...MEDIA, largeur: 0 }))
      .rejects.toThrow(/largeur.*strictement positif/)
    await expect(enregistrerMedia({ ...MEDIA, hauteur: -1 }))
      .rejects.toThrow(/hauteur.*strictement positif/)
    await expect(enregistrerMedia({ ...MEDIA, poids: 1.5 }))
      .rejects.toThrow(/poids.*entier/)
  })

  it('ne laisse AUCUNE adresse dans les colonnes de médias (SC-006)', async () => {
    await enregistrerMedia(MEDIA)
    await enregistrerMedia({ ...MEDIA, cle: 'articles/2026/07/autre.png', altParDefaut: 'Un lynx.' })

    // Le contrôle porte sur la base elle-même, colonne par colonne.
    const medias = await prisma.media.findMany()
    const texte = JSON.stringify(medias)

    expect(texte).not.toMatch(/https?:\/\//)
    expect(texte).not.toMatch(/data:/)
    expect(texte).not.toMatch(/\/\//)
  })

  it('calcule l\'adresse À LA LECTURE, hors de la base (FR-024)', async () => {
    const media = await enregistrerMedia(MEDIA)

    const adresse = stockage.url(media.cle)

    expect(adresse).toBe('/medias/articles/2026/07/lynx-boreal.jpg')
    // L'adresse n'est nulle part en base : passer à S3 changerait cette ligne
    // et rien d'autre.
    const enBase = await prisma.media.findUnique({ where: { id: media.id } })
    expect(JSON.stringify(enBase)).not.toContain(adresse)
  })

  it('refuse la suppression d\'un média référencé par un article', async () => {
    const media = await enregistrerMedia(MEDIA)
    await creerArticle({
      titre: 'Le retour du lynx',
      chapo: 'Chapô.',
      corps: '<p>Corps.</p>',
      rubriqueId: 'environnement',
      couvertureId: media.id,
      couvertureAlt: 'Un lynx boréal, de profil.',
    })

    await expect(supprimerMedia(media.id)).rejects.toThrow(/couverture de 1 article/)

    // Le média est toujours là.
    expect(await mediaParId(media.id)).not.toBeNull()
  })

  it('supprime un média que rien ne référence', async () => {
    const media = await enregistrerMedia(MEDIA)

    await supprimerMedia(media.id)

    expect(await mediaParId(media.id)).toBeNull()
  })
})
