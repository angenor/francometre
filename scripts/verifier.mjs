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

// ------------------------------------------------------------------- Verdict
if (echecs.length > 0) {
  console.log(`\n${echecs.length} contrôle(s) en échec :`)
  echecs.forEach((e) => console.log(`  · ${e}`))
  console.log('')
  process.exit(1)
}
console.log('\nLes trois contrôles passent.\n')
