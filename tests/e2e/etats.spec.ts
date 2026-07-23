import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US4 — les pages système.
 *
 * Une URL inconnue rend la 404 DANS la charpente, avec le bon statut HTTP et les
 * derniers articles (une liste n'est jamais une impasse). Le gabarit 503 partage
 * la même structure et répond en 503 (SC-004).
 */

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test(`404 : charpente, statut et derniers articles — thème ${nom}`, async ({ page }) => {
    await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)

    const reponse = await page.goto('/cette-adresse-nexiste-pas')
    // Le bon statut HTTP, pas un 200 sur une page inexistante (FR-022).
    expect(reponse?.status()).toBe(404)

    // Le chiffre en filigrane et la phrase d'état.
    await expect(page.getByText('404', { exact: true })).toBeVisible()
    await expect(page.getByText(/n'existe pas ou a été dépubliée/)).toBeVisible()

    // La charpente est conservée, et la 404 ramène vers du contenu.
    await expect(page.getByTestId('cadre')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Les derniers articles' })).toBeVisible()
    expect(await page.locator('[data-role="titre"]').count()).toBeGreaterThan(0)
  })
}

test('503 : le gabarit d\'indisponibilité répond et se réessaie', async ({ page }) => {
  await ouvrir(page, '/')

  // Le service devient indisponible : la navigation cliente vers /articles reçoit
  // un 503, que la page relaie au gabarit d'état.
  await page.route('**/api/articles**', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  )

  await page.locator('a[href="/articles"]').first().click()

  await expect(page.getByText('503', { exact: true })).toBeVisible()
  await expect(page.getByText(/temporairement indisponible/)).toBeVisible()
  // Une erreur de service se réessaie (accent tracé à `etats.html`).
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible()
  // La charpente tient même en erreur.
  await expect(page.getByTestId('cadre')).toBeVisible()
})
