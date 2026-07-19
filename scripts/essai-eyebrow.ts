#!/usr/bin/env node --experimental-strip-types
// Francomètre — la règle d'eyebrow, en console.
//
// La feature « Modèle et données » ne livre aucun écran : cette règle
// d'affichage se regarde donc ici (quickstart.md « La règle d'eyebrow »).
//
//   node --experimental-strip-types scripts/essai-eyebrow.ts

import { eyebrowDe } from '../shared/utils/eyebrow.ts'

const AVEC = { rubriqueId: 'environnement', sousTheme: 'Biodiversité' }
const SANS = { rubriqueId: 'environnement', sousTheme: null }

function montrer(intitule: string, article: typeof AVEC | typeof SANS) {
  console.log(`\n  ${intitule}`)
  console.log(`    dans la rubrique  → ${eyebrowDe(article, 'environnement')}`)
  console.log(`    hors contexte     → ${eyebrowDe(article, null)}`)
  console.log(`    depuis « sport »  → ${eyebrowDe(article, 'sport')}`)
}

console.log('\nFrancomètre — libellé contextuel d\'une vignette')

montrer('Article de rubrique Environnement, sous-thème « Biodiversité »', AVEC)
montrer('Article de rubrique Environnement, sans sous-thème', SANS)

console.log(
  '\n  Le sous-thème ne paraît que là où la rubrique serait redondante :\n'
  + '  le lecteur qui est déjà dans la rubrique n\'apprend rien à la relire.\n',
)
