import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import { creerArticle } from '../../server/services/articles'
import { epinglerArticle } from '../../server/services/une'
import { semerRubriques } from './harnais'

// US3 — Épingler depuis l'éditeur PUBLIE d'abord (D11) : gardes de publication
// (couverture + alt), refus nommé sinon, puis placement au rang avec éviction.

let compteur = 0

async function media() {
  compteur += 1
  return prisma.media.create({
    data: { cle: `epingler/${compteur}.jpg`, largeur: 1600, hauteur: 900, poids: 1000 },
  })
}

async function brouillonComplet(titre: string) {
  const m = await media()
  return creerArticle({
    titre, chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport',
    couvertureId: m.id, couvertureAlt: 'Une couverture décrite.',
  })
}

describe('Épingler qui publie', () => {
  beforeEach(async () => {
    semerRubriques()
    compteur = 0
  })

  it('publie un brouillon complet puis le place au rang', async () => {
    const brouillon = await brouillonComplet('À épingler')
    expect(brouillon.statut).toBe('brouillon')

    await epinglerArticle(brouillon.id, 2)

    const relu = await prisma.article.findUnique({ where: { id: brouillon.id } })
    expect(relu!.statut).toBe('publie')
    expect(relu!.publieLe).not.toBeNull()
    expect(relu!.rangUne).toBe(2)
  })

  it('refuse d\'épingler un brouillon SANS couverture (refus nommé)', async () => {
    const brouillon = await creerArticle({
      titre: 'Sans couverture', chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport',
    })

    await expect(epinglerArticle(brouillon.id, 1)).rejects.toThrow(/couverture/)

    const relu = await prisma.article.findUnique({ where: { id: brouillon.id } })
    expect(relu!.statut).toBe('brouillon')
    expect(relu!.rangUne).toBeNull()
  })

  it('refuse d\'épingler si la couverture n\'a pas de texte alternatif', async () => {
    const m = await media()
    const brouillon = await creerArticle({
      titre: 'Sans alt', chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport',
      couvertureId: m.id,
    })

    await expect(epinglerArticle(brouillon.id, 1)).rejects.toThrow(/alternatif/)
  })

  it('évince l\'occupant du rang, qui reste publié hors Une', async () => {
    const occupant = await brouillonComplet('Occupant')
    const venu = await brouillonComplet('Nouveau venu')

    await epinglerArticle(occupant.id, 3)
    await epinglerArticle(venu.id, 3)

    const reluOccupant = await prisma.article.findUnique({ where: { id: occupant.id } })
    const reluVenu = await prisma.article.findUnique({ where: { id: venu.id } })
    expect(reluOccupant!.rangUne).toBeNull()
    expect(reluOccupant!.statut).toBe('publie')
    expect(reluVenu!.rangUne).toBe(3)
  })

  it('refuse un rang hors 1–5, avant toute écriture', async () => {
    const brouillon = await brouillonComplet('Hors rang')
    await expect(epinglerArticle(brouillon.id, 0)).rejects.toThrow(/entre 1 et 5/)
    await expect(epinglerArticle(brouillon.id, 6)).rejects.toThrow(/entre 1 et 5/)

    const relu = await prisma.article.findUnique({ where: { id: brouillon.id } })
    expect(relu!.statut).toBe('brouillon')
  })

  it('déplace un article DÉJÀ publié sans le redater', async () => {
    const article = await brouillonComplet('Déjà publié')
    await epinglerArticle(article.id, 1)
    const date1 = (await prisma.article.findUnique({ where: { id: article.id } }))!.publieLe

    await epinglerArticle(article.id, 2)
    const relu = await prisma.article.findUnique({ where: { id: article.id } })
    expect(relu!.publieLe).toEqual(date1)
    expect(relu!.rangUne).toBe(2)
  })
})
