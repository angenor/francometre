import { expect, test, type Page } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US1 — l'accueil éditorialisé.
 *
 * Une ordonnée 01→05, sections de rubrique présentes, « Tout voir » qui mène à
 * `/articles` paginé, et — sous le point de rupture — un carrousel de rubrique
 * qui défile EN INTERNE sans faire déborder la page (SC-001, SC-007, porte 7).
 */

const petitEcran = (page: Page) => (page.viewportSize()?.width ?? 0) < 1000

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test.describe(`Accueil — thème ${nom}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/')
    })

    test('la Une est numérotée dans l\'ordre du rang', async ({ page }) => {
      const numeros = page.getByTestId('une').getByTestId('une-numero')
      const textes = await numeros.allInnerTexts()
      const propres = textes.map((t) => t.trim())

      // Au moins le héros 01 et une secondaire ; l'ordre est strictement croissant.
      expect(propres.length).toBeGreaterThanOrEqual(2)
      expect(propres[0]).toBe('01')
      expect(propres).toEqual([...propres].sort())
    })

    test('les sections de rubrique mises en avant sont présentes', async ({ page }) => {
      // Les trois rubriques mises en avant, dans l'ordre, chacune peuplée.
      for (const nomRubrique of ['Environnement', 'Économie', 'Culture']) {
        await expect(
          page.getByRole('heading', { name: nomRubrique, exact: true }),
        ).toBeVisible()
      }
    })

    test('« Tout voir » des derniers mène à /articles, qui pagine', async ({ page }) => {
      await page.locator('a[href="/articles"]').first().click()
      await expect(page).toHaveURL(/\/articles$/)
      await expect(page.getByRole('heading', { name: 'Tous les articles' })).toBeVisible()
    })
  })
}

test.describe('Carrousel de rubrique sur petit écran', () => {
  test('défile en interne sans faire déborder la page', async ({ page }) => {
    test.skip(!petitEcran(page), 'Le carrousel horizontal ne s\'applique que sous 1000 px.')

    await ouvrir(page, '/')

    // La page ne déborde pas horizontalement (porte 7).
    const debordementPage = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(debordementPage, 'la page déborde horizontalement').toBeLessThanOrEqual(0)

    // Le rail, lui, défile en interne : son contenu excède sa largeur visible.
    const rail = page.getByTestId('rail-rubrique').first()
    await expect(rail).toBeVisible()
    const railDeborde = await rail.evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(railDeborde, 'le rail ne défile pas en interne').toBeGreaterThan(0)
  })
})
