import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US2 — la page article complète.
 *
 * Rendu complet (fil d'Ariane, couverture, corps), légende VISIBLE distincte du
 * texte alternatif, « à lire aussi » qui exclut l'article courant, et 404 sur un
 * brouillon (SC-003). Vérifié dans les deux thèmes.
 */

const ARTICLE = '/article/le-retour-du-lynx-dans-le-jura'
const TITRE = 'Le retour du lynx dans le Jura'
const BROUILLON = '/article/negociations-commerciales-le-round-de-trop'

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test.describe(`Article — thème ${nom}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, ARTICLE)
    })

    test('rend l\'en-tête, le fil d\'Ariane et la couverture', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: TITRE })).toBeVisible()
      await expect(page.getByRole('navigation', { name: /Fil d'Ariane/ })).toBeVisible()

      const image = page.locator('figure img').first()
      await expect(image).toBeVisible()
      const alt = await image.getAttribute('alt')
      expect(alt?.trim()).toBeTruthy()
    })

    test('affiche une légende visible, DISTINCTE du texte alternatif', async ({ page }) => {
      const legende = page.locator('figure figcaption').first()
      await expect(legende).toBeVisible()
      const texteLegende = (await legende.innerText()).trim()
      const alt = (await page.locator('figure img').first().getAttribute('alt'))?.trim()

      expect(texteLegende.length).toBeGreaterThan(0)
      expect(alt!.length).toBeGreaterThan(0)
      // La légende éditoriale n'est pas le texte alternatif d'accessibilité.
      expect(texteLegende).not.toBe(alt)
    })

    test('« à lire aussi » exclut l\'article courant', async ({ page }) => {
      const section = page.getByRole('heading', { name: 'À lire aussi' }).locator('..')
      await expect(page.getByRole('heading', { name: 'À lire aussi' })).toBeVisible()

      const titres = await section.getByRole('heading', { level: 3 }).allInnerTexts()
      expect(titres.length).toBeGreaterThan(0)
      for (const titre of titres) {
        expect(titre.trim()).not.toBe(TITRE)
      }
    })
  })
}

test('un slug de brouillon répond 404', async ({ page }) => {
  const reponse = await page.goto(BROUILLON)
  expect(reponse?.status()).toBe(404)
})
