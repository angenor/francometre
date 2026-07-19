#!/usr/bin/env node
// Francomètre — contrôles de sobriété.
//
// Trois contrôles, tous dérivés de la constitution :
//   1. Aucun dégradé (principe I). Les dégradés ne relèvent d'aucun espace de
//      noms de thème Tailwind : ils ne peuvent pas être supprimés comme
//      `--radius-*` ou `--shadow-*`, seulement rejetés textuellement.
//   2. Aucune valeur de couleur hors de `app/assets/css/tokens.css` (principe II).
//      Aucune exemption de fichier : le nuancier de la planche de style passe
//      grâce aux sélecteurs de portée `.theme-clair` / `.theme-sombre` et à des
//      libellés lus à l'exécution, pas grâce à une dérogation.
//   3. Aucun retour à Tailwind v3 : ni `tailwind.config.js`, ni `@nuxtjs/tailwindcss`.
//
// Trois contrôles de PORTABILITÉ s'y ajoutent depuis « Modèle et données » :
//   4. Aucune URL dans les colonnes de médias (porte 9, SC-006).
//   5. Aucun import de `node:fs` hors de l'interface Storage (porte 9).
//      C'est le plus utile des deux : le premier constate un symptôme,
//      celui-ci empêche la cause.
//   6. Schéma portable : ni `enum`, ni `Json`, ni `autoincrement`, ni `@db.`
//      (porte 10).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const RACINE = process.cwd()
const SOURCE = join(RACINE, 'app')
const FICHIER_TOKENS = join(SOURCE, 'assets', 'css', 'tokens.css')
const EXTENSIONS = ['.vue', '.ts', '.js', '.css']

/** Liste récursivement les fichiers de `app/` susceptibles de porter du style. */
function fichiers(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree)
    if (statSync(chemin).isDirectory()) return fichiers(chemin)
    return EXTENSIONS.some((ext) => chemin.endsWith(ext)) ? [chemin] : []
  })
}

/**
 * Les entités HTML numériques (`&#8239;` pour l'espace fine insécable) se lisent
 * comme des couleurs à quatre chiffres hexadécimaux. On les retire avant tout
 * contrôle : ce sont des caractères, pas des valeurs.
 */
const ENTITES = /&#x?[0-9a-fA-F]+;/g

/** Signale chaque ligne d'un fichier qui satisfait le motif. */
function releve(chemin, motif) {
  const lignes = readFileSync(chemin, 'utf8').split('\n')
  const trouvees = []
  lignes.forEach((ligne, index) => {
    motif.lastIndex = 0
    if (motif.test(ligne.replace(ENTITES, ''))) {
      trouvees.push(`${relative(RACINE, chemin)}:${index + 1}: ${ligne.trim()}`)
    }
  })
  return trouvees
}

const echecs = []

function controle(intitule, infractions, remede) {
  if (infractions.length === 0) {
    console.log(`  OK   ${intitule}`)
    return
  }
  console.log(`  ÉCHEC ${intitule}`)
  infractions.forEach((ligne) => console.log(`         ${ligne}`))
  echecs.push(`${intitule} — ${remede}`)
}

console.log('\nFrancomètre — contrôles de sobriété\n')

