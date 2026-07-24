import { expect, test } from '@playwright/test'

/**
 * US3 (006) — aperçu de partage riche et données structurées (SC-002, SC-007).
 *
 * Balises `<head>` posées au SSR : on lit le HTML brut. Ces vérités ne dépendent
 * ni du thème ni du viewport → un projet suffit.
 *
 * Note sur « article SANS couverture » : la publication EXIGE une couverture
 * (`publierArticle` la refuse sinon), donc aucun article publié n'en est
 * dépourvu — le repli `imageAbsolue: null → image par défaut` est INATTEIGNABLE
 * en bout de chaîne et se prouve au niveau unitaire (`seo-article.test.ts`,
 * `jsonld-article.test.ts`). Ici, on vérifie l'autre versant de SC-002 : les
 * pages NON-article servent bien l'image de partage par défaut.
 */
test.describe.configure({ mode: 'default' })

const APEX = 'https://francometre.com'
const DEFAUT = `${APEX}/brand/partage-defaut.png`
const ARTICLE = '/article/le-retour-du-lynx-dans-le-jura'

function contenuMeta(html: string, nom: string): string {
  const balise
    = html.match(new RegExp(`<meta[^>]*\\bproperty="${nom}"[^>]*>`, 'i'))?.[0]
      ?? html.match(new RegExp(`<meta[^>]*\\bname="${nom}"[^>]*>`, 'i'))?.[0]
  return balise?.match(/content="([^"]*)"/i)?.[1] ?? ''
}

test('un article expose une og:image ABSOLUE (sa couverture) (SC-002)', async ({ request }) => {
  const html = await (await request.get(ARTICLE)).text()
  expect(contenuMeta(html, 'og:image').startsWith(`${APEX}/medias/`)).toBe(true)
})

test('l’article porte EXACTEMENT une og:image et og:type=article (aucun doublon)', async ({ request }) => {
  const html = await (await request.get(ARTICLE)).text()
  expect((html.match(/property="og:image"/g) ?? []).length).toBe(1)
  expect(contenuMeta(html, 'og:type')).toBe('article')
})

test('l’article expose ses métadonnées d’article (published/section/author)', async ({ request }) => {
  const html = await (await request.get(ARTICLE)).text()
  expect(contenuMeta(html, 'article:published_time')).not.toBe('')
  expect(contenuMeta(html, 'article:section')).not.toBe('')
})

test('l’article porte un unique NewsArticle JSON-LD valide (SC-007)', async ({ request }) => {
  const html = await (await request.get(ARTICLE)).text()
  const blocs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  expect(blocs.length).toBe(1)

  const donnees = JSON.parse(blocs[0]![1]!)
  expect(donnees['@type']).toBe('NewsArticle')
  expect(donnees.headline).toBeTruthy()
  expect(donnees.datePublished).toBeTruthy()
  expect(donnees.articleSection).toBeTruthy()
  expect(donnees.author?.name).toBeTruthy()
  expect(Array.isArray(donnees.image) && donnees.image.length > 0).toBe(true)
  // Titre NU : la composition « Sous-thème : Titre » ne s'invite pas au headline.
  expect(donnees.headline).not.toContain(':')
})

test('les pages non-article n’exposent AUCUN NewsArticle (SC-007)', async ({ request }) => {
  for (const chemin of ['/', '/articles', '/rubrique/environnement']) {
    const html = await (await request.get(chemin)).text()
    expect(html, `${chemin} ne doit porter aucun NewsArticle`).not.toContain('"NewsArticle"')
  }
})

test('les pages non-article servent l’image de partage par défaut (SC-002)', async ({ request }) => {
  for (const chemin of ['/', '/articles', '/rubrique/environnement']) {
    const html = await (await request.get(chemin)).text()
    expect(contenuMeta(html, 'og:image'), chemin).toBe(DEFAUT)
    expect(contenuMeta(html, 'og:type'), chemin).toBe('website')
  }
})
