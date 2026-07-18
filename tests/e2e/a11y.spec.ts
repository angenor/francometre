import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * Contrôle d'accessibilité automatisé.
 *
 * `analyze()` n'examine que l'ÉTAT COURANT de la page : le menu de petit écran
 * est donc ouvert avant d'être analysé, sans quoi son contenu échapperait
 * entièrement au contrôle.
 *
 * Limite assumée : axe-core ne détecte pas tout. Un passage sans violation
 * n'est pas une preuve d'accessibilité, seulement l'absence d'erreurs connues.
 * Le contraste sur image et la pertinence des textes alternatifs restent
 * couverts par la relecture et par `contrastes.py`.
 */

const NORMES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const analyser = (page: Page) => new AxeBuilder({ page }).withTags(NORMES).analyze()

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test(`la planche de style passe AA en thème ${nom}`, async ({ page }) => {
    await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
    await ouvrir(page)

    const resultat = await analyser(page)
    expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
  })

  test(`le menu de petit écran ouvert passe AA en thème ${nom}`, async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1000, 'Le menu n’existe que sous 1000 px.')

    await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
    await ouvrir(page)

    await page.getByTestId('menu-bouton').click()
    await expect(page.getByTestId('menu-panneau')).toBeVisible()

    const resultat = await analyser(page)
    expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
  })
}
