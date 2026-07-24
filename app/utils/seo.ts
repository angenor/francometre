// Référencement — l'utilitaire canonique, partagé par toutes les pages.
//
// Auto-importé par Nuxt (`app/utils/`), donc appelable sans import explicite
// dans les composants ; module PUR, sans dépendance Nuxt, testable tel quel en
// Vitest (research.md D2, contrat `contracts/seo.md`).

/**
 * Directive `robots` des pages non publiques (connexion, pages système).
 *
 * `follow` et non `none` : la page ne doit pas être indexée, mais les liens
 * qu'elle porte restent suivables — un `noindex, follow` sur `/connexion`
 * n'empêche pas d'atteindre l'accueil (D4).
 */
export const ROBOTS_NOINDEX = 'noindex, follow'

/**
 * L'adresse canonique ABSOLUE d'un chemin, bâtie sur `siteUrl` (l'apex), jamais
 * sur l'en-tête `Host` (contrat `contracts/seo.md` §2).
 *
 * Trois normalisations, et rien de plus :
 *   · jonction sans double `/` (une `siteUrl` à barre finale ne la double pas) ;
 *   · barre finale superflue retirée (`/rubrique/x/` → `/rubrique/x`), la racine
 *     restant `/` ;
 *   · la chaîne de requête reçue est CONSERVÉE telle quelle — l'appelant décide
 *     d'y mettre `?page=N` (N>1, pagination indexable, D5) et rien d'autre : le
 *     filtrage des paramètres de suivi se fait en amont, en construisant le
 *     chemin délibérément plutôt qu'en recopiant `route.fullPath`.
 */
export function urlCanonique(siteUrl: string, path: string): string {
  const origine = siteUrl.replace(/\/+$/, '')

  const separateur = path.indexOf('?')
  const cheminBrut = separateur === -1 ? path : path.slice(0, separateur)
  const requete = separateur === -1 ? '' : path.slice(separateur + 1)

  // Un `/` initial garanti, aucune barre finale superflue ; la racine devient
  // `/`, un chemin `/rubrique/x/` devient `/rubrique/x`.
  const chemin = '/' + cheminBrut.replace(/^\/+/, '').replace(/\/+$/, '')

  return origine + chemin + (requete ? `?${requete}` : '')
}
