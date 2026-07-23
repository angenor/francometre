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
import argon2 from 'argon2'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/client.ts'
import { RUBRIQUES } from '../shared/utils/rubriques.ts'
import { ROLE_PAR_DEFAUT } from '../shared/utils/roles.ts'

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
    legende: 'Un lynx boréal photographié dans le massif jurassien, hiver 2025. — Photo d\'illustration',
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
    legende: 'Une classe de collège lors de la rentrée de septembre. — Photo d\'illustration',
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
    legende: 'Le stade sous les projecteurs, avant le coup d\'envoi d\'une rencontre en soirée. — Photo d\'illustration',
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
    legende: 'Le laboratoire d\'analyse où sont traités les prélèvements de la cohorte. — Photo d\'illustration',
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
    legende: 'La salle quelques minutes avant l\'ouverture des portes. — Photo d\'illustration',
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
    legende: 'Une allée de baies dans un centre de données de la région parisienne. — Photo d\'illustration',
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
    // Sans couverture, donc sans légende : un brouillon PEUT être incomplet.
    legende: null,
    joursAvant: null,
    rangUne: null,
  },
] as const

/**
 * Compléments d'articles publiés — de quoi rendre DÉMONTRABLES des comportements
 * que la Une seule n'exerce pas :
 *
 *   · « à lire aussi » (US2) : plusieurs articles d'une même rubrique ;
 *   · la pagination (US3, SC-002) : plus de douze articles → deux pages ;
 *   · les trois sections de rubrique de l'accueil (Environnement, Économie,
 *     Culture) peuplées comme sur la maquette (FR-008).
 *
 * Ils réutilisent un média d'exemple (une clé de stockage partagée reste
 * valide), portent chacun un `alt` RÉEL (principe VIII) et alternent sous-thème
 * présent / absent pour illustrer l'eyebrow contextuel. Aucun n'est à la Une :
 * les cinq rangs restent ceux des articles principaux. Titres repris des
 * maquettes.
 */
const ENV_SUPPLEMENT = [
  ['la-foret-face-aux-grands-incendies', 'La forêt française face au retour des grands incendies d\'été', 'Forêts'],
  ['eoliennes-en-mer-plus-grand-parc-raccorde', 'Éoliennes en mer : le plus grand parc du pays raccordé au réseau', 'Énergie'],
  ['le-retour-discret-du-lynx-dans-les-vosges', 'Le retour discret du lynx dans les forêts des Vosges', 'Biodiversité'],
  ['nappes-phreatiques-sous-le-niveau-de-saison', 'Les nappes phréatiques repassent sous le niveau de saison', 'Eau'],
  ['canicule-precoce-seize-departements-en-vigilance', 'Canicule précoce : seize départements placés en vigilance orange', 'Climat'],
  ['le-recul-du-trait-de-cote-s-accelere', 'Le recul du trait de côte s\'accélère sur la façade atlantique', 'Littoral'],
  ['photovoltaique-la-france-franchit-vingt-gigawatts', 'Photovoltaïque : la France franchit le cap des vingt gigawatts', 'Énergie'],
  ['zero-artificialisation-les-maires-ruraux-reclament-un-report', 'Zéro artificialisation : les maires ruraux réclament un report', null],
  ['glaciers-alpins-une-fonte-record', 'Glaciers alpins : une fonte record mesurée pour la troisième année', 'Montagne'],
  ['plan-velo-les-pistes-progressent-le-budget-stagne', 'Plan vélo : les pistes cyclables progressent, le budget stagne', null],
  ['consigne-des-bouteilles-la-filiere-divisee', 'Consigne des bouteilles plastique : la filière reste divisée', 'Déchets'],
  ['loup-le-seuil-de-prelevement-releve', 'Loup : le seuil de prélèvement relevé sur fond de tensions pastorales', 'Faune'],
  ['tempete-hivernale-le-littoral-breton-meurtri', 'Tempête hivernale : le littoral breton compte ses dégâts', null],
  ['agrivoltaisme-quand-les-panneaux-abritent-les-cultures', 'Agrivoltaïsme : quand les panneaux abritent les cultures', 'Énergie'],
] as const

const ECO_SUPPLEMENT = [
  ['la-banque-de-france-releve-sa-prevision-de-croissance', 'La Banque de France relève sa prévision de croissance pour 2026', 'Conjoncture'],
  ['industrie-les-commandes-repartent-l-emploi-suit', 'Industrie : les commandes repartent, l\'emploi suit avec prudence', 'Emploi'],
  ['immobilier-les-taux-repassent-sous-les-trois-pour-cent', 'Immobilier : les taux de crédit repassent sous la barre des 3 %', null],
  ['une-licorne-francaise-perce-dans-la-sante-connectee', 'Une licorne française perce dans la santé connectée', 'Start-up'],
] as const

