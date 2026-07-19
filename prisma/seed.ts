// Initialisation des données — rejouable, par construction.
//
// Ce script tourne par `npx prisma db seed`, et automatiquement après
// `prisma migrate reset`. Il s'exécute sous `node --experimental-strip-types`
// (prisma.config.ts) : les imports portent donc leur extension réelle, et rien
// ici ne dépend des alias de Nuxt.
//
// C'est le SEUL endroit du projet, hors `server/services/`, qui écrit par
// Prisma. La raison est structurelle : `server/services/rubriques.ts` n'expose
// volontairement aucune création — l'ensemble des huit est figé par l'ABSENCE
// d'API (FR-004). Le seed ne peut donc pas passer par le service ; il alimente
// la table depuis la constante, qui reste la source unique.

import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client.ts'
import { RUBRIQUES } from '../shared/utils/rubriques.ts'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
  timestampFormat: 'iso8601',
})
const prisma = new PrismaClient({ adapter })

/**
 * Les huit rubriques, tirées de `shared/utils/rubriques.ts` — jamais d'une
 * seconde liste. L'`ordre` est dérivé de la position dans le tableau : l'ordre
 * du fichier EST l'ordre d'affichage, et le recopier à la main ouvrirait
 * exactement la dérive que le fichier unique évite (FR-001 à FR-003).
 *
 * Le rapprochement se fait par `id`, en `upsert` : rejouer le seed ne crée ni
 * doublon, ni identifiant neuf (SC-002).
 */
async function semerLesRubriques(): Promise<void> {
  for (const [index, rubrique] of RUBRIQUES.entries()) {
    const donnees = { libelle: rubrique.libelle, ordre: index + 1 }
    await prisma.rubrique.upsert({
      where: { id: rubrique.id },
      update: donnees,
      create: { id: rubrique.id, ...donnees },
    })
  }
  console.log(`  ${RUBRIQUES.length} rubriques en place.`)
}

/**
 * Médias d'exemple — des CLÉS de stockage, jamais des URL (porte 9).
 *
 * Aucun fichier ne leur correspond sur le disque : cette feature ne téléverse
 * rien. Ce sont les lignes de base qui permettront aux pages publiques de la
 * feature suivante d'avoir une couverture à rendre.
 */
const MEDIAS = [
  { cle: 'exemples/lynx-boreal.jpg', altParDefaut: 'Un lynx boréal de profil, dans la neige.' },
  { cle: 'exemples/salle-de-classe.jpg', altParDefaut: 'Une salle de classe, élèves de dos.' },
  { cle: 'exemples/stade-nocturne.jpg', altParDefaut: 'Un stade éclairé, vu des tribunes.' },
  { cle: 'exemples/laboratoire.jpg', altParDefaut: 'Une paillasse de laboratoire.' },
  { cle: 'exemples/salle-de-concert.jpg', altParDefaut: 'Une salle de concert avant l\'entrée du public.' },
  { cle: 'exemples/serveurs.jpg', altParDefaut: 'Une allée de baies de serveurs.' },
] as const

/**
 * Les articles d'exemple.
 *
 * Ils couvrent délibérément les quatre points que `quickstart.md` demande de
 * vérifier à l'œil : au moins cinq rubriques distinctes, cinq rangs de Une
 * pourvus, au moins un article AVEC sous-thème, au moins un SANS, au moins un
 * brouillon. Chaque article publié porte un `couvertureAlt` RÉEL — jamais une
 * chaîne vide, qui serait un défaut au sens du principe VIII (FR-028).
 *
 * Les titres sont stockés SANS préfixe : « Biodiversité : … » relèverait de la
 * composition d'affichage, pas du contenu.
 */
