import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import {
  creerArticle,
  depublierArticle,
  lireUne,
  publierArticle,
  supprimerArticle,
} from '../../server/services/articles'
import { placerALaUne, retirerDeLaUne } from '../../server/services/une'
import { semerRubriques } from './harnais'

// US4 — La Une porte cinq articles ordonnés.
// SC-004 : aucun doublon de rang, et l'éviction réussit.

const PARUTION = new Date('2026-07-01T10:00:00Z')
const MAINTENANT = new Date('2026-07-19T10:00:00Z')

let compteur = 0

async function articlePublie(titre: string) {
  compteur += 1
  const media = await prisma.media.create({
    data: {
      cle: `articles/2026/07/une-${compteur}.jpg`,
      largeur: 1600,
      hauteur: 900,
      poids: 240_000,
    },
  })
  const cree = await creerArticle({
    titre,
    chapo: 'Chapô de vérification.',
    corps: '<p>Corps.</p>',
    rubriqueId: 'environnement',
    couvertureId: media.id,
    couvertureAlt: 'Une photographie de couverture, décrite.',
  })
  return publierArticle(cree.id, PARUTION)
}

describe('Composition de la Une', () => {
  beforeEach(async () => {
    semerRubriques()
    compteur = 0
  })

  it('rend les cinq rangs dans l\'ordre croissant (FR-018)', async () => {
    const articles = []
    for (let rang = 1; rang <= 5; rang += 1) {
      articles.push(await articlePublie(`Article ${rang}`))
    }
    // Placés dans le désordre, pour que l'ordre de lecture ne doive rien à
    // l'ordre d'insertion.
    for (const rang of [3, 1, 5, 2, 4]) {
      await placerALaUne(articles[rang - 1]!.id, rang)
    }

    const une = await lireUne(MAINTENANT)

    expect(une).toHaveLength(5)
    expect(une.map((a) => a.rangUne)).toEqual([1, 2, 3, 4, 5])
    expect(une.map((a) => a.titre)).toEqual([
      'Article 1', 'Article 2', 'Article 3', 'Article 4', 'Article 5',
    ])
  })

  it('déloge l\'occupant quand on assigne un rang occupé — et RÉUSSIT (FR-016a)', async () => {
    const premier = await articlePublie('Premier occupant')
    const second = await articlePublie('Nouveau venu')

    await placerALaUne(premier.id, 3)

    // L'opération réussit, elle n'échoue pas : c'est le point du contrat.
    const etat = await placerALaUne(second.id, 3)

    expect(etat.map((a) => a.id)).toEqual([second.id])

    const delogé = await prisma.article.findUnique({ where: { id: premier.id } })
    // L'occupant quitte la Une, mais reste publié : il n'est pas dépublié.
    expect(delogé!.rangUne).toBeNull()
    expect(delogé!.statut).toBe('publie')
  })

  it('n\'expose à aucun moment deux articles au même rang (SC-004)', async () => {
    const premier = await articlePublie('Premier')
    const second = await articlePublie('Second')

    await placerALaUne(premier.id, 2)
    await placerALaUne(second.id, 2)

    // L'état intermédiaire est rendu inobservable par la transaction ; ce qui
    // se vérifie, c'est qu'aucun rang n'est porté deux fois.
    const occupes = await prisma.article.findMany({
      where: { rangUne: { not: null } },
      select: { rangUne: true },
    })
    const rangs = occupes.map((a) => a.rangUne)
    expect(new Set(rangs).size).toBe(rangs.length)
  })

  it('refuse le rang 0 et le rang 6 (FR-015)', async () => {
    const article = await articlePublie('Hors intervalle')

    await expect(placerALaUne(article.id, 0)).rejects.toThrow(/entre 1 et 5/)
    await expect(placerALaUne(article.id, 6)).rejects.toThrow(/entre 1 et 5/)
    // Un rang non entier n'est pas davantage un rang.
    await expect(placerALaUne(article.id, 2.5)).rejects.toThrow(/entier/)

    // Aucun de ces refus n'a laissé de trace.
    expect(await lireUne(MAINTENANT)).toHaveLength(0)
  })

  it('refuse de placer un brouillon à la Une (FR-017)', async () => {
    const brouillon = await creerArticle({
      titre: 'Encore en travaux',
      chapo: 'Chapô.',
      corps: '<p>Corps.</p>',
      rubriqueId: 'sport',
    })

    await expect(placerALaUne(brouillon.id, 1))
      .rejects.toThrow(/brouillon ne peut pas être placé à la Une/)
  })

  it('libère le rang quand l\'article est dépublié (US4 scénario 4)', async () => {
    const article = await articlePublie('Bientôt retiré')
    await placerALaUne(article.id, 4)

    await depublierArticle(article.id)

    // Un article invisible du public ne peut pas occuper une place en accueil.
    const apres = await prisma.article.findUnique({ where: { id: article.id } })
    expect(apres!.rangUne).toBeNull()
    expect(await lireUne(MAINTENANT)).toHaveLength(0)
  })

  it('retire un article de la Une sur demande', async () => {
    const article = await articlePublie('Retiré à la main')
    await placerALaUne(article.id, 1)

    const etat = await retirerDeLaUne(article.id)

    expect(etat).toHaveLength(0)
    const apres = await prisma.article.findUnique({ where: { id: article.id } })
    expect(apres!.rangUne).toBeNull()
    // Retirer de la Une ne dépublie pas.
    expect(apres!.statut).toBe('publie')
  })

  it('refuse la suppression d\'un article qui occupe un rang (FR-029)', async () => {
    const article = await articlePublie('Occupant du rang 3')
    await placerALaUne(article.id, 3)

    await expect(supprimerArticle(article.id)).rejects.toThrow(/occupe le rang 3/)

    // L'article est toujours là, et toujours à la Une.
    expect(await lireUne(MAINTENANT)).toHaveLength(1)

    // Le retirer d'abord est un geste délibéré ; ensuite, la suppression passe.
    await retirerDeLaUne(article.id)
    await supprimerArticle(article.id)
    expect(await prisma.article.count()).toBe(0)
  })

  it('n\'inclut à la Une que ce qui est visible du public', async () => {
    const article = await articlePublie('À la Une mais daté du futur')
    await placerALaUne(article.id, 1)

    // Placé au rang 1, mais pas encore paru à cet instant : la Une applique le
    // même critère de visibilité que les autres chemins de lecture.
    const avantParution = new Date('2026-06-01T10:00:00Z')
    expect(await lireUne(avantParution)).toHaveLength(0)
    expect(await lireUne(MAINTENANT)).toHaveLength(1)
  })
})