// ---------------------------------------------------------------- 1. Dégradés
const MOTIF_DEGRADE = /bg-(linear|radial|conic)-|(from|via|to)-\[|gradient\(/
controle(
  'Aucun dégradé sous app/',
  fichiers(SOURCE).flatMap((f) => releve(f, MOTIF_DEGRADE)),
  'principe I : aucun dégradé, nulle part.',
)

// ------------------------------------------------- 2. Valeurs de couleur en dur
const MOTIF_COULEUR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/
controle(
  'Aucune valeur de couleur hors de app/assets/css/tokens.css',
  fichiers(SOURCE)
    .filter((f) => f !== FICHIER_TOKENS)
    .flatMap((f) => releve(f, MOTIF_COULEUR)),
  'principe II : tokens.css est le seul fichier du dépôt à porter une valeur.',
)

// --------------------------------------------------------- 3. Tailwind v4 seul
const retoursV3 = []
for (const nom of ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs']) {
  if (existsSync(join(RACINE, nom))) {
    retoursV3.push(`${nom} : Tailwind v4 se configure entièrement en CSS, ce fichier n'a aucun effet.`)
  }
}
const manifeste = JSON.parse(readFileSync(join(RACINE, 'package.json'), 'utf8'))
const dependances = { ...manifeste.dependencies, ...manifeste.devDependencies }
if ('@nuxtjs/tailwindcss' in dependances) {
  retoursV3.push("package.json : @nuxtjs/tailwindcss n'est pas la voie officielle pour Tailwind v4.")
}
controle('Aucun retour à Tailwind v3', retoursV3, 'research.md D1.')

// ============================================================================
// Contrôles de portabilité — feature « Modèle et données »
//
// L'objectif du principe VI est de migrer SQLite → PostgreSQL et disque → S3
// SANS toucher au code métier. Il se tient à tout moment, pas le jour de la
// migration : d'où des contrôles, et non des conventions.
// ============================================================================

const MOTIF_URL = /https?:\/\/|(^|["'\s(=])\/\/|data:/

// ------------------------------------------------- 4. Aucune URL dans la base
//
// SC-006. Le contrôle porte sur les DONNÉES : il ouvre la base si elle existe.
// Une base absente n'est pas un échec — le dépôt se clone sans elle.
const urlsEnBase = []
const CHEMIN_BASE = join(RACINE, 'prisma', 'dev.db')

if (existsSync(CHEMIN_BASE)) {
  const { default: Database } = await import('better-sqlite3')
  const base = new Database(CHEMIN_BASE, { readonly: true })

  const tableExiste = base
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Media'`)
    .get()

  if (tableExiste) {
    for (const media of base.prepare('SELECT id, cle, altParDefaut FROM Media').all()) {
      for (const colonne of ['cle', 'altParDefaut']) {
        const valeur = media[colonne]
        if (typeof valeur === 'string' && MOTIF_URL.test(valeur)) {
          urlsEnBase.push(`Media[${media.id}].${colonne} : ${valeur}`)
        }
      }
    }
  }
  base.close()
}

controle(
  'Aucune URL dans les colonnes de médias',
  urlsEnBase,
  'porte 9 : la base ne range que des clés ; l\'adresse se calcule par Stockage.url().',
)

// ------------------------------ 5. Aucun accès disque hors interface Stockage
//
// Le plus utile des deux contrôles de la porte 9 : il empêche la cause plutôt
// que de constater le symptôme.
const STOCKAGE = join(RACINE, 'server', 'utils', 'stockage.ts')
const MOTIF_FS = /from\s+['"]node:fs['"]|from\s+['"]fs['"]|require\(['"](node:)?fs['"]\)/

/** Les sources applicatives : `app/`, `server/`, `shared/`. Ni tests, ni scripts. */
function sourcesApplicatives() {
  return ['app', 'server', 'shared'].flatMap((dossier) => fichiers(join(RACINE, dossier)))
}

controle(
  'Aucun import de node:fs hors de server/utils/stockage.ts',
  sourcesApplicatives()
    .filter((f) => f !== STOCKAGE)
    .flatMap((f) => releve(f, MOTIF_FS)),
  'porte 9 : l\'interface Stockage est la seule porte vers le disque.',
)

// -------------------------------------------------------- 6. Schéma portable
//
// Porte 10. Ce que la base ne contraint plus, le code le contraint — mais
// encore faut-il que le schéma n'ait pas réintroduit ce qui ne migre pas.
const CHEMIN_SCHEMA = join(RACINE, 'prisma', 'schema.prisma')
const nonPortable = []

if (existsSync(CHEMIN_SCHEMA)) {
  const lignes = readFileSync(CHEMIN_SCHEMA, 'utf8').split('\n')

  const INTERDITS = [
    [/^\s*enum\s+\w+\s*\{/, 'enum porté par la base'],
    // `\b` et non `\s` en fin : un champ `Json` sans attribut termine la ligne.
    [/^\s*\w+\s+Json(\?|\[\])?\s*(\/\/.*)?$|^\s*\w+\s+Json(\?|\[\])?\s+@/, 'type Json'],
    [/@default\(autoincrement\(\)\)/, 'identifiant auto-incrémenté'],
    [/@db\.\w+/, 'attribut natif @db.'],
    // Une liste SCALAIRE (`String[]`), qui n'existe pas en SQLite — et non un
    // tableau de relation (`Article[]`), qui est portable et attendu.
    [
      /^\s*\w+\s+(String|Boolean|Int|BigInt|Float|Decimal|DateTime|Bytes|Json)\[\]/,
      'liste scalaire',
    ],
  ]

  lignes.forEach((ligne, index) => {
    // Les commentaires citent ces mots pour expliquer pourquoi ils sont exclus.
    if (/^\s*(\/\/|\/\/\/)/.test(ligne)) return

    for (const [motif, intitule] of INTERDITS) {
      if (motif.test(ligne)) {
        nonPortable.push(`prisma/schema.prisma:${index + 1}: ${intitule} — ${ligne.trim()}`)
      }
    }
  })
}

controle(
  'Schéma portable SQLite → PostgreSQL',
  nonPortable,
  'porte 10 : ni enum de base, ni Json, ni liste scalaire, ni auto-increment, ni @db.',
)

// ------------------------------------------------------------------- Verdict
if (echecs.length > 0) {
  console.log(`\n${echecs.length} contrôle(s) en échec :`)
  echecs.forEach((e) => console.log(`  · ${e}`))
  console.log('')
  process.exit(1)
}
console.log('\nLes six contrôles passent.\n')
