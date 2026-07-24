import { describe, expect, it } from 'vitest'
import { ROBOTS_NOINDEX, urlCanonique } from '../../app/utils/seo'

// Foundational — l'adresse canonique absolue (T002, contrat `contracts/seo.md` §2).
// Fonction PURE : aucune base, aucun harnais. On prouve les quatre normalisations.

const APEX = 'https://francometre.com'

describe('urlCanonique', () => {
  it('joint l\'apex et un chemin simple', () => {
    expect(urlCanonique(APEX, '/rubrique/environnement'))
      .toBe('https://francometre.com/rubrique/environnement')
  })

  it('rend la racine « / » sur l\'apex', () => {
    expect(urlCanonique(APEX, '/')).toBe('https://francometre.com/')
  })

  it('CONSERVE le paramètre ?page=2 (pagination indexable, D5)', () => {
    expect(urlCanonique(APEX, '/rubrique/environnement?page=2'))
      .toBe('https://francometre.com/rubrique/environnement?page=2')
    expect(urlCanonique(APEX, '/articles?page=3'))
      .toBe('https://francometre.com/articles?page=3')
  })

  it('ne double JAMAIS la barre, même si siteUrl finit par « / »', () => {
    expect(urlCanonique('https://francometre.com/', '/articles'))
      .toBe('https://francometre.com/articles')
    expect(urlCanonique('https://francometre.com//', '/'))
      .toBe('https://francometre.com/')
  })

  it('normalise la barre finale superflue', () => {
    expect(urlCanonique(APEX, '/rubrique/environnement/'))
      .toBe('https://francometre.com/rubrique/environnement')
    // La barre finale disparaît, mais la requête reste intacte.
    expect(urlCanonique(APEX, '/articles/?page=2'))
      .toBe('https://francometre.com/articles?page=2')
  })
})

describe('ROBOTS_NOINDEX', () => {
  it('interdit l\'indexation mais laisse suivre les liens', () => {
    expect(ROBOTS_NOINDEX).toBe('noindex, follow')
  })
})
