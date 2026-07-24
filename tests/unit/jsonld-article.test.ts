import { describe, expect, it } from 'vitest'
import { jsonldArticle } from '../../shared/utils/jsonldArticle'
import type { SeoArticleDTO } from '../../shared/types/dto'

// US3 (006) — le constructeur JSON-LD `NewsArticle` (D8). Fonction pure : replis
// auteur (null → Organization) et image (null → défaut), titre NU.

const DEFAUT = 'https://francometre.com/brand/partage-defaut.png'

function seo(surcharge: Partial<SeoArticleDTO> = {}): SeoArticleDTO {
  return {
    canonical: 'https://francometre.com/article/le-retour-du-lynx-dans-le-jura',
    imageAbsolue: 'https://francometre.com/medias/exemples/lynx-boreal.jpg',
    publieISO: '2026-07-01T08:00:00.000Z',
    modifieISO: '2026-07-10T09:30:00.000Z',
    section: 'Environnement',
    auteur: 'Camille Dupont',
    ...surcharge,
  }
}

describe('jsonldArticle', () => {
  it('bâtit un NewsArticle au titre NU (aucun préfixe de sous-thème)', () => {
    const o = jsonldArticle(seo(), { titre: 'Le retour du lynx dans le Jura' }, DEFAUT)
    expect(o['@context']).toBe('https://schema.org')
    expect(o['@type']).toBe('NewsArticle')
    expect(o.headline).toBe('Le retour du lynx dans le Jura')
    expect(o.datePublished).toBe('2026-07-01T08:00:00.000Z')
    expect(o.articleSection).toBe('Environnement')
    expect(o.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://francometre.com/article/le-retour-du-lynx-dans-le-jura',
    })
  })

  it('auteur Person quand présent', () => {
    expect(jsonldArticle(seo(), { titre: 'T' }, DEFAUT).author)
      .toEqual({ '@type': 'Person', name: 'Camille Dupont' })
  })

  it('REPLI auteur → Organization quand null', () => {
    expect(jsonldArticle(seo({ auteur: null }), { titre: 'T' }, DEFAUT).author)
      .toEqual({ '@type': 'Organization', name: 'Francomètre' })
  })

  it('image = couverture absolue quand présente', () => {
    expect(jsonldArticle(seo(), { titre: 'T' }, DEFAUT).image)
      .toEqual(['https://francometre.com/medias/exemples/lynx-boreal.jpg'])
  })

  it('REPLI image → image de partage par défaut quand null', () => {
    expect(jsonldArticle(seo({ imageAbsolue: null }), { titre: 'T' }, DEFAUT).image)
      .toEqual([DEFAUT])
  })

  it('l\'éditeur est l\'Organisation « Francomètre » avec logo', () => {
    const o = jsonldArticle(seo(), { titre: 'T' }, DEFAUT)
    expect(o.publisher).toEqual({
      '@type': 'Organization',
      name: 'Francomètre',
      logo: { '@type': 'ImageObject', url: DEFAUT },
    })
  })
})
