import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { creerCompte } from '../../server/services/comptes'
import { exigerCompte } from '../../server/utils/session'
import { viderLaBase } from './harnais'

// FR-016 — une session dont le compte n'existe plus n'est plus une session.
//
// `exigerCompte` s'appuie sur trois auto-imports Nitro (`requireUserSession`,
// `clearUserSession`, `createError`), absents sous Vitest. On les pose sur
// `globalThis` : les références nues du code les y résolvent au moment de
// l'appel. C'est le comportement du garde qu'on éprouve, pas le module de session.

const g = globalThis as unknown as Record<string, unknown>
const evenement = {} as H3Event

/** Stub de `createError` : une erreur portant les champs passés (statusCode…). */
function poserCreateError() {
  g.createError = (e: { statusCode: number, statusMessage?: string }) =>
    Object.assign(new Error(e.statusMessage ?? 'erreur'), e)
}

describe('exigerCompte — garde de session', () => {
  beforeEach(() => {
    viderLaBase()
  })

  afterEach(() => {
    delete g.requireUserSession
    delete g.clearUserSession
    delete g.createError
    vi.restoreAllMocks()
  })

  it('refuse sans session valide (le 401 du module n\'est pas rattrapé)', async () => {
    poserCreateError()
    g.requireUserSession = vi.fn().mockRejectedValue(
      (g.createError as (e: object) => Error)({ statusCode: 401 }),
    )

    await expect(exigerCompte(evenement)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('refuse si le compte a disparu entre l\'ouverture et la requête (FR-016)', async () => {
    poserCreateError()
    const clear = vi.fn()
    g.clearUserSession = clear
    g.requireUserSession = vi.fn().mockResolvedValue({
      user: { identifiant: 'absent@francometre.com' },
    })

    await expect(exigerCompte(evenement)).rejects.toMatchObject({ statusCode: 401 })
    // La session fantôme est effacée au passage.
    expect(clear).toHaveBeenCalledOnce()
  })

  it('laisse passer et rend le user si le compte existe encore', async () => {
    const compte = await creerCompte({
      identifiant: 'present@francometre.com',
      motDePasse: 'un-mot-de-passe-assez-long',
      nomAffichable: 'Présent',
    })
    g.requireUserSession = vi.fn().mockResolvedValue({
      user: {
        id: compte.id,
        identifiant: 'present@francometre.com',
        nomAffichable: 'Présent',
        role: 'redaction',
      },
    })

    const user = await exigerCompte(evenement)
    expect(user.identifiant).toBe('present@francometre.com')
  })
})
