import { listerArticlesPublics } from '../services/articles'
import { libelleRubrique } from '../../shared/utils/rubriques.ts'

// GET /rss.xml — flux RSS 2.0 des derniers articles publiés (US5, contrat diffusion).
//
// Liens ABSOLUS, préfixés par l'origine configurée (`siteUrl`) : aucune URL en
// dur, aucune dérivation depuis l'en-tête `Host` (non fiable, casserait la
// reproductibilité des tests). N'inclut que des articles publiés et datés.

/** Nombre d'articles servis au flux — les plus récents. */
const LIMITE = 20

/** Échappement XML des valeurs texte (& < > " '). */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const origine = useRuntimeConfig(event).public.siteUrl
  const articles = await listerArticlesPublics({ limite: LIMITE })

  const items = articles
    .map((article) => {
      const lien = `${origine}/article/${article.slug}`
      return `    <item>
      <title>${echapper(article.titre)}</title>
      <link>${echapper(lien)}</link>
      <guid isPermaLink="true">${echapper(lien)}</guid>
      <pubDate>${article.publieLe!.toUTCString()}</pubDate>
      <description>${echapper(article.chapo)}</description>
      <category>${echapper(libelleRubrique(article.rubriqueId) ?? article.rubriqueId)}</category>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Francomètre</title>
    <link>${echapper(origine)}</link>
    <description>${echapper('L\'actualité, mesurée.')}</description>
    <language>fr</language>
${items}
  </channel>
</rss>
`

  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
