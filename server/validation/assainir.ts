import sanitizeHtml from 'sanitize-html'

// Assainissement du corps riche — porte 11 de la constitution.
//
// L'opération est une opération d'ÉCRITURE, pas de lecture, et la formulation
// compte : « avant stockage ». Assainir à l'affichage laisserait du HTML hostile
// en base, où il attendrait le premier consommateur négligent — un flux, une
// exportation, un futur écran d'aperçu. La base ne contient donc que du HTML
// déjà sûr (research.md D10).
//
// Le HTML reçu n'est JAMAIS tenu pour sûr, même venant d'un appel serveur.

/**
 * Liste blanche alignée sur ce que TipTap produira à la feature 004.
 *
 * `h1` est ABSENT délibérément : le titre de la page est le titre de l'article,
 * et un second `h1` dans le corps casserait la hiérarchie de titres qu'impose
 * le principe VIII.
 */
const BALISES_AUTORISEES = [
  // Structure
  'p', 'br', 'blockquote', 'ul', 'ol', 'li',
  // Titres
  'h2', 'h3',
  // Enrichissement
  'strong', 'em', 'a',
  // Média
  'figure', 'figcaption', 'img',
]

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: BALISES_AUTORISEES,
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Une balise interdite disparaît AVEC son contenu quand ce contenu n'est pas
  // du texte de lecture : garder le corps d'un `<script>` reviendrait à écrire
  // le code hostile en clair dans la page.
  nonTextTags: ['script', 'style', 'textarea', 'noscript'],
  // Tout attribut d'événement (`onclick`…) et tout `style` tombent : ils ne
  // figurent dans aucune liste ci-dessus, et `sanitize-html` retire par défaut
  // ce qui n'est pas explicitement permis.
  disallowedTagsMode: 'discard',
}

/**
 * Rend le HTML débarrassé de tout ce qui n'est pas sur la liste blanche.
 *
 * Cette fonction ne refuse rien : elle filtre. Un corps entièrement hostile
 * ressort vide, ce qui est un contenu vide et non une erreur — c'est la
 * validation de longueur, en amont, qui produit les refus.
 */
export function assainir(html: string): string {
  return sanitizeHtml(html, OPTIONS)
}
