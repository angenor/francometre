import { beforeEach, describe, expect, it } from 'vitest'
import {
  enregistrerEtVerifier,
  LIMITE_FENETRE_MS,
  LIMITE_SEUIL,
  reinitialiserLimiteDebit,
} from '../../server/utils/limiteDebit'

// FR-011a — la force brute grossière est écartée par une fenêtre glissante en
// mémoire. Le temps est INJECTÉ pour éprouver la fenêtre de façon déterministe.

describe('Limitation de débit par IP', () => {
  beforeEach(() => {
    reinitialiserLimiteDebit()
  })

  it('autorise sous le seuil, refuse une fois le seuil atteint', () => {
    const t = 1_000_000
    for (let i = 0; i < LIMITE_SEUIL; i++) {
      expect(enregistrerEtVerifier('ip-a', t).autorise).toBe(true)
    }
    // La tentative de trop est refusée.
    expect(enregistrerEtVerifier('ip-a', t).autorise).toBe(false)
  })

  it('rouvre l\'accès après glissement de la fenêtre', () => {
    const t0 = 1_000_000
    for (let i = 0; i < LIMITE_SEUIL; i++) enregistrerEtVerifier('ip-b', t0)
    expect(enregistrerEtVerifier('ip-b', t0).autorise).toBe(false)

    // Au-delà de la fenêtre : les tentatives anciennes ont expiré, l'accès rouvre.
    const t1 = t0 + LIMITE_FENETRE_MS + 1
    expect(enregistrerEtVerifier('ip-b', t1).autorise).toBe(true)
  })

  it('compte chaque IP indépendamment', () => {
    const t = 2_000_000
    for (let i = 0; i < LIMITE_SEUIL; i++) enregistrerEtVerifier('ip-c', t)
    expect(enregistrerEtVerifier('ip-c', t).autorise).toBe(false)

    // Une autre IP repart de zéro : le refus est LOCAL à l'adresse.
    expect(enregistrerEtVerifier('ip-d', t).autorise).toBe(true)
  })
})
