// Compose l'image de partage par défaut (Open Graph / Twitter) — research D7.
//
// Le dossier `public/brand/` ne contient que les mots-symboles NOIR/BLANC en
// 3230 × 970 (ratio ~3,33:1), inadaptés au 1,91:1 d'un aperçu social. On COMPOSE
// donc un `partage-defaut.png` de 1200 × 630 : le mot-symbole NOIR centré sur le
// fond de surface, SANS accent. Placer le mot-symbole sanctionné sur la surface
// est un geste mécanique — aucune création visuelle (principe I, III).
//
// Reproductible : rejouer `node scripts/partage-defaut.mjs` régénère l'actif,
// qui est committé (la dépendance n'est donc pas bloquante — SC-002).

import sharp from 'sharp'

const LARGEUR = 1200
const HAUTEUR = 630
const FOND = '#F5F5F5' // --surface, thème clair (tokens.css)
const LARGEUR_MOT = 700 // le mot-symbole occupe ~58 % de la largeur

const CIBLE = 'public/brand/partage-defaut.png'

const motSymbole = await sharp('public/brand/NOIR.png')
  .resize({ width: LARGEUR_MOT })
  .png()
  .toBuffer()

await sharp({
  create: { width: LARGEUR, height: HAUTEUR, channels: 4, background: FOND },
})
  .composite([{ input: motSymbole, gravity: 'centre' }])
  .png()
  .toFile(CIBLE)

console.log(`Image de partage composée : ${CIBLE} (${LARGEUR} × ${HAUTEUR}).`)
