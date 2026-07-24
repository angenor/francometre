import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import {
  compterArticlesAdmin,
  creerArticle,
  listerArticlesAdmin,
  modifierArticle,
  publierArticle,
} from '../../server/services/articles'
import { semerRubriques } from './harnais'

// US1 — La liste d'administration voit TOUT (brouillons et futurs), filtre et
// pagine côté serveur. À la différence des lectures publiques, elle n'applique
// PAS le critère de visibilité (research.md D12).

let compteur = 0
const pause = () => new Promise((r) => setTimeout(r, 8))

async function brouillon(titre: string, rubriqueId = 'environnement') {
  return creerArticle({ titre, chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId })
}

async function publie(titre: string, rubriqueId = 'sport', publieLe?: Date) {
  compteur += 1
  const media = await prisma.media.create({
    data: { cle: `admin/${compteur}.jpg`, largeur: 1600, hauteur: 900, poids: 240_000 },
  })
  const cree = await creerArticle({
    titre,
    chapo: 'Chapô.',
    corps: '<p>Corps.</p>',
    rubriqueId,
    couvertureId: media.id,
    couvertureAlt: 'Une couverture décrite.',
  })
  return publierArticle(cree.id, publieLe)
}

describe('Liste d\'administration', () => {
  beforeEach(async () => {
    semerRubriques()
    compteur = 0
  })

  it('montre les brouillons ET les articles datés du futur (FR-005)', async () => {
    await brouillon('Un brouillon')
    const futur = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    await publie('Un embargo', 'sport', futur)

    expect(await listerArticlesAdmin()).toHaveLength(2)
    expect(await compterArticlesAdmin()).toBe(2)
  })

  it('filtre par statut', async () => {
    await brouillon('B1')
    await brouillon('B2')
    await publie('P1')

    expect(await listerArticlesAdmin({ statut: 'brouillon' })).toHaveLength(2)
    expect(await listerArticlesAdmin({ statut: 'publie' })).toHaveLength(1)
    expect(await compterArticlesAdmin({ statut: 'brouillon' })).toBe(2)
  })

  it('filtre par rubrique', async () => {
    await brouillon('En environnement', 'environnement')
    await brouillon('En sport', 'sport')

    const r = await listerArticlesAdmin({ rubriqueId: 'sport' })
    expect(r).toHaveLength(1)
    expect(r[0]!.titre).toBe('En sport')
  })

  it('filtre par titre, insensible à la casse', async () => {
    await brouillon('Le retour du lynx')
    await brouillon('Un tout autre sujet')

    const r = await listerArticlesAdmin({ q: 'LYNX' })
    expect(r).toHaveLength(1)
    expect(r[0]!.titre).toBe('Le retour du lynx')
    expect(await compterArticlesAdmin({ q: 'lynx' })).toBe(1)
  })

  it('cumule les filtres (rubrique ET statut)', async () => {
    await brouillon('Env brouillon', 'environnement')
    await publie('Env publié', 'environnement')
    await publie('Sport publié', 'sport')

    const r = await listerArticlesAdmin({ rubriqueId: 'environnement', statut: 'publie' })
    expect(r).toHaveLength(1)
    expect(r[0]!.titre).toBe('Env publié')
  })

  it('trie par date de modification décroissante (le plus récent d\'abord)', async () => {
    const premier = await brouillon('Premier écrit')
    await pause()
    await brouillon('Second écrit')
    await pause()
    // On touche le premier : il redevient le plus récemment modifié.
    await modifierArticle(premier.id, { chapo: 'Chapô révisé.' })

    const liste = await listerArticlesAdmin()
    expect(liste[0]!.titre).toBe('Premier écrit')
  })

  it('pagine (skip/take)', async () => {
    for (let i = 1; i <= 5; i += 1) await brouillon(`Article ${i}`)

    expect(await listerArticlesAdmin({ page: 1, taille: 2 })).toHaveLength(2)
    expect(await listerArticlesAdmin({ page: 2, taille: 2 })).toHaveLength(2)
    expect(await listerArticlesAdmin({ page: 3, taille: 2 })).toHaveLength(1)
    expect(await compterArticlesAdmin()).toBe(5)
  })
})
