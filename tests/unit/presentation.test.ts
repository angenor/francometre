import { describe, expect, it } from 'vitest'
import {
  articleDe,
  carteDe,
  uneDe,
  type ArticleEntite,
} from '../../server/utils/presentation'

// Pages publiques — la couche de présentation mappe les entités en DTO.
// Fonctions pures : aucune base, aucun harnais nécessaire (la présentation ne
// touche jamais Prisma). eyebrow contextuel, URL par stockage, titre nu (FR-019).

/** Une entité d'article, complétée par des valeurs par défaut plausibles. */
function entite(surcharge: Partial<ArticleEntite> = {}): ArticleEntite {
  return {
    titre: 'Le retour du lynx dans le Jura',
    slug: 'le-retour-du-lynx-dans-le-jura',
    chapo: 'Vingt ans après sa réintroduction, le félin recolonise les massifs.',
    corps: '<p>Le lynx boréal occupe désormais la quasi-totalité du massif.</p>',
    sousTheme: 'Biodiversité',
    auteur: 'Camille Renard',
    publieLe: new Date('2026-07-20T09:00:00.000Z'),
    rubriqueId: 'environnement',
    couvertureAlt: 'Un lynx boréal de profil, dans la neige.',
    couvertureLegende: 'Un lynx dans le Jura. — Photo d\'illustration',
    couverture: { cle: 'exemples/lynx-boreal.jpg' },
    ...surcharge,
  }
}

describe('Eyebrow contextuel de la carte', () => {
  it('affiche le SOUS-THÈME quand le lecteur est dans la rubrique de l\'article', () => {
    const carte = carteDe(entite(), 'environnement')
    expect(carte.eyebrow).toBe('Biodiversité')
  })

  it('affiche la RUBRIQUE partout ailleurs (contexte null)', () => {
    const carte = carteDe(entite(), null)
    expect(carte.eyebrow).toBe('Environnement')
  })

  it('affiche la rubrique si le lecteur est dans une AUTRE rubrique', () => {
    const carte = carteDe(entite(), 'culture')
    expect(carte.eyebrow).toBe('Environnement')
  })

  it('replie sur la rubrique quand le sous-thème est absent', () => {
    const carte = carteDe(entite({ sousTheme: null }), 'environnement')
    expect(carte.eyebrow).toBe('Environnement')
  })
})

describe('Couverture de la carte', () => {
  it('calcule l\'URL par le stockage, jamais une URL stockée (porte 9)', () => {
    const carte = carteDe(entite(), null)
    expect(carte.image).toBe('/medias/exemples/lynx-boreal.jpg')
    expect(carte.imageAlt).toBe('Un lynx boréal de profil, dans la neige.')
  })

  it('forme un couple image/alt : jamais l\'un sans l\'autre', () => {
    // Sans couverture : ni image, ni alt.
    const sansMedia = carteDe(entite({ couverture: null }), null)
    expect(sansMedia.image).toBeUndefined()
    expect(sansMedia.imageAlt).toBeUndefined()

    // Média présent mais alt vide : on ne rend PAS l'image sans alt réel.
    const sansAlt = carteDe(entite({ couvertureAlt: '  ' }), null)
    expect(sansAlt.image).toBeUndefined()
    expect(sansAlt.imageAlt).toBeUndefined()
  })
})

describe('Titre et chemin', () => {
  it('restitue le titre NU, sans préfixe de composition (FR-019)', () => {
    // Le titre saisi « Biodiversité : … » ressort identique : la composition
    // « Sous-thème : Titre » est de l'affichage, jamais du contenu.
    const saisi = 'Biodiversité : le retour du lynx'
    const carte = carteDe(entite({ titre: saisi, sousTheme: 'Biodiversité' }), 'environnement')
    expect(carte.titre).toBe(saisi)
    expect(carte.titre).not.toBe('Biodiversité : Biodiversité : le retour du lynx')
  })

  it('dérive le chemin du slug', () => {
    const carte = carteDe(entite(), null)
    expect(carte.chemin).toBe('/article/le-retour-du-lynx-dans-le-jura')
  })
})

describe('DTO d\'article', () => {
  it('distingue la légende éditoriale du texte alternatif', () => {
    const dto = articleDe(entite())
    expect(dto.couverture).not.toBeNull()
    expect(dto.couverture!.alt).toBe('Un lynx boréal de profil, dans la neige.')
    expect(dto.couverture!.legende).toBe('Un lynx dans le Jura. — Photo d\'illustration')
    expect(dto.couverture!.legende).not.toBe(dto.couverture!.alt)
  })

  it('dérive le temps de lecture et compose le fil d\'Ariane', () => {
    const dto = articleDe(entite())
    expect(dto.tempsLecture).toBeGreaterThanOrEqual(1)
    expect(dto.filAriane).toEqual([
      { libelle: 'Accueil', chemin: '/' },
      { libelle: 'Environnement', chemin: '/rubrique/environnement' },
    ])
    expect(dto.rubrique).toEqual({
      id: 'environnement',
      libelle: 'Environnement',
      chemin: '/rubrique/environnement',
    })
  })

  it('n\'expose AUCUN champ Prisma brut au client', () => {
    const dto = articleDe(entite())
    // Le corps voyage sous `corpsHtml`, pas `corps` ; aucun statut, aucune clé
    // technique, aucun rang de Une ne franchit la frontière.
    const cles = Object.keys(dto)
    expect(cles).not.toContain('corps')
    expect(cles).not.toContain('statut')
    expect(cles).not.toContain('couvertureId')
    expect(cles).not.toContain('rangUne')
    expect(cles).not.toContain('rubriqueId')
    expect(dto.corpsHtml).toContain('<p>')
  })
})

describe('Composition de la Une', () => {
  it('place le rang 1 en héros et numérote les secondaires 02–05', () => {
    const articles = [1, 2, 3].map((rang) => ({
      ...entite({ slug: `article-${rang}`, titre: `Article ${rang}` }),
      rangUne: rang,
    }))

    const une = uneDe(articles)
    expect(une.hero).not.toBeNull()
    expect(une.hero!.numero).toBe('01')
    expect(une.secondaires.map((s) => s.numero)).toEqual(['02', '03'])
  })

  it('rend un héros NUL quand le rang 1 n\'est pas pourvu (jamais de héros vide)', () => {
    const articles = [2, 3].map((rang) => ({
      ...entite({ slug: `article-${rang}` }),
      rangUne: rang,
    }))

    const une = uneDe(articles)
    expect(une.hero).toBeNull()
    expect(une.secondaires).toHaveLength(2)
  })
})
