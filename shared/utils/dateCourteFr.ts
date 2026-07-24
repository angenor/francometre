// La date « courte » — « 14 juil. 2026 », pour les tables denses du back-office.
//
// Pendant de `dateLongueFr`, aux mêmes garanties : fuseau ET locale FIGÉS
// (Europe/Paris, fr-FR) pour que le rendu du serveur et celui du navigateur
// soient identiques — sans quoi l'hydratation diverge sur la date. Un site
// éditorial français : c'est le jour parisien qui fait foi.

const FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

/** « 14 juil. 2026 », ou chaîne vide si la date est illisible. */
export function dateCourteFr(valeur: Date | string): string {
  const instant = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(instant.getTime()) ? '' : FORMAT.format(instant)
}