const CULT_SUPPLEMENT = [
  ['le-festival-d-avignon-ouvre-sous-le-signe-de-la-jeunesse', 'Le Festival d\'Avignon ouvre sous le signe de la jeunesse', 'Spectacle vivant'],
  ['le-louvre-rouvre-une-aile-apres-cinq-ans-de-travaux', 'Le Louvre rouvre une aile entière après cinq ans de travaux', 'Patrimoine'],
  ['la-scene-rap-francaise-s-exporte-a-l-international', 'La scène rap française s\'exporte enfin à l\'international', null],
] as const

/** Chaque complément : sa rubrique, un média réutilisé, ses entrées. */
const SUPPLEMENTS = [
  { rubriqueId: 'environnement', media: 'exemples/lynx-boreal.jpg', entrees: ENV_SUPPLEMENT },
  { rubriqueId: 'economie', media: 'exemples/serveurs.jpg', entrees: ECO_SUPPLEMENT },
  { rubriqueId: 'culture', media: 'exemples/salle-de-concert.jpg', entrees: CULT_SUPPLEMENT },
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
    const { media, joursAvant, legende, ...reste } = article

    const donnees = {
      ...reste,
      couvertureId: media ? mediasParCle.get(media)! : null,
      couvertureLegende: legende,
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

  // Compléments par rubrique — publiés, hors Une, datés en cascade après les
  // articles principaux pour un ordre déterministe.
  let complements = 0
  for (const { rubriqueId, media, entrees } of SUPPLEMENTS) {
    const mediaId = mediasParCle.get(media)!
    for (const [index, [slug, titre, sousTheme]] of entrees.entries()) {
      const donnees = {
        titre,
        slug,
        chapo: 'Un point sur l\'actualité de la semaine.',
        corps: `<p>${titre}. Le dossier en bref, avant une analyse plus détaillée à venir.</p>`,
        rubriqueId,
        sousTheme,
        auteur: 'Rédaction',
        couvertureId: mediaId,
        couvertureAlt: `Photographie d'illustration : ${titre.toLowerCase()}.`,
        couvertureLegende: null,
        statut: 'publie',
        publieLe: new Date(maintenant - (25 + complements + index) * 24 * 60 * 60 * 1000),
      }
      await prisma.article.upsert({
        where: { slug },
        update: donnees,
        create: donnees,
      })
    }
    complements += entrees.length
  }

  const publies = ARTICLES.filter((a) => a.joursAvant !== null).length + complements
  console.log(
    `  ${ARTICLES.length + complements} articles d'exemple en place, dont ${publies} publiés.`,
  )
}

/**
 * Le compte de rédaction — amorcé, jamais codé en dur (research D7, FR-017).
 *
 * Le mot de passe d'amorçage vient d'une VARIABLE D'ENVIRONNEMENT présente au
 * seed uniquement ; il est haché en argon2id et seule l'EMPREINTE est écrite.
 * Le clair ne quitte pas la variable, n'est ni journalisé, ni stocké.
 *
 * Sans `COMPTE_REDACTION_MOT_DE_PASSE`, on SAUTE la création en avertissant —
 * jamais de mot de passe par défaut, qui deviendrait un secret implicite.
 *
 * `upsert` sur l'identifiant NORMALISÉ (trim + minuscule) : rejouer le seed ne
 * crée pas de doublon et ne change pas l'identité (le `cuid` survit).
 */
async function semerLeCompte(): Promise<void> {
  const motDePasse = process.env.COMPTE_REDACTION_MOT_DE_PASSE
  if (!motDePasse) {
    console.warn(
      '  ⚠ COMPTE_REDACTION_MOT_DE_PASSE absente — compte de rédaction NON créé '
      + '(aucun mot de passe par défaut).',
    )
    return
  }

  const identifiant = (process.env.COMPTE_REDACTION_IDENTIFIANT ?? 'redaction@francometre.com')
    .trim()
    .toLowerCase()
  const nomAffichable = process.env.COMPTE_REDACTION_NOM ?? 'Rédaction'

  const motDePasseHache = await argon2.hash(motDePasse, { type: argon2.argon2id })

  await prisma.compte.upsert({
    where: { identifiant },
    update: { nomAffichable, motDePasseHache, role: ROLE_PAR_DEFAUT },
    create: { identifiant, nomAffichable, motDePasseHache, role: ROLE_PAR_DEFAUT },
  })

  console.log(`  Compte de rédaction en place (${identifiant}).`)
}

async function main(): Promise<void> {
  console.log('\nFrancomètre — initialisation des données\n')
  await semerLesRubriques()
  const medias = await semerLesMedias()
  await semerLesArticles(medias)
  await semerLeCompte()
  console.log('')
}

await main()
await prisma.$disconnect()
