import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../../server/utils/db'
import { lireUne, listerArticlesPublics } from '../../server/services/articles'
import { jouerLeSeed } from './harnais'

// Variables d'amorçage FIXÉES dans le processus de test : `jouerLeSeed` les
// propage au sous-processus (il diffuse `...process.env`). Le test du compte est
// ainsi déterministe, sans dépendre d'un `.env` local (research D7).
process.env.COMPTE_REDACTION_IDENTIFIANT = 'redaction@francometre.com'
process.env.COMPTE_REDACTION_NOM = 'Rédaction'
process.env.COMPTE_REDACTION_MOT_DE_PASSE = 'mot-de-passe-de-seed-au-moins-12'

// US7 — Des données d'exemple peuplent les pages à venir.
// SC-008 : de quoi construire et REGARDER les pages publiques de la feature
// suivante sans aucune saisie manuelle.

describe('Données d\'exemple, sur base vierge', () => {
  beforeEach(() => {
    jouerLeSeed()
  })

  it('peuple au moins cinq rubriques distinctes d\'un article visible (SC-008)', async () => {
    const visibles = await listerArticlesPublics({})

    const rubriques = new Set(visibles.map((a) => a.rubriqueId))
    expect(rubriques.size).toBeGreaterThanOrEqual(5)
  })

  it('pourvoit les cinq rangs de la Une', async () => {
    const une = await lireUne()

    expect(une).toHaveLength(5)
    expect(une.map((a) => a.rangUne)).toEqual([1, 2, 3, 4, 5])
  })

  it('offre les trois variantes d\'article', async () => {
    const tous = await prisma.article.findMany()

    // Au moins un AVEC sous-thème — de quoi voir l'eyebrow contextuel.
    expect(tous.some((a) => a.sousTheme !== null && a.sousTheme !== '')).toBe(true)
    // Au moins un SANS — de quoi voir le repli sur la rubrique.
    expect(tous.some((a) => a.sousTheme === null || a.sousTheme === '')).toBe(true)
    // Au moins un brouillon — de quoi vérifier qu'il reste invisible.
    expect(tous.some((a) => a.statut === 'brouillon')).toBe(true)
  })

  it('ne laisse AUCUN couvertureAlt vide sur un article publié (SC-004a)', async () => {
    const publies = await prisma.article.findMany({ where: { statut: 'publie' } })

    expect(publies.length).toBeGreaterThan(0)
    for (const article of publies) {
      // Ni null, ni chaîne vide, ni chaîne d'espaces : un `alt` vide est un
      // défaut au sens du principe VIII, pas une valeur.
      expect(article.couvertureId).not.toBeNull()
      expect(article.couvertureAlt?.trim()).toBeTruthy()
    }
  })

  it('ne range AUCUNE URL dans les médias (SC-006)', async () => {
    const medias = await prisma.media.findMany()

    expect(medias.length).toBeGreaterThan(0)
    for (const media of medias) {
      expect(media.cle).not.toMatch(/^(https?:)?\/\/|^data:/)
    }
  })

  it('reste rejouable : ni doublon, ni identifiant changé (SC-002)', async () => {
    const avant = await prisma.article.findMany({ orderBy: { slug: 'asc' } })
    const mediasAvant = await prisma.media.count()

    jouerLeSeed()

    const apres = await prisma.article.findMany({ orderBy: { slug: 'asc' } })

    expect(apres).toHaveLength(avant.length)
    expect(await prisma.media.count()).toBe(mediasAvant)
    // Le rapprochement se fait sur `slug` : les identifiants survivent.
    expect(apres.map((a) => a.id)).toEqual(avant.map((a) => a.id))
  })

  it('garde le brouillon invisible du public', async () => {
    const visibles = await listerArticlesPublics({})
    const brouillons = await prisma.article.findMany({ where: { statut: 'brouillon' } })

    expect(brouillons.length).toBeGreaterThan(0)
    for (const brouillon of brouillons) {
      expect(visibles.map((a) => a.id)).not.toContain(brouillon.id)
    }
  })

  // FR-017 — le compte de rédaction est amorcé par le seed : empreinte argon2id,
  // rôle par défaut, AUCUN mot de passe en clair. Identifiant normalisé.
  it('crée le compte de rédaction, sans jamais stocker le mot de passe en clair', async () => {
    const compte = await prisma.compte.findUnique({
      where: { identifiant: 'redaction@francometre.com' },
    })

    expect(compte).not.toBeNull()
    expect(compte!.nomAffichable).toBe('Rédaction')
    expect(compte!.role).toBe('redaction')
    // Empreinte argon2id, et surtout PAS le mot de passe d'amorçage en clair.
    expect(compte!.motDePasseHache.startsWith('$argon2id$')).toBe(true)
    expect(compte!.motDePasseHache).not.toContain('mot-de-passe-de-seed')
  })

  it('reste rejouable sur le compte : ni doublon, ni identité changée', async () => {
    const avant = await prisma.compte.findUniqueOrThrow({
      where: { identifiant: 'redaction@francometre.com' },
    })

    jouerLeSeed()

    expect(await prisma.compte.count()).toBe(1)
    const apres = await prisma.compte.findUniqueOrThrow({
      where: { identifiant: 'redaction@francometre.com' },
    })
    expect(apres.id).toBe(avant.id)
  })
})
