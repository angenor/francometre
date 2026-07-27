// Compose l'icône de navigateur — même geste que `partage-defaut.mjs`.
//
// Le mot-symbole entier (3230 × 970, ratio ~3,33:1) est illisible à 16 px : une
// icône d'onglet demande un monogramme. On prend donc le PREMIER GLYPHE du
// mot-symbole sanctionné, son « F », et rien d'autre. Aucune création visuelle
// (principe I, III) : le tracé n'est pas dessiné, il est RELEVÉ sur
// `public/brand/NOIR.png`, où ce glyphe est fait de trois rectangles exacts —
// mesurés au pixel, en coordonnées de l'image d'origine :
//
//   hampe          x    0 → 117   y  14 → 493
//   barre haute    x    0 → 397   y  14 → 116
//   barre médiane  x    0 → 368   y 240 → 339
//
// Le « F » est la seule partie du mot-symbole que la coupe à 3,5° ne touche
// pas : le monogramme n'en porte donc aucune trace, et la signature garde ses
// deux seuls porteurs (principe : une troisième occurrence est un défaut).
//
// Trois actifs en sortent, tous committés — rejouer `node scripts/favicon.mjs`
// les régénère à l'identique (SC-002) :
//
//   favicon.svg           net à toute taille, et SEUL à suivre le thème du
//                         système : ses couleurs s'inversent sous
//                         `prefers-color-scheme: dark`, comme le site.
//   favicon.ico           16/32/48, pour ce qui ne lit pas le SVG.
//   apple-touch-icon.png  180 × 180, fond opaque (iOS ignore la transparence).

import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

// Les deux seules valeurs de l'icône, relevées dans `app/assets/css/tokens.css`.
const PAPIER_CLAIR = '#FFFFFF' // --paper, thème clair
const ENCRE_CLAIRE = '#0A0A0A' // --ink,   thème clair
const PAPIER_SOMBRE = '#0B0B0C' // --paper, thème sombre
const ENCRE_SOMBRE = '#F5F5F5' // --ink,   thème sombre

/** Boîte du glyphe relevé, ramenée à son propre repère (398 × 480). */
const GLYPHE = { largeur: 398, hauteur: 480 }

/**
 * Le contour du « F », d'un seul trait : barre haute, encoche, barre médiane,
 * encoche, pied de hampe. Les six abscisses et ordonnées sont celles du relevé,
 * translatées de l'origine de la boîte (0, 14).
 */
const TRACE = 'M0 0 H398 V103 H118 V226 H369 V326 H118 V480 H0 Z'

/** Côté du carré de l'icône, dans le repère du SVG. */
const COTE = 64

/**
 * Hauteur du glyphe dans ce carré : 62,5 %. En deçà le monogramme flotte, au
 * delà il touche les bords d'un favori de 16 px, où le navigateur n'accorde
 * aucune marge.
 */
const HAUTEUR_GLYPHE = 40

const echelle = HAUTEUR_GLYPHE / GLYPHE.hauteur
const largeurRendue = GLYPHE.largeur * echelle
const decalageX = (COTE - largeurRendue) / 2
const decalageY = (COTE - HAUTEUR_GLYPHE) / 2

/**
 * Compose le SVG. `thematique` fait basculer les couleurs avec le thème du
 * système ; sans lui, le fichier est figé en clair — c'est ce qu'il faut pour
 * matricer un PNG, qui ne connaît pas de requête de média.
 */
function svg({ thematique }) {
  const bascule = thematique
    ? `
    @media (prefers-color-scheme: dark) {
      .fond { fill: ${PAPIER_SOMBRE} }
      .signe { fill: ${ENCRE_SOMBRE} }
    }`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COTE} ${COTE}" role="img" aria-label="Francomètre">
  <style>
    .fond { fill: ${PAPIER_CLAIR} }
    .signe { fill: ${ENCRE_CLAIRE} }${bascule}
  </style>
  <rect class="fond" width="${COTE}" height="${COTE}"/>
  <path class="signe" transform="translate(${decalageX.toFixed(2)} ${decalageY}) scale(${echelle.toFixed(5)})" d="${TRACE}"/>
</svg>
`
}

writeFileSync('public/favicon.svg', svg({ thematique: true }))

/** Matrice figée en clair : sharp rend le SVG sans jamais évaluer la bascule. */
const matrice = Buffer.from(svg({ thematique: false }))

const png = (cote) =>
  sharp(matrice, { density: 384 }).resize(cote, cote).png().toBuffer()

await sharp(await png(180)).toFile('public/apple-touch-icon.png')

/**
 * L'ICO à la main : aucune dépendance ne le produit ici, et le format est
 * trivial dès lors qu'on y embarque des PNG — ce que tout navigateur en usage
 * sait lire. En-tête de 6 octets, puis une entrée de 16 par taille, puis les
 * images à la suite.
 */
const TAILLES = [16, 32, 48]
const images = await Promise.all(TAILLES.map(png))

const entete = Buffer.alloc(6)
entete.writeUInt16LE(0, 0) // réservé
entete.writeUInt16LE(1, 2) // type : icône
entete.writeUInt16LE(TAILLES.length, 4)

let decalage = 6 + 16 * TAILLES.length
const entrees = TAILLES.map((cote, index) => {
  const entree = Buffer.alloc(16)
  entree.writeUInt8(cote, 0) // largeur (0 vaudrait 256)
  entree.writeUInt8(cote, 1) // hauteur
  entree.writeUInt8(0, 2) // palette : aucune
  entree.writeUInt8(0, 3) // réservé
  entree.writeUInt16LE(1, 4) // plans
  entree.writeUInt16LE(32, 6) // bits par pixel
  entree.writeUInt32LE(images[index].length, 8)
  entree.writeUInt32LE(decalage, 12)
  decalage += images[index].length
  return entree
})

writeFileSync('public/favicon.ico', Buffer.concat([entete, ...entrees, ...images]))

console.log('Icônes composées : public/favicon.svg, public/favicon.ico (16/32/48), public/apple-touch-icon.png (180 × 180).')
