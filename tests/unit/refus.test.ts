import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import * as servicesArticles from '../../server/services/articles'
import * as servicesUne from '../../server/services/une'
import * as servicesMedias from '../../server/services/medias'
import * as servicesComptes from '../../server/services/comptes'
import { semerRubriques } from './harnais'

// SC-007 — 100 % des opérations d'écriture refusent une entrée invalide.
//
// Ce fichier est la SOURCE de ce « 100 % ». Le tableau ci-dessous se compare à
// la liste réelle des exports des modules de service : une onzième fonction
// d'écriture ajoutée un jour FERA ÉCHOUER ce test tant qu'elle n'y figurera pas.
// C'est ce qui empêche le pourcentage de se dégrader en silence.
//
// Deux échecs sont à éviter avec autant de soin : l'enregistrement
// silencieusement corrigé, et l'erreur technique brute.

/** Les dix fonctions d'écriture déclarées par contracts/services.md. */
const ECRITURES = [
  'creerArticle',
  'modifierArticle',
  'publierArticle',
  'depublierArticle',
  'supprimerArticle',
  'placerALaUne',
  'retirerDeLaUne',
  'enregistrerMedia',
  'supprimerMedia',
  'creerCompte',
] as const

/** Une entrée invalide par fonction, et ce que le refus doit dire. */
const CAS: Array<{
  nom: (typeof ECRITURES)[number]
  appel: () => Promise<unknown>
  attendu: RegExp
}> = [
  {
    nom: 'creerArticle',
    appel: () => servicesArticles.creerArticle({
      titre: 'a'.repeat(161),
      chapo: 'Chapô.',
      corps: '<p>Corps.</p>',
      rubriqueId: 'environnement',
    }),
    attendu: /160 caractères/,
  },
  {
    nom: 'modifierArticle',
    appel: () => servicesArticles.modifierArticle('inexistant', { titre: 'Neuf' }),
    attendu: /Aucun article/,
  },
  {
    nom: 'publierArticle',
    appel: () => servicesArticles.publierArticle('inexistant'),
    attendu: /Aucun article/,
  },
  {
    nom: 'depublierArticle',
    appel: () => servicesArticles.depublierArticle('inexistant'),
    attendu: /Aucun article/,
  },
  {
    nom: 'supprimerArticle',
    appel: () => servicesArticles.supprimerArticle('inexistant'),
    attendu: /Aucun article/,
  },
  {
    nom: 'placerALaUne',
    appel: () => servicesUne.placerALaUne('inexistant', 9),
    attendu: /entre 1 et 5/,
  },
  {
    nom: 'retirerDeLaUne',
    appel: () => servicesUne.retirerDeLaUne('inexistant'),
    attendu: /Aucun article/,
  },
  {
    nom: 'enregistrerMedia',
    appel: () => servicesMedias.enregistrerMedia({
      cle: 'https://exemple.com/image.jpg',
      largeur: 1600,
      hauteur: 900,
      poids: 240_000,
    }),
    attendu: /ne peut pas être une URL/,
  },
  {
    nom: 'supprimerMedia',
    appel: () => servicesMedias.supprimerMedia('inexistant'),
    attendu: /Aucun média/,
  },
  {
    nom: 'creerCompte',
    appel: () => servicesComptes.creerCompte({
      identifiant: 'ab',
      motDePasse: 'un-mot-de-passe-assez-long',
      nomAffichable: 'Test',
    }),
    attendu: /au moins 3 caractères/,
  },
]

/** Les mots qui trahissent une fuite de message technique jusqu'à l'appelant. */
const TECHNIQUE = /Invalid `prisma|PrismaClient|Unique constraint failed|Argument .* is missing|undefined is not/

describe('Toute écriture refuse une entrée invalide (SC-007)', () => {
  beforeEach(() => {
    semerRubriques()
  })

  it('couvre EXACTEMENT les fonctions d\'écriture exposées par les services', () => {
    // Les lectures et les types ne sont pas des écritures ; tout le reste l'est.
    const LECTURES = new Set([
      'listerArticlesPublics', 'compterArticlesPublics', 'articlePublicParSlug', 'lireUne',
      'listerRubriques', 'rubriqueParId',
      'mediaParId', 'compteParIdentifiant', 'verifierMotDePasse',
      // Helper pur, sans accès base : ni lecture ni écriture (FR-018).
      'normaliserIdentifiant',
    ])

    const exportees = [
      ...Object.keys(servicesArticles),
      ...Object.keys(servicesUne),
      ...Object.keys(servicesMedias),
      ...Object.keys(servicesComptes),
    ].filter((nom) => !LECTURES.has(nom))

    // Si cette assertion tombe, ce n'est pas le test qu'il faut assouplir :
    // c'est la nouvelle fonction d'écriture qu'il faut couvrir ci-dessus.
    expect(exportees.sort()).toEqual([...ECRITURES].sort())
    expect(CAS.map((c) => c.nom).sort()).toEqual([...ECRITURES].sort())
  })

  for (const cas of CAS) {
    it(`${cas.nom} refuse par une erreur explicite, en français`, async () => {
      let erreur: unknown

      try {
        await cas.appel()
        throw new Error(`${cas.nom} a ACCEPTÉ une entrée invalide.`)
      }
      catch (capturee) {
        erreur = capturee
      }

      expect(erreur).toBeInstanceOf(Error)
      const message = (erreur as Error).message

      // Non vide.
      expect(message.trim().length).toBeGreaterThan(0)
      // Explicite : il dit ce qui ne va pas.
      expect(message).toMatch(cas.attendu)
      // Et jamais une erreur technique brute remontée telle quelle.
      expect(message).not.toMatch(TECHNIQUE)
    })
  }

  it('ne laisse aucun enregistrement silencieusement corrigé', async () => {
    // Après les dix refus, la base ne porte que ce que le seed y a mis.
    const avantArticles = await prisma.article.count()
    const avantMedias = await prisma.media.count()
    const avantComptes = await prisma.compte.count()

    for (const cas of CAS) {
      await cas.appel().catch(() => undefined)
    }

    expect(await prisma.article.count()).toBe(avantArticles)
    expect(await prisma.media.count()).toBe(avantMedias)
    expect(await prisma.compte.count()).toBe(avantComptes)
  })
})
