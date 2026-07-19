/**
 * Les huit rubriques du site — définition UNIQUE du projet.
 *
 * La colonne de navigation, le panneau de menu de petit écran et le pied de
 * page consomment cette liste ; aucun d'eux ne la redéclare. Une neuvième
 * rubrique s'ajouterait ici, et nulle part ailleurs.
 *
 * L'ordre du tableau EST l'ordre d'affichage, et il est invariable
 * (constitution, « Contraintes de conception » ; data-model.md §1).
 */

export interface Rubrique {
  /** Identifiant stable, sans diacritique ni espace. Sert aussi de clé de pictogramme. */
  readonly id: RubriqueId
  /** Libellé affiché, en français, diacritiques compris. */
  readonly libelle: string
  /** Destination de navigation, dérivée de `id`. */
  readonly chemin: string
}

export const RUBRIQUES = [
  { id: 'environnement', libelle: 'Environnement', chemin: '/rubrique/environnement' },
  { id: 'sport', libelle: 'Sport', chemin: '/rubrique/sport' },
  { id: 'education', libelle: 'Éducation', chemin: '/rubrique/education' },
  { id: 'sante', libelle: 'Santé', chemin: '/rubrique/sante' },
  { id: 'diplomatie', libelle: 'Diplomatie', chemin: '/rubrique/diplomatie' },
  { id: 'culture', libelle: 'Culture', chemin: '/rubrique/culture' },
  { id: 'technologie', libelle: 'Technologie', chemin: '/rubrique/technologie' },
  { id: 'economie', libelle: 'Économie', chemin: '/rubrique/economie' },
] as const satisfies readonly { id: string, libelle: string, chemin: string }[]

/** L'un des huit identifiants. Toute autre valeur est une erreur de construction. */
export type RubriqueId = (typeof RUBRIQUES)[number]['id']

/** Libellé d'une rubrique, ou `null` si l'identifiant est inconnu. */
export function libelleRubrique(id: string | null | undefined): string | null {
  return RUBRIQUES.find((r) => r.id === id)?.libelle ?? null
}

// L'augmentation de `RouteMeta` qui accompagnait ce fichier est restée côté
// application, dans `app/types/route-meta.d.ts` : `vue-router` n'a rien à faire
// côté serveur, et ce fichier sert désormais les deux côtés (research.md D5).
