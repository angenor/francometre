// Redirection www → apex (contrat `contracts/seo.md` §5, research D2).
//
// Le SEUL rôle de `Host` ici est de DÉTECTER la variante `www.` à rediriger ;
// la CIBLE reste toujours la `siteUrl` configurée (l'apex). On ne fabrique
// aucune URL absolue à partir de `Host`, qui n'est pas fiable. Le preset
// node-server (sans edge) impose de garantir cette redirection DANS
// l'application, pour qu'elle tienne quel que soit l'hébergement.
//
// Sans effet quand `Host` n'est pas en `www.` (local, tests, apex) : le
// middleware rend la main immédiatement.

export default defineEventHandler((event) => {
  const hote = getRequestHeader(event, 'host')
  if (!hote || !hote.startsWith('www.')) return

  // `event.path` porte le chemin ET la requête ; l'origine est normalisée sans
  // barre finale pour ne pas doubler le séparateur.
  const origine = useRuntimeConfig(event).public.siteUrl.replace(/\/+$/, '')
  return sendRedirect(event, origine + event.path, 301)
})
