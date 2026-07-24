import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * SC-011 / porte 12 — refus par défaut de l'administration.
 *
 * Sans session, TOUTE route serveur d'administration répond 401 sans effet, et
 * l'ouverture d'un écran `/admin/*` redirige vers la connexion sans jamais
 * afficher de contenu d'administration. `exigerCompte` garde les données ; le
 * middleware garde l'affichage.
 */

test.describe('Refus par défaut (SC-011, porte 12)', () => {
  const ROUTES = [
    { methode: 'GET', url: '/api/admin/articles' },
    { methode: 'POST', url: '/api/admin/medias' },
    { methode: 'POST', url: '/api/admin/articles/nimporte/publier' },
    { methode: 'POST', url: '/api/admin/articles/nimporte/depublier' },
    { methode: 'PATCH', url: '/api/admin/articles/nimporte' },
    { methode: 'DELETE', url: '/api/admin/articles/nimporte' },
    { methode: 'GET', url: '/api/admin/une' },
    { methode: 'PUT', url: '/api/admin/une' },
  ] as const

  for (const { methode, url } of ROUTES) {
    test(`${methode} ${url} → 401 sans session`, async ({ request }) => {
      // Le contexte `request` ne porte aucun cookie de session.
      const reponse = await request.fetch(url, { method: methode })
      expect(reponse.status()).toBe(401)
    })
  }

  test('ouvrir /admin/articles déconnecté redirige vers /connexion, sans contenu admin', async ({ page }) => {
    await ouvrir(page, '/admin/articles')
    await expect(page).toHaveURL(/\/connexion\?retour=/)
    await expect(page.getByRole('heading', { name: 'Articles', level: 1 })).toHaveCount(0)
    await expect(page.getByTestId('table-articles')).toHaveCount(0)
  })

  test('ouvrir l’éditeur déconnecté redirige, sans contenu admin', async ({ page }) => {
    await ouvrir(page, '/admin/articles/nouveau')
    await expect(page).toHaveURL(/\/connexion\?retour=/)
    await expect(page.getByLabel('Titre de l\'article')).toHaveCount(0)
  })
})
