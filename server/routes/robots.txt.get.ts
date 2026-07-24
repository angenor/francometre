// GET /robots.txt (contrat `contracts/seo.md` §6, research D3).
//
// Route DYNAMIQUE, et non fichier statique `public/robots.txt` : seule une route
// peut injecter la `siteUrl` d'EXÉCUTION (surcharge `NUXT_PUBLIC_SITE_URL`
// respectée), à l'image des routes `rss.xml`/`sitemap.xml` déjà faites main.
// Elle DÉCLARE le plan du site existant, que rien ne pointait jusqu'ici.

export default defineEventHandler((event) => {
  const origine = useRuntimeConfig(event).public.siteUrl.replace(/\/+$/, '')

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    `Sitemap: ${origine}/sitemap.xml`,
    '',
  ].join('\n')
})
