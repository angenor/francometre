import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import { creerArticle, publierArticle } from '../../server/services/articles'
import { reordonnerUne } from '../../server/services/une'
import { semerRubriques } from './harnais'

// US4 — Réordonner la Une réassigne les rangs 1..N en une transaction
// (permutation), refuse l'invalide, ne laisse jamais deux articles au même rang.

let compteur = 0

async function publie(titre: string) {
  compteur += 1
  const media = await prisma.media.create({
    data: { cle: `reordonner/${compteur}.jpg`, largeur: 1600, hauteur: 900, poids: 1000 },
  })
  const cree = await creerArticle({
    titre, chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport',
    couvertureId: media.id, couvertureAlt: 'Décrite.',
  })
  return publierArticle(cree.id)
}

describe('Réordonner la Une', () => {
  beforeEach(async () => {
    semerRubriques()
    compteur = 0
  })

  it('assigne les rangs 1..N dans l\'ordre du tableau', async () => {
    const a = await publie('A')
    const b = await publie('B')
    const c = await publie('C')

    const etat = await reordonnerUne([c.id, a.id, b.id])
    expect(etat.map((x) => [x.id, x.rangUne])).toEqual([[c.id, 1], [a.id, 2], [b.id, 3]])
  })

  it('est une permutation : réordonner échange les rangs sans doublon', async () => {
    const a = await publie('A')
    const b = await publie('B')

    await reordonnerUne([a.id, b.id])
    await reordonnerUne([b.id, a.id])

    expect((await prisma.article.findUnique({ where: { id: b.id } }))!.rangUne).toBe(1)
    expect((await prisma.article.findUnique({ where: { id: a.id } }))!.rangUne).toBe(2)
  })

  it('libère les épinglés absents du nouvel ordre', async () => {
    const a = await publie('A')
    const b = await publie('B')
    const c = await publie('C')

    await reordonnerUne([a.id, b.id, c.id])
    await reordonnerUne([a.id])

    expect((await prisma.article.findUnique({ where: { id: b.id } }))!.rangUne).toBeNull()
    expect((await prisma.article.findUnique({ where: { id: c.id } }))!.rangUne).toBeNull()
    expect((await prisma.article.findUnique({ where: { id: a.id } }))!.rangUne).toBe(1)
  })

  it('refuse un identifiant inconnu', async () => {
    await expect(reordonnerUne(['inexistant'])).rejects.toThrow(/identifiant/)
  })

  it('refuse un brouillon (à la Une ⇒ publié)', async () => {
    const brouillon = await creerArticle({
      titre: 'Brouillon', chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport',
    })
    await expect(reordonnerUne([brouillon.id])).rejects.toThrow(/brouillon/)
  })

  it('refuse un doublon', async () => {
    const a = await publie('A')
    await expect(reordonnerUne([a.id, a.id])).rejects.toThrow(/deux rangs/)
  })

  it('refuse plus de cinq articles', async () => {
    const ids: string[] = []
    for (let i = 0; i < 6; i += 1) ids.push((await publie(`A${i}`)).id)
    await expect(reordonnerUne(ids)).rejects.toThrow(/cinq/)
  })

  it('ne laisse jamais deux articles au même rang', async () => {
    const a = await publie('A')
    const b = await publie('B')
    const c = await publie('C')
    await reordonnerUne([a.id, b.id, c.id])

    const rangs = (await prisma.article.findMany({
      where: { rangUne: { not: null } }, select: { rangUne: true },
    })).map((x) => x.rangUne)
    expect(new Set(rangs).size).toBe(rangs.length)
  })
})
