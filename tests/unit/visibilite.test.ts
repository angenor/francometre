import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import {
  articlePublicParSlug,
  creerArticle,
  depublierArticle,
  listerArticlesPublics,
  publierArticle,
} from '../../server/services/articles'
import { semerRubriques } from './harnais'

// US3 — Seuls les articles réellement parus sont visibles du public.
//
// C'est LA règle dont la violation serait un incident éditorial et non un
// défaut cosmétique : un brouillon lisible par le public.

const PASSE = new Date('2026-07-01T10:00:00Z')
const FUTUR = new Date('2026-12-25T10:00:00Z')
const MAINTENANT = new Date('2026-07-19T10:00:00Z')

/**
 * Une couverture réelle : la publication l'exige (FR-014).
 *
 * La clé est distincte à chaque appel — elle est unique en base, et deux
 * articles de test ne partagent pas un fichier.
 */
let compteurCle = 0
async function couverture() {
  compteurCle += 1
  return prisma.media.create({
    data: {
      cle: `articles/2026/07/couverture-${compteurCle}.jpg`,
      largeur: 1600,
      hauteur: 900,
      poids: 240_000,
    },
  })
}

async function articlePublie(titre: string, publieLe: Date, rubriqueId = 'environnement') {
  const media = await couverture()
  const cree = await creerArticle({
    titre,
    chapo: 'Chapô de vérification.',
    corps: '<p>Corps.</p>',
    rubriqueId,
    couvertureId: media.id,
    couvertureAlt: 'Un lynx boréal dans la neige, de profil.',
  })
  return publierArticle(cree.id, publieLe)
}

