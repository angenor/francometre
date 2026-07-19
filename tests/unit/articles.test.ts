import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import { creerArticle, modifierArticle, supprimerArticle } from '../../server/services/articles'
import { semerRubriques } from './harnais'

// US2 — Un article se crée, se lit et se modifie.
// FR-005 à FR-009, FR-008a.

/** Le minimum viable d'un brouillon : un brouillon PEUT être incomplet. */
function brouillon(surcharge: Record<string, unknown> = {}) {
  return {
    titre: 'Le retour du lynx',
    chapo: 'Un félin discret regagne les massifs de l\'est.',
    corps: '<p>Le lynx boréal recolonise le Jura.</p>',
    rubriqueId: 'environnement',
    ...surcharge,
  }
}

describe('Cycle de vie d\'un article', () => {
  beforeEach(() => {
    semerRubriques()
  })

  it('se crée puis se relit par son slug', async () => {
    const cree = await creerArticle(brouillon())

    expect(cree.slug).toBe('le-retour-du-lynx')

    const relu = await prisma.article.findUnique({ where: { slug: 'le-retour-du-lynx' } })
    expect(relu?.id).toBe(cree.id)
    expect(relu?.statut).toBe('brouillon')
    // Jamais publié : la date de parution est NULLE, pas une date inventée.
    expect(relu?.publieLe).toBeNull()
  })

  it('dérive son slug du titre, diacritiques retirés', async () => {
    const cree = await creerArticle(brouillon({ titre: 'Écoles : la rentrée décalée' }))
    expect(cree.slug).toBe('ecoles-la-rentree-decalee')
  })

  it('résout une collision de slug dérivé par un suffixe distinctif', async () => {
    const premier = await creerArticle(brouillon())
    const second = await creerArticle(brouillon())

    expect(premier.slug).toBe('le-retour-du-lynx')
    expect(second.slug).toBe('le-retour-du-lynx-2')
    expect(second.id).not.toBe(premier.id)
  })

  it('refuse un slug CHOISI déjà pris, plutôt que d\'y coller un suffixe', async () => {
    await creerArticle(brouillon({ slug: 'lynx' }))

    // La distinction est délibérée : un slug dérivé se corrige, un slug demandé
    // se refuse — sans quoi l'auteur croirait avoir choisi une adresse.
    await expect(creerArticle(brouillon({ slug: 'lynx' })))
      .rejects.toThrow(/déjà pris/)
  })

  it('refuse une rubrique inconnue (FR-006)', async () => {
    await expect(creerArticle(brouillon({ rubriqueId: 'gastronomie' })))
      .rejects.toThrow(/gastronomie.*n'existe pas/)
  })

  it('assainit le corps AVANT stockage (FR-011, porte 11)', async () => {
    const cree = await creerArticle(brouillon({
      corps: '<p onclick="voler()">Texte</p><script>voler()</script>'
        + '<h1>Titre concurrent</h1><a href="javascript:voler()">lien</a>',
    }))

    // C'est la BASE qu'on relit, pas la valeur retournée : la garantie porte
    // sur ce qui est stocké.
    const enBase = await prisma.article.findUnique({ where: { id: cree.id } })

    expect(enBase!.corps).not.toContain('script')
    expect(enBase!.corps).not.toContain('onclick')
    expect(enBase!.corps).not.toContain('javascript:')
    // `h1` est hors liste blanche : le titre de la page est le titre de
    // l'article, un second `h1` casserait la hiérarchie de titres.
    expect(enBase!.corps).not.toContain('<h1')
    expect(enBase!.corps).toContain('<p>Texte</p>')
  })

  it('refuse les trois dépassements de longueur, sans jamais tronquer (FR-008a)', async () => {
    await expect(creerArticle(brouillon({ titre: 'a'.repeat(161) })))
      .rejects.toThrow(/160 caractères/)

    await expect(creerArticle(brouillon({ chapo: 'a'.repeat(301) })))
      .rejects.toThrow(/300 caractères/)

    await expect(creerArticle(brouillon({ sousTheme: 'a'.repeat(41) })))
      .rejects.toThrow(/40 caractères/)

    // Le refus est total : rien n'a été écrit, même partiellement.
    expect(await prisma.article.count()).toBe(0)
  })

  it('accepte exactement les bornes, qui ne sont pas des dépassements', async () => {
    const cree = await creerArticle(brouillon({
      titre: 'a'.repeat(160),
      chapo: 'b'.repeat(300),
      sousTheme: 'c'.repeat(40),
    }))
    expect(cree.titre).toHaveLength(160)
  })

  it('stocke le titre TEL QUEL, sans préfixe de composition (FR-008, US5 scénario 5)', async () => {
    // Les maquettes montrent « Biodiversité : le retour du lynx ». C'est de la
    // composition d'affichage — l'eyebrow au-dessus du titre —, jamais du
    // contenu. Le titre saisi doit ressortir identique.
    const saisi = 'Biodiversité : le retour du lynx'

    const cree = await creerArticle(brouillon({ titre: saisi, sousTheme: 'Biodiversité' }))
    const enBase = await prisma.article.findUnique({ where: { id: cree.id } })

    expect(enBase!.titre).toBe(saisi)
    // Ni le sous-thème ni la rubrique n'ont été collés devant.
    expect(enBase!.titre.startsWith('Biodiversité : ')).toBe(true)
    expect(enBase!.titre).not.toMatch(/^Environnement/)
    expect(enBase!.titre).not.toBe('Biodiversité : Biodiversité : le retour du lynx')
  })

  it('se modifie en conservant les mêmes garanties', async () => {
    const cree = await creerArticle(brouillon())

    const modifie = await modifierArticle(cree.id, { titre: 'Le lynx reprend ses quartiers' })
    expect(modifie.titre).toBe('Le lynx reprend ses quartiers')
    // Le slug ne suit pas le titre : une adresse publiée ne se déplace pas
    // sous les pieds de qui l'a partagée.
    expect(modifie.slug).toBe('le-retour-du-lynx')

    // Les bornes valent aussi en modification.
    await expect(modifierArticle(cree.id, { titre: 'a'.repeat(161) }))
      .rejects.toThrow(/160 caractères/)

    // Et l'assainissement aussi.
    const assaini = await modifierArticle(cree.id, { corps: '<script>voler()</script><p>Suite</p>' })
    expect(assaini.corps).toBe('<p>Suite</p>')
  })

  it('se supprime définitivement quand il est hors Une (FR-029)', async () => {
    const cree = await creerArticle(brouillon())

    await supprimerArticle(cree.id)

    // Définitive : ni corbeille, ni archivage, ni indicateur de suppression.
    expect(await prisma.article.findUnique({ where: { id: cree.id } })).toBeNull()
    expect(await prisma.article.count()).toBe(0)
  })
})
