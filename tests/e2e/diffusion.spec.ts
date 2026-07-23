import { expect, test } from '@playwright/test'

/**
 * US5 — la diffusion (flux RSS et plan du site).
 *
 * `rss.xml` et `sitemap.xml` répondent (statut, type), ne listent que des
 * articles publiés, excluent le brouillon, et produisent des liens ABSOLUS
 * (origine configurée) (SC-004).
 */

// Ces routes ne dépendent pas du thème ni du viewport : un seul contrôle suffit.
test.describe.configure({ mode: 'default' })

const BROUILLON = 'negociations-commerciales-le-round-de-trop'
const ORIGINE = 'https://francometre.com'

test('le flux RSS répond, liste les publiés et exclut le brouillon', async ({ request }) => {
  const reponse = await request.get('/rss.xml')
  expect(reponse.status()).toBe(200)
  expect(reponse.headers()['content-type']).toContain('application/rss+xml')

  const corps = await reponse.text()
  expect(corps).toContain('<rss version="2.0">')
  expect(corps).toContain('<item>')
  // Liens absolus vers l'origine configurée.
  expect(corps).toContain(`${ORIGINE}/article/`)
  // Aucun brouillon.
  expect(corps).not.toContain(BROUILLON)
})

test('le plan du site répond, couvre l\'accueil, les rubriques et les articles publiés', async ({ request }) => {
  const reponse = await request.get('/sitemap.xml')
  expect(reponse.status()).toBe(200)
  expect(reponse.headers()['content-type']).toContain('application/xml')

  const corps = await reponse.text()
  expect(corps).toContain('<urlset')
  expect(corps).toContain(`<loc>${ORIGINE}/</loc>`)
  expect(corps).toContain(`<loc>${ORIGINE}/articles</loc>`)
  // Les huit rubriques figées.
  for (const id of ['environnement', 'sport', 'education', 'sante', 'diplomatie', 'culture', 'technologie', 'economie']) {
    expect(corps).toContain(`${ORIGINE}/rubrique/${id}`)
  }
  // Aucun brouillon.
  expect(corps).not.toContain(BROUILLON)
})
