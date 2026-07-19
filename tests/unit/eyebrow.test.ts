import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { eyebrowDe } from '../../shared/utils/eyebrow'

// US5 — L'eyebrow s'affiche selon le contexte de lecture.
// SC-005 : les trois cas de figure.
//
// Appel programmatique PUR : aucune base n'est ouverte ici, et c'est le point.

const AVEC_SOUS_THEME = { rubriqueId: 'environnement', sousTheme: 'Biodiversité' }
const SANS_SOUS_THEME = { rubriqueId: 'environnement', sousTheme: null }

describe('Le libellé contextuel d\'une vignette', () => {
  it('affiche le SOUS-THÈME quand le lecteur est déjà dans la rubrique', () => {
    // Page rubrique, « à lire aussi » de même rubrique : répéter
    // « Environnement » n'apprendrait rien au lecteur.
    expect(eyebrowDe(AVEC_SOUS_THEME, 'environnement')).toBe('Biodiversité')
  })

  it('affiche la RUBRIQUE partout ailleurs, même avec un sous-thème', () => {
    // Accueil, listes toutes rubriques : c'est la rubrique qui situe l'article.
    expect(eyebrowDe(AVEC_SOUS_THEME, null)).toBe('Environnement')
    expect(eyebrowDe(AVEC_SOUS_THEME)).toBe('Environnement')
    // Depuis une AUTRE rubrique, la rubrique de l'article, pas celle du lecteur.
    expect(eyebrowDe(AVEC_SOUS_THEME, 'sport')).toBe('Environnement')
  })

  it('affiche la RUBRIQUE sans sous-thème, quel que soit le contexte', () => {
    expect(eyebrowDe(SANS_SOUS_THEME, 'environnement')).toBe('Environnement')
    expect(eyebrowDe(SANS_SOUS_THEME, null)).toBe('Environnement')
    expect(eyebrowDe(SANS_SOUS_THEME)).toBe('Environnement')

    // Un sous-thème vide ou fait d'espaces n'est pas un sous-thème : il ne doit
    // pas produire un eyebrow blanc.
    expect(eyebrowDe({ rubriqueId: 'environnement', sousTheme: '   ' }, 'environnement'))
      .toBe('Environnement')
  })

  it('est une fonction PURE : même entrée, même sortie', () => {
    const premier = eyebrowDe(AVEC_SOUS_THEME, 'environnement')
    const second = eyebrowDe(AVEC_SOUS_THEME, 'environnement')
    expect(second).toBe(premier)

    // Elle ne modifie pas non plus son entrée.
    expect(AVEC_SOUS_THEME).toEqual({ rubriqueId: 'environnement', sousTheme: 'Biodiversité' })
  })

  it('ne rapproche AUCUN article par son sous-thème (US5 scénario 4)', () => {
    // Assertion négative : deux articles partageant « Biodiversité » ne sont
    // liés par rien. Rendre le sous-thème relationnel créerait précisément le
    // lien entre articles homonymes que la spécification interdit.
    const schema = readFileSync('prisma/schema.prisma', 'utf8')

    // Aucune table de sous-thèmes.
    expect(schema).not.toMatch(/model\s+SousTheme/i)
    // `sousTheme` n'est ni une clé étrangère, ni unique, ni indexé — trois
    // formes de rapprochement, toutes absentes.
    expect(schema).not.toMatch(/sousTheme.*@relation/)
    expect(schema).not.toMatch(/sousTheme.*@unique/)
    expect(schema).not.toMatch(/@@index\(\[[^\]]*sousTheme/)

    // Et aucune fonction de regroupement sur le sous-thème n'est exposée.
    const services = ['articles', 'rubriques', 'une']
      .map((nom) => readFileSync(`server/services/${nom}.ts`, 'utf8'))
      .join('\n')
    expect(services).not.toMatch(/groupBy[\s\S]{0,120}sousTheme/)
    expect(services).not.toMatch(/where:\s*\{[^}]*sousTheme/)
  })
})
