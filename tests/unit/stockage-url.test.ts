import { describe, expect, it } from 'vitest'
import { stockage } from '../../server/utils/stockage'

// US3 (006) — `urlAbsolue`, seule fabrique d'URL ABSOLUE de média (porte 9, D6).
// Fonction pure : aucune base sollicitée (le harnais tourne mais reste inerte ici).

const ORIGINE = 'https://francometre.com'

describe('Stockage.urlAbsolue (implémentation disque)', () => {
  it('préfixe l\'origine à l\'URL relative', () => {
    expect(stockage.urlAbsolue('exemples/lynx-boreal.jpg', ORIGINE))
      .toBe('https://francometre.com/medias/exemples/lynx-boreal.jpg')
  })

  it('ne double JAMAIS la barre quand l\'origine en porte une', () => {
    expect(stockage.urlAbsolue('a.jpg', 'https://francometre.com/'))
      .toBe('https://francometre.com/medias/a.jpg')
  })

  it('tolère une clé à barre initiale (jamais de « /medias// »)', () => {
    expect(stockage.urlAbsolue('/a.jpg', ORIGINE))
      .toBe('https://francometre.com/medias/a.jpg')
  })

  // Comportement documenté de la FUTURE implémentation objet/S3 : là, `url`
  // renvoie déjà une adresse absolue et `origine` est ignorée — `urlAbsolue`
  // est donc idempotent sur une URL déjà absolue. L'implémentation disque
  // livrée ici, elle, préfixe toujours l'origine (c'est ce que fige ce fichier).
})
