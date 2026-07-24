import { describe, expect, it } from 'vitest'
import { metaSeoArticleDe, type ArticleSeoEntite } from '../../server/utils/presentation'

// US3 (006) — le mappeur SEO d'un article (D8). Fonction pure : image absolue
// par `stockage.urlAbsolue`, dates en ISO, section = libellé, auteur pass-through.

const ORIGINE = 'https://francometre.com'

function entite(surcharge: Partial<ArticleSeoEntite> = {}): ArticleSeoEntite {
  return {
    titre: 'Le retour du lynx dans le Jura',
    slug: 'le-retour-du-lynx-dans-le-jura',
    chapo: 'Vingt ans après sa réintroduction, le félin recolonise les massifs.',
    corps: '<p>Le lynx boréal occupe désormais la quasi-totalité du massif.</p>',
    sousTheme: 'Biodiversité',
    auteur: 'Camille Dupont',
    publieLe: new Date('2026-07-01T08:00:00.000Z'),
    modifieLe: new Date('2026-07-10T09:30:00.000Z'),
    rubriqueId: 'environnement',
    couvertureAlt: 'Un lynx boréal de profil, dans la neige.',
    couvertureLegende: null,
    couverture: { cle: 'exemples/lynx-boreal.jpg' },
    ...surcharge,
  }
}

describe('metaSeoArticleDe', () => {
  it('produit une image ABSOLUE quand il y a une couverture', () => {
    expect(metaSeoArticleDe(entite(), ORIGINE).imageAbsolue)
      .toBe('https://francometre.com/medias/exemples/lynx-boreal.jpg')
  })

  it('rend imageAbsolue null sans couverture', () => {
    expect(metaSeoArticleDe(entite({ couverture: null }), ORIGINE).imageAbsolue).toBeNull()
  })

  it('expose les deux dates en ISO 8601', () => {
    const seo = metaSeoArticleDe(entite(), ORIGINE)
    expect(seo.publieISO).toBe('2026-07-01T08:00:00.000Z')
    expect(seo.modifieISO).toBe('2026-07-10T09:30:00.000Z')
  })

  it('la section est le LIBELLÉ de la rubrique', () => {
    expect(metaSeoArticleDe(entite(), ORIGINE).section).toBe('Environnement')
  })

  it('l\'auteur passe tel quel, null compris (repli fait au JSON-LD)', () => {
    expect(metaSeoArticleDe(entite(), ORIGINE).auteur).toBe('Camille Dupont')
    expect(metaSeoArticleDe(entite({ auteur: null }), ORIGINE).auteur).toBeNull()
  })

  it('la canonique est absolue, sans query ni barre finale', () => {
    expect(metaSeoArticleDe(entite(), ORIGINE).canonical)
      .toBe('https://francometre.com/article/le-retour-du-lynx-dans-le-jura')
    expect(metaSeoArticleDe(entite(), 'https://francometre.com/').canonical)
      .toBe('https://francometre.com/article/le-retour-du-lynx-dans-le-jura')
  })
})
