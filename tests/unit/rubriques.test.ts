import { beforeEach, describe, expect, it } from 'vitest'
import { RUBRIQUES } from '../../shared/utils/rubriques'
import { listerRubriques, rubriqueParId } from '../../server/services/rubriques'
import { jouerLeSeed } from './harnais'

// US1 — Le site dispose de ses huit rubriques.
// SC-001 : huit rubriques, dans l'ordre du rail.
// SC-002 : le seed est rejouable — ni doublon, ni identifiant changé.

describe('Les huit rubriques', () => {
  beforeEach(() => {
    jouerLeSeed()
  })

  it('sont exactement huit sur base vierge', async () => {
    const rubriques = await listerRubriques()
    expect(rubriques).toHaveLength(8)
  })

  it('sortent dans l\'ordre du rail, et non dans un ordre alphabétique', async () => {
    const rubriques = await listerRubriques()

    expect(rubriques.map((r) => r.id)).toEqual(RUBRIQUES.map((r) => r.id))
    expect(rubriques.map((r) => r.ordre)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])

    // Le premier libellé attendu porte ses diacritiques : c'est la table qui
    // sert le rail, et « Education » y serait un défaut de langue.
    expect(rubriques.map((r) => r.libelle)).toEqual([
      'Environnement', 'Sport', 'Éducation', 'Santé',
      'Diplomatie', 'Culture', 'Technologie', 'Économie',
    ])
  })

  it('se lisent par leur identifiant d\'URL', async () => {
    const rubrique = await rubriqueParId('environnement')
    expect(rubrique?.libelle).toBe('Environnement')

    // Un identifiant inconnu retourne `null`, il ne lève pas.
    expect(await rubriqueParId('gastronomie')).toBeNull()
  })

  it('ne se dupliquent pas quand le seed est rejoué (SC-002)', async () => {
    const avant = await listerRubriques()

    jouerLeSeed()
    jouerLeSeed()

    const apres = await listerRubriques()

    expect(apres).toHaveLength(8)
    // Les identifiants sont ceux du fichier source, pas des `cuid()` : rejouer
    // le seed ne peut donc pas en fabriquer de nouveaux.
    expect(apres.map((r) => r.id)).toEqual(avant.map((r) => r.id))
    expect(apres.map((r) => r.ordre)).toEqual(avant.map((r) => r.ordre))
  })

  it('n\'exposent aucune écriture (FR-004)', async () => {
    // L'ensemble est figé par l'ABSENCE d'API, pas par une vérification.
    // Ce test constate le contrat : si une création apparaissait un jour dans
    // le service, il faudrait le modifier sciemment.
    const service = await import('../../server/services/rubriques')

    expect(Object.keys(service).sort()).toEqual(['listerRubriques', 'rubriqueParId'])
  })
})
