// Les entrées de navigation du back-office — définition UNIQUE.
//
// Le rail (grand écran) et la barre repliée (petit écran) consomment cette
// liste ; aucun des deux ne la redéclare. « Médias » pointe un écran hors
// périmètre (emplacement réservé), présent pour la complétude de la navigation.

export interface EntreeNavAdmin {
  /** Clé de comparaison avec la page affichée (pour `aria-current`). */
  readonly cle: 'articles' | 'une' | 'medias'
  readonly libelle: string
  readonly chemin: string
}

export const NAV_ADMIN = [
  { cle: 'articles', libelle: 'Articles', chemin: '/admin/articles' },
  { cle: 'une', libelle: 'À la une', chemin: '/admin/une' },
  { cle: 'medias', libelle: 'Médias', chemin: '/admin/medias' },
] as const satisfies readonly EntreeNavAdmin[]
