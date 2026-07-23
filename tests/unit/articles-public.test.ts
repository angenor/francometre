import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import {
  compterArticlesPublics,
  creerArticle,
  listerArticlesPublics,
  publierArticle,
} from '../../server/services/articles'
import { semerRubriques } from './harnais'

// Pages publiques — pagination : comptage et découpage (SC-002, research D3).
//
// Le cœur du risque est ici, au niveau service : un total qui ne colle pas au
// `where` de la liste trahirait le découpage. La route (404 hors bornes) est
// couverte par l'e2e ; ces tests prouvent l'invariant « toutes les pages
// restituent l'ensemble, sans doublon ni omission ».

const TAILLE = 12
const DEPART = Date.UTC(2026, 6, 20, 9, 0, 0)

let compteur = 0

/** Un article publié, daté de `joursAvant` jours avant un instant fixe. */
async function articlePublie(rubriqueId: string, joursAvant: number) {
  compteur += 1
  const media = await prisma.media.create({
    data: {
      cle: `articles/pagination-${compteur}.jpg`,
      largeur: 1600,
      hauteur: 900,
      poids: 240_000,
    },
  })
  const cree = await creerArticle({
    titre: `Article ${compteur}`,
    chapo: 'Chapô de vérification.',
    corps: '<p>Corps.</p>',
    rubriqueId,
    couvertureId: media.id,
    couvertureAlt: 'Une couverture décrite.',
  })
  return publierArticle(cree.id, new Date(DEPART - joursAvant * 86_400_000))
}

describe('Pagination des articles publics', () => {
  beforeEach(async () => {
    semerRubriques()
    compteur = 0
  })

  it('compte exactement les articles visibles d\'une rubrique', async () => {
    for (let i = 0; i < 15; i += 1) await articlePublie('environnement', i)
    // Un brouillon et un article d'une autre rubrique ne doivent pas être comptés.
    await creerArticle({
      titre: 'Brouillon',
      chapo: 'Chapô.',
      corps: '<p>En cours.</p>',
      rubriqueId: 'environnement',
    })
    await articlePublie('culture', 0)

    expect(await compterArticlesPublics({ rubriqueId: 'environnement' })).toBe(15)
    // Toutes rubriques : 15 + 1 (culture) publiés, le brouillon exclu.
    expect(await compterArticlesPublics()).toBe(16)
  })

  it('découpe les pages sans doublon ni omission, du plus récent au plus ancien', async () => {
    for (let i = 0; i < 15; i += 1) await articlePublie('environnement', i)

    const total = await compterArticlesPublics({ rubriqueId: 'environnement' })
    const totalPages = Math.ceil(total / TAILLE)
    expect(totalPages).toBe(2)

    const collectes: string[] = []
    for (let page = 1; page <= totalPages; page += 1) {
      const lot = await listerArticlesPublics({
        rubriqueId: 'environnement',
        limite: TAILLE,
        decalage: (page - 1) * TAILLE,
      })
      expect(lot.length).toBeLessThanOrEqual(TAILLE)
      collectes.push(...lot.map((a) => a.slug))
    }

    // Aucune omission : autant d'articles que le total.
    expect(collectes).toHaveLength(total)
    // Aucun doublon : autant de slugs distincts que d'articles.
    expect(new Set(collectes).size).toBe(total)

    // L'ordre est décroissant sur la date de parution, sur l'ensemble concaténé.
    const complet = await listerArticlesPublics({ rubriqueId: 'environnement' })
    const dates = complet.map((a) => a.publieLe!.getTime())
    expect(dates).toEqual([...dates].sort((x, y) => y - x))
  })

  it('rend une rubrique vide sans erreur : total 0, liste vide', async () => {
    // « sport » n'a aucun article : ce n'est pas une erreur, c'est l'état vide.
    expect(await compterArticlesPublics({ rubriqueId: 'sport' })).toBe(0)
    expect(await listerArticlesPublics({ rubriqueId: 'sport' })).toEqual([])
  })

  it('joint la couverture pour que le DTO en calcule l\'URL (research D9)', async () => {
    await articlePublie('environnement', 0)
    const [article] = await listerArticlesPublics({ rubriqueId: 'environnement' })
    // La clé est présente ; l'URL n'est PAS stockée (porte 9), elle se calcule.
    expect(article!.couverture?.cle).toMatch(/^articles\/pagination-/)
  })
})
