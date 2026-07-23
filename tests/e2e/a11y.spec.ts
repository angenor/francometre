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

  // Pages publiques de la feature 003 — contraste AA (mesuré DANS les deux
  // thèmes, l'accent valant deux fois), textes alternatifs, aria-current
  // (porte 8, SC-008). Le contrôle du contraste par axe couvre l'accent en
  // clair (#1F35FF) comme en sombre (#8A97FF).
  for (const [intitule, chemin] of [
    ['l’accueil', '/'],
    ['la page rubrique', '/rubrique/environnement'],
    ['la page article', '/article/le-retour-du-lynx-dans-le-jura'],
  ] as const) {
    test(`${intitule} passe AA en thème ${nom}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, chemin)

      const resultat = await analyser(page)
      expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
    })
  }
}

test.describe('États et repères d’accessibilité des pages publiques', () => {
  test('toute couverture d’article porte un texte alternatif réel (FR-030)', async ({ page }) => {
    await ouvrir(page, '/article/le-retour-du-lynx-dans-le-jura')
    const image = page.locator('figure img').first()
    const alt = await image.getAttribute('alt')
    expect(alt?.trim().length ?? 0).toBeGreaterThan(0)
  })

  test('la rubrique affichée est marquée aria-current dans la colonne', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1000, 'La colonne n’est visible qu’à partir de 1000 px.')

    await ouvrir(page, '/rubrique/environnement')
    const courant = page.getByTestId('rail').getByRole('link', { name: 'Environnement' })
    await expect(courant).toHaveAttribute('aria-current', 'page')
  })

  test('le repère de focus reste visible sur la pagination', async ({ page }) => {
    await ouvrir(page, '/rubrique/environnement')
    const suivant = page.getByRole('link', { name: 'Suivant' })
    await suivant.focus()
    const contour = await suivant.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contour).not.toBe('none')
  })
})
