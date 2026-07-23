// La date « en toutes lettres » — format unique du site (« 14 juillet 2026 »).
//
// Fuseau ET locale FIGÉS : le rendu du serveur et celui du navigateur doivent
// être IDENTIQUES, sans quoi l'hydratation diverge sur la date. Le fuseau du
// visiteur n'entre donc jamais dans le calcul — site éditorial français, c'est
// le jour parisien qui fait foi (même raisonnement que `ArticleCard`).

const FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

/** « 14 juillet 2026 », ou chaîne vide si la date est illisible. */
export function dateLongueFr(valeur: Date | string): string {
  const instant = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(instant.getTime()) ? '' : FORMAT.format(instant)
}