const ARTICLES = [
  {
    slug: 'le-retour-du-lynx-dans-le-jura',
    titre: 'Le retour du lynx dans le Jura',
    chapo: 'Vingt ans après sa réintroduction, le félin recolonise les massifs de l\'est.',
    corps: '<p>Le lynx boréal occupe désormais la quasi-totalité du massif jurassien.</p>',
    rubriqueId: 'environnement',
    sousTheme: 'Biodiversité',
    auteur: 'Camille Renard',
    media: 'exemples/lynx-boreal.jpg',
    couvertureAlt: 'Un lynx boréal de profil, dans la neige.',
    joursAvant: 2,
    rangUne: 1,
  },
  {
    slug: 'la-rentree-decalee-a-l-epreuve-des-familles',
    titre: 'La rentrée décalée à l\'épreuve des familles',
    chapo: 'Le nouveau calendrier scolaire divise parents et enseignants.',
    corps: '<p>Trois académies expérimentent un calendrier décalé de deux semaines.</p>',
    rubriqueId: 'education',
    sousTheme: 'Calendrier scolaire',
    auteur: 'Yasmine Bouaziz',
    media: 'exemples/salle-de-classe.jpg',
    couvertureAlt: 'Une salle de classe vue du fond, élèves de dos.',
    joursAvant: 5,
    rangUne: 2,
  },
  {
    // Sans sous-thème : l'eyebrow affichera la rubrique en toute circonstance.
    slug: 'le-championnat-bascule-en-nocturne',
    titre: 'Le championnat bascule en nocturne',
    chapo: 'Les diffuseurs imposent un calendrier de soirée sur l\'ensemble de la saison.',
    corps: '<p>Douze rencontres sur quatorze se joueront après vingt heures.</p>',
    rubriqueId: 'sport',
    sousTheme: null,
    auteur: 'Thomas Lefèvre',
    media: 'exemples/stade-nocturne.jpg',
    couvertureAlt: 'Un stade éclairé la nuit, vu depuis les tribunes hautes.',
    joursAvant: 8,
    rangUne: 3,
  },
  {
    slug: 'depistage-precoce-les-resultats-d-une-decennie',
    titre: 'Dépistage précoce : les résultats d\'une décennie',
    chapo: 'Dix ans de campagne permettent enfin d\'en mesurer l\'effet réel.',
    corps: '<p>La cohorte suivie depuis 2016 livre ses premiers enseignements.</p>',
    rubriqueId: 'sante',
    sousTheme: 'Santé publique',
    auteur: 'Awa Diallo',
    media: 'exemples/laboratoire.jpg',
    couvertureAlt: 'Une paillasse de laboratoire, éprouvettes au premier plan.',
    joursAvant: 12,
    rangUne: 4,
  },
  {
    slug: 'les-salles-de-concert-rouvrent-leurs-portes',
    titre: 'Les salles de concert rouvrent leurs portes',
    chapo: 'Après deux saisons blanches, la programmation reprend son rythme.',
    corps: '<p>Quarante lieux annoncent une saison complète pour la première fois depuis 2024.</p>',
    rubriqueId: 'culture',
    sousTheme: null,
    auteur: 'Léa Marchand',
    media: 'exemples/salle-de-concert.jpg',
    couvertureAlt: 'Une salle de concert vide, sièges rouges, avant l\'entrée du public.',
    joursAvant: 15,
    rangUne: 5,
  },
  {
    // Publié, mais hors Une : de quoi peupler une page de rubrique.
    slug: 'les-centres-de-donnees-face-a-la-facture-energetique',
    titre: 'Les centres de données face à la facture énergétique',
    chapo: 'La consommation des infrastructures numériques devient un sujet public.',
    corps: '<p>Le parc national de centres de données a doublé en six ans.</p>',
    rubriqueId: 'technologie',
    sousTheme: 'Infrastructures',
    auteur: 'Nicolas Perrin',
    media: 'exemples/serveurs.jpg',
    couvertureAlt: 'Une allée de baies de serveurs, voyants allumés.',
    joursAvant: 20,
    rangUne: null,
  },
  {
    // Le brouillon : incomplet, et c'est permis. Un brouillon PEUT l'être —
    // c'est la publication qui exige la complétude.
    slug: 'negociations-commerciales-le-round-de-trop',
    titre: 'Négociations commerciales : le round de trop',
    chapo: 'Les discussions butent sur le volet agricole.',
    corps: '<p>Article en cours de rédaction.</p>',
    rubriqueId: 'diplomatie',
    sousTheme: null,
    auteur: null,
    media: null,
    couvertureAlt: null,
    joursAvant: null,
    rangUne: null,
  },
] as const

async function semerLesMedias(): Promise<Map<string, string>> {
  const parCle = new Map<string, string>()

  for (const media of MEDIAS) {
    const enregistre = await prisma.media.upsert({
      where: { cle: media.cle },
      update: { altParDefaut: media.altParDefaut },
      create: { ...media, largeur: 1600, hauteur: 900, poids: 240_000 },
    })
    parCle.set(media.cle, enregistre.id)
  }

  console.log(`  ${MEDIAS.length} médias d'exemple en place.`)
  return parCle
}

/**
 * Le rapprochement se fait sur `slug`, ce qui garde le seed REJOUABLE : le
 * rejouer ne crée pas de doublon et ne change aucun identifiant.
 */
async function semerLesArticles(mediasParCle: Map<string, string>): Promise<void> {
  const maintenant = Date.now()

  for (const article of ARTICLES) {
    const { media, joursAvant, ...reste } = article

    const donnees = {
      ...reste,
      couvertureId: media ? mediasParCle.get(media)! : null,
      statut: joursAvant === null ? 'brouillon' : 'publie',
      publieLe: joursAvant === null
        ? null
        : new Date(maintenant - joursAvant * 24 * 60 * 60 * 1000),
    }

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: donnees,
      create: donnees,
    })
  }

  const publies = ARTICLES.filter((a) => a.joursAvant !== null).length
  console.log(`  ${ARTICLES.length} articles d'exemple en place, dont ${publies} publiés.`)
}

async function main(): Promise<void> {
  console.log('\nFrancomètre — initialisation des données\n')
  await semerLesRubriques()
  const medias = await semerLesMedias()
  await semerLesArticles(medias)
  console.log('')
}

await main()
await prisma.$disconnect()