describe('Visibilité publique', () => {
  beforeEach(() => {
    semerRubriques()
  })

  describe('Les trois articles, sur les trois chemins de lecture (SC-003)', () => {
    it('ne laisse paraître que l\'article publié et daté du passé', async () => {
      const media = await couverture()
      const brouillon = await creerArticle({
        titre: 'Brouillon en cours',
        chapo: 'Chapô.',
        corps: '<p>Corps.</p>',
        rubriqueId: 'environnement',
        couvertureId: media.id,
        couvertureAlt: 'Une image.',
      })
      const paru = await articlePublie('Article paru', PASSE)
      const aVenir = await articlePublie('Article à venir', FUTUR)

      // Chemin 1 — la liste toutes rubriques.
      const liste = await listerArticlesPublics({ instant: MAINTENANT })
      expect(liste.map((a) => a.id)).toEqual([paru.id])

      // Chemin 2 — le filtre par rubrique.
      const parRubrique = await listerArticlesPublics({
        rubriqueId: 'environnement',
        instant: MAINTENANT,
      })
      expect(parRubrique.map((a) => a.id)).toEqual([paru.id])

      // Chemin 3 — la demande DIRECTE par slug, qui doit retourner `null` et
      // non le contenu : c'est le chemin qu'on oublie, et le plus exposé.
      expect(await articlePublicParSlug(brouillon.slug, MAINTENANT)).toBeNull()
      expect(await articlePublicParSlug(aVenir.slug, MAINTENANT)).toBeNull()
      expect((await articlePublicParSlug(paru.slug, MAINTENANT))?.id).toBe(paru.id)
    })
  })

  it('rend visible l\'article du futur en avançant l\'instant, SANS aucune écriture', async () => {
    const aVenir = await articlePublie('Article à venir', FUTUR)

    const avant = await prisma.article.findUnique({ where: { id: aVenir.id } })
    expect(await articlePublicParSlug(aVenir.slug, MAINTENANT)).toBeNull()

    // Le temps passe — rien d'autre.
    const apresLaDate = new Date('2026-12-26T10:00:00Z')
    expect((await articlePublicParSlug(aVenir.slug, apresLaDate))?.id).toBe(aVenir.id)

    // La preuve que rien n'a été écrit : la ligne est identique au bit près.
    const apres = await prisma.article.findUnique({ where: { id: aVenir.id } })
    expect(apres).toEqual(avant)
  })

  it('rend visible un article daté EXACTEMENT de l\'instant courant (lte, pas lt)', async () => {
    const pile = await articlePublie('Pile à l\'heure', MAINTENANT)

    // Le cas limite explicitement tranché par la spécification.
    expect((await articlePublicParSlug(pile.slug, MAINTENANT))?.id).toBe(pile.id)

    // Une milliseconde plus tôt, il n'est pas encore paru.
    const uneMsAvant = new Date(MAINTENANT.getTime() - 1)
    expect(await articlePublicParSlug(pile.slug, uneMsAvant)).toBeNull()
  })

  it('n\'offre aucun paramètre permettant de désactiver le filtre (FR-013)', async () => {
    const media = await couverture()
    await creerArticle({
      titre: 'Brouillon',
      chapo: 'Chapô.',
      corps: '<p>Corps.</p>',
      rubriqueId: 'sport',
      couvertureId: media.id,
      couvertureAlt: 'Une image.',
    })

    // Quoi qu'on passe, le brouillon ne sort pas. Les options de la liste ne
    // touchent qu'au périmètre et à la pagination, jamais à la visibilité.
    expect(await listerArticlesPublics({})).toHaveLength(0)
    expect(await listerArticlesPublics({ limite: 100, decalage: 0 })).toHaveLength(0)
    expect(await listerArticlesPublics({ rubriqueId: 'sport' })).toHaveLength(0)
  })

  describe('Transitions de publication', () => {
    it('refuse de publier sans couverture (FR-014)', async () => {
      const sansCouverture = await creerArticle({
        titre: 'Sans image',
        chapo: 'Chapô.',
        corps: '<p>Corps.</p>',
        rubriqueId: 'culture',
      })

      await expect(publierArticle(sansCouverture.id))
        .rejects.toThrow(/sans image de couverture/)
    })

    it('refuse de publier avec un texte alternatif VIDE (SC-004a)', async () => {
      const media = await couverture()
      const altVide = await creerArticle({
        titre: 'Alt vide',
        chapo: 'Chapô.',
        corps: '<p>Corps.</p>',
        rubriqueId: 'culture',
        couvertureId: media.id,
        // Une chaîne d'espaces n'est pas un texte alternatif : c'est un
        // contournement du contrôle, et le principe VIII y voit un défaut.
        couvertureAlt: '   ',
      })

      await expect(publierArticle(altVide.id))
        .rejects.toThrow(/texte alternatif réel/)
    })

    it('pose l\'instant du passage quand aucune date n\'est fournie', async () => {
      const media = await couverture()
      const cree = await creerArticle({
        titre: 'Publié maintenant',
        chapo: 'Chapô.',
        corps: '<p>Corps.</p>',
        rubriqueId: 'sante',
        couvertureId: media.id,
        couvertureAlt: 'Une image réelle.',
      })

      const avant = Date.now()
      const publie = await publierArticle(cree.id)

      expect(publie.publieLe).not.toBeNull()
      expect(publie.publieLe!.getTime()).toBeGreaterThanOrEqual(avant - 1000)
    })

    it('ne redate PAS un article republié (FR-014a)', async () => {
      const paru = await articlePublie('Déjà paru', PASSE)
      expect(paru.publieLe?.toISOString()).toBe(PASSE.toISOString())

      await depublierArticle(paru.id)
      const republie = await publierArticle(paru.id)

      // La date d'origine survit au passage par le brouillon : republier ne
      // fait pas remonter un article en tête de liste.
      expect(republie.publieLe?.toISOString()).toBe(PASSE.toISOString())
    })

    it('conserve publieLe à la dépublication, et retire l\'article du public', async () => {
      const paru = await articlePublie('Retiré', PASSE)

      const brouillon = await depublierArticle(paru.id)

      expect(brouillon.statut).toBe('brouillon')
      expect(brouillon.publieLe?.toISOString()).toBe(PASSE.toISOString())
      expect(await articlePublicParSlug(paru.slug, MAINTENANT)).toBeNull()
    })
  })

  it('trie les articles publics du plus récent au plus ancien', async () => {
    const ancien = await articlePublie('Ancien', new Date('2026-01-05T10:00:00Z'))
    const recent = await articlePublie('Récent', new Date('2026-07-05T10:00:00Z'))
    const moyen = await articlePublie('Moyen', new Date('2026-04-05T10:00:00Z'))

    const liste = await listerArticlesPublics({ instant: MAINTENANT })
    expect(liste.map((a) => a.id)).toEqual([recent.id, moyen.id, ancien.id])
  })
})
