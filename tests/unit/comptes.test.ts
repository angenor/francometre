import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import {
  compteParIdentifiant,
  creerCompte,
  verifierMotDePasse,
} from '../../server/services/comptes'
import { viderLaBase } from './harnais'

// US6 — Les comptes de rédaction sont représentés.
// FR-021 : le secret est haché, et l'empreinte ne sort JAMAIS.

const COMPTE = {
  identifiant: 'redaction',
  motDePasse: 'un-mot-de-passe-assez-long',
  nomAffichable: 'Rédaction',
}

describe('Comptes de rédaction', () => {
  beforeEach(() => {
    viderLaBase()
  })

  it('se crée et se relit par son identifiant', async () => {
    const cree = await creerCompte(COMPTE)

    expect(cree.identifiant).toBe('redaction')
    expect(cree.nomAffichable).toBe('Rédaction')

    const relu = await compteParIdentifiant('redaction')
    expect(relu?.id).toBe(cree.id)
    expect(await compteParIdentifiant('inconnu')).toBeNull()
  })

  it('refuse un identifiant en doublon (US6 scénario 2)', async () => {
    await creerCompte(COMPTE)

    await expect(creerCompte({ ...COMPTE, nomAffichable: 'Autre' }))
      .rejects.toThrow(/déjà pris/)

    expect(await prisma.compte.count()).toBe(1)
  })

  it('ne retourne JAMAIS l\'empreinte — ni dans la valeur, ni dans le type', async () => {
    const cree = await creerCompte(COMPTE)
    const relu = await compteParIdentifiant('redaction')

    for (const sortie of [cree, relu]) {
      // Le champ est absent de l'objet, pas seulement vide.
      expect(Object.keys(sortie!)).toEqual(['id', 'identifiant', 'nomAffichable', 'creeLe'])
      expect('motDePasseHache' in sortie!).toBe(false)
      // Et l'empreinte ne transparaît nulle part dans la sortie sérialisée.
      expect(JSON.stringify(sortie)).not.toContain('$argon2')
    }

    // @ts-expect-error — le type de retour EXCLUT l'empreinte : ce n'est pas
    // une omission de politesse, c'est une impossibilité de contrat.
    void cree.motDePasseHache
  })

  it('hache le mot de passe AVANT qu\'il n\'atteigne la base (FR-021)', async () => {
    await creerCompte(COMPTE)

    // On lit la colonne directement : c'est le seul moyen de prouver que le
    // secret n'y est pas en clair.
    const brut = await prisma.compte.findUnique({ where: { identifiant: 'redaction' } })

    expect(brut!.motDePasseHache).not.toContain(COMPTE.motDePasse)
    expect(brut!.motDePasseHache.startsWith('$argon2id$')).toBe(true)
  })

  it('vérifie un mot de passe en rendant un BOOLÉEN et rien d\'autre', async () => {
    await creerCompte(COMPTE)

    const bon = await verifierMotDePasse('redaction', COMPTE.motDePasse)
    const mauvais = await verifierMotDePasse('redaction', 'ce-n-est-pas-le-bon')
    const inconnu = await verifierMotDePasse('personne', COMPTE.motDePasse)

    expect(bon).toBe(true)
    expect(mauvais).toBe(false)
    expect(inconnu).toBe(false)

    // « Compte inconnu » et « mot de passe faux » se répondent à l'identique :
    // les distinguer dirait à un attaquant quels identifiants existent.
    expect(mauvais).toBe(inconnu)
  })

  it('refuse un mot de passe trop court, avec un message en français', async () => {
    await expect(creerCompte({ ...COMPTE, motDePasse: 'court' }))
      .rejects.toThrow(/au moins 12 caractères/)
  })
})
