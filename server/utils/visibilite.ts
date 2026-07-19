// LE critère de visibilité publique — défini UNE fois, jamais recopié (FR-012).
//
// FR-012 l'impose, mais la vraie raison est ailleurs : une règle de visibilité
// recopiée est une fuite de brouillon en puissance. Trois chemins de lecture
// différents doivent produire le même résultat, et la seule garantie mécanique
// est qu'ils partagent la MÊME expression — pas trois expressions qu'on croit
// équivalentes (research.md D9).

/**
 * Un article est visible du public s'il est publié ET que sa date de parution
 * est atteinte. La visibilité n'est pas un troisième statut : c'est une
 * évaluation faite À LA LECTURE. Un article devient donc visible sans qu'aucune
 * écriture ne se produise, du seul fait que le temps passe.
 *
 * L'instant est injectable. Sans cela, vérifier qu'un article daté du futur
 * devient visible supposerait d'attendre réellement, ou de manipuler l'horloge
 * du système. Le paramètre par défaut préserve l'ergonomie du cas courant.
 *
 * La comparaison est `lte`, PAS `lt` : un article dont la date de publication
 * vaut exactement l'instant courant est visible. C'est le cas limite tranché
 * explicitement par la spécification, et il se teste.
 */
export function filtreVisible(maintenant: Date = new Date()) {
  return { statut: 'publie', publieLe: { lte: maintenant } } as const
}
