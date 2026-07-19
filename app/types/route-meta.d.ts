import type { RubriqueId } from '#shared/utils/rubriques'

/**
 * Une page déclare la rubrique qu'elle occupe par
 * `definePageMeta({ rubrique: 'culture' })`. La mise en page la lit et la
 * transmet à la colonne, au menu de petit écran et au pied de page — la page
 * n'a rien d'autre à câbler.
 *
 * Cette augmentation est restée côté application quand la liste des rubriques
 * est passée dans `shared/utils/` : `vue-router` n'existe pas côté serveur
 * (research.md D5).
 */
declare module 'vue-router' {
  interface RouteMeta {
    rubrique?: RubriqueId
  }
}

export {}
