import { listerArticlesPublics } from '../services/articles'
import { listerRubriques } from '../services/rubriques'

// GET /sitemap.xml — plan du site (US5, contrat diffusion).
//
// L'accueil, `/articles`, les 8 rubriques, et chaque article PUBLIÉ et daté.
// Liens absolus (origine configurée), aucun brouillon (même filtre de
// visibilité que partout).

/** Échappement XML minimal des `<loc>` (slugs et identifiants sont déjà sûrs). */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** `YYYY-MM-DD` — la granularité attendue par `<lastmod>`. */
function jour(valeur: Date): string {
  return valeur.toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const origine = useRuntimeConfig(event).public.siteUrl

  const [rubriques, articles] = await Promise.all([
    listerRubriques(),
    listerArticlesPublics({}),
  ])

  const entrees: string[] = []
  const url = (chemin: string, lastmod?: string) =>
    entrees.push(
      lastmod
        ? `  <url><loc>${echapper(origine + chemin)}</loc><lastmod>${lastmod}</lastmod></url>`
        : `  <url><loc>${echapper(origine + chemin)}</loc></url>`,
    )

  url('/')
  url('/articles')
  for (const rubrique of rubriques) url(`/rubrique/${rubrique.id}`)
  for (const article of articles) {
    // `modifieLe` s'il existe, sinon la date de parution — jamais un brouillon
    // (la lecture publique les exclut déjà).
    url(`/article/${article.slug}`, jour(article.modifieLe ?? article.publieLe!))
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entrees.join('\n')}
</urlset>
`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
