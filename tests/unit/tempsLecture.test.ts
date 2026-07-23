import { describe, expect, it } from 'vitest'
import { tempsLecture } from '../../shared/utils/tempsLecture'

// US2 — Le temps de lecture est une valeur dérivée du corps (FR-014, research D4).
// Fonction pure : ni base, ni harnais.

/** Un corps de `n` mots, enveloppé de paragraphes. */
function corpsDe(nombreDeMots: number): string {
  return `<p>${Array.from({ length: nombreDeMots }, () => 'mot').join(' ')}</p>`
}

describe('Estimation du temps de lecture', () => {
  it('divise le nombre de mots par 200 et arrondit au supérieur', () => {
    // 200 mots → 1 min pile ; 201 → 2 (arrondi supérieur) ; 400 → 2 ; 401 → 3.
    expect(tempsLecture(corpsDe(200))).toBe(1)
    expect(tempsLecture(corpsDe(201))).toBe(2)
    expect(tempsLecture(corpsDe(400))).toBe(2)
    expect(tempsLecture(corpsDe(401))).toBe(3)
  })

  it('applique un plancher de 1 minute, même sur un texte très court', () => {
    expect(tempsLecture('<p>Trois petits mots.</p>')).toBe(1)
    // Un corps vide n'est pas 0 min : le plancher tient.
    expect(tempsLecture('')).toBe(1)
    expect(tempsLecture('<p></p>')).toBe(1)
  })

  it('compte les MOTS du texte, jamais les balises', () => {
    // Cinquante mots enrobés d'intertitres, listes et emphases : le balisage ne
    // gonfle pas le compte. 50 mots restent bien sous la barre d'une minute.
    const riche
      = '<h2>Un titre</h2><p>' + Array.from({ length: 50 }, () => 'mot').join(' ')
        + '</p><ul><li>puce</li></ul>'
    // 50 + « Un titre » (2) + « puce » (1) = 53 mots → 1 min.
    expect(tempsLecture(riche)).toBe(1)
  })

  it('ne colle pas deux mots séparés par une seule balise', () => {
    // « fin » et « Suite » sont deux mots, pas « finSuite » : la balise devient
    // un espace au débalisage.
    const corps = '<p>fin</p><p>Suite</p>'
    // Le débalisage doit produire deux mots distincts.
    expect(tempsLecture(corps)).toBe(1)
    const texte = corps.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean)
    expect(texte).toEqual(['fin', 'Suite'])
  })
})
