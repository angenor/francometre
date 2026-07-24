import { expect, test } from '@playwright/test'

/**
 * US1 — chaque page est trouvable et non dupliquée (contrat `contracts/seo.md`).
 *
 * Les balises `<head>` sont posées au SSR : on lit le HTML BRUT (comme
 * `diffusion.spec.ts`), plus rapide et plus déterministe qu'un rendu de
 * navigateur. Ces vérités ne dépendent ni du thème ni du viewport → un projet
 * suffit.
 */
test.describe.configure({ mode: 'default' })

const APEX = 'https://francometre.com'

/** Le `content` d'une balise `<meta name|property="…">`, ordre d'attributs libre. */
function contenuMeta(html: string, nom: string): string {
  const balise
    = html.match(new RegExp(`<meta[^>]*\\bname="${nom}"[^>]*>`, 'i'))?.[0]
      ?? html.match(new RegExp(`<meta[^>]*\\bproperty="${nom}"[^>]*>`, 'i'))?.[0]
  return balise?.match(/content="([^"]*)"/i)?.[1] ?? ''
}

/** Le `href` d'une balise `<link rel="…">`, ordre d'attributs libre. */
function hrefLien(html: string, rel: string): string {
  const balise = html.match(new RegExp(`<link[^>]*\\brel="${rel}"[^>]*>`, 'i'))?.[0]
  return balise?.match(/href="([^"]*)"/i)?.[1] ?? ''
}

function titre(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''
}

const PAGES = [
  ['l’accueil', '/'],
  ['la page rubrique', '/rubrique/environnement'],
  ['« tous les articles »', '/articles'],
  ['la page article', '/article/le-retour-du-lynx-dans-le-jura'],
] as const

for (const [intitule, chemin] of PAGES) {
  test(`${intitule} : titre marqué « Francomètre » et description non vide (SC-005)`, async ({ request }) => {
    const html = await (await request.get(chemin)).text()
    expect(titre(html)).toContain('Francomètre')
    expect(contenuMeta(html, 'description').trim().length).toBeGreaterThan(0)
  })

  test(`${intitule} : canonique absolue sur l’apex (SC-004)`, async ({ request }) => {
    const html = await (await request.get(chemin)).text()
    expect(hrefLien(html, 'canonical').startsWith(APEX)).toBe(true)
  })
}

test('la page paginée se déclare canonique d’elle-même (?page=2, D5)', async ({ request }) => {
  const html = await (await request.get('/rubrique/environnement?page=2')).text()
  expect(hrefLien(html, 'canonical')).toBe(`${APEX}/rubrique/environnement?page=2`)
})

test('le flux RSS est déclaré dans l’en-tête de chaque page (FR-005)', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const alternate = html.match(/<link[^>]*\brel="alternate"[^>]*>/i)?.[0] ?? ''
  expect(alternate).toContain('application/rss+xml')
  expect(alternate).toContain(`${APEX}/rss.xml`)
})

test('www → apex en 301 (SC-004)', async ({ request }) => {
  const reponse = await request.get('/', {
    headers: { host: 'www.francometre.com' },
    maxRedirects: 0,
  })
  expect(reponse.status()).toBe(301)
  expect(reponse.headers()['location']).toBe(`${APEX}/`)
})

test('l’apex n’est jamais redirigé', async ({ request }) => {
  const reponse = await request.get('/', { maxRedirects: 0 })
  expect(reponse.status()).toBe(200)
})

test('robots.txt déclare le plan du site et interdit /admin (§6)', async ({ request }) => {
  const reponse = await request.get('/robots.txt')
  expect(reponse.status()).toBe(200)
  expect(reponse.headers()['content-type']).toContain('text/plain')
  const corps = await reponse.text()
  expect(corps).toContain('Disallow: /admin')
  expect(corps).toContain(`Sitemap: ${APEX}/sitemap.xml`)
})

test('/connexion signale noindex (FR-006)', async ({ request }) => {
  const html = await (await request.get('/connexion')).text()
  expect(contenuMeta(html, 'robots')).toContain('noindex')
})

test('une page système (404) signale noindex (FR-006)', async ({ request }) => {
  const reponse = await request.get('/adresse-vraiment-inexistante')
  expect(reponse.status()).toBe(404)
  expect(contenuMeta(await reponse.text(), 'robots')).toContain('noindex')
})

test('/admin porte l’en-tête X-Robots-Tag: noindex (FR-006)', async ({ request }) => {
  const reponse = await request.get('/admin', { maxRedirects: 0 })
  expect(reponse.headers()['x-robots-tag']).toContain('noindex')
})
