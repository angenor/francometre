import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US3 — la page rubrique paginée et son état vide.
 *
 * Grille ordonnée + pagination sans doublon ni omission, eyebrow = sous-thème
 * dans la rubrique, état vide dédié, page hors bornes → 404 (SC-002, SC-006).
 * Vérifié dans les deux thèmes.
 */

/** Les titres de vignette présents (data-role imposé par `ArticleCard`). */
async function titresVignettes(page: import('@playwright/test').Page) {
  return (await page.locator('[data-role="titre"]').allInnerTexts()).map((t) => t.trim())
}

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test.describe(`Rubrique — thème ${nom}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
    })

    test('affiche l\'eyebrow SOUS-THÈME dans la rubrique', async ({ page }) => {
      await ouvrir(page, '/rubrique/environnement')
      // Dans la rubrique, le surtitre bascule sur le sous-thème : « Énergie »
      // (plusieurs articles) plutôt que « Environnement ». L'eyebrow est rendu en
      // majuscules par CSS ; on compare donc en insensible à la casse.
      const eyebrows = await page.locator('[data-role="rubrique"]').allInnerTexts()
      expect(eyebrows.map((e) => e.trim().toLowerCase())).toContain('énergie')
    })

    test('pagine sans doublon ni omission', async ({ page }) => {
      await ouvrir(page, '/rubrique/environnement')
      const page1 = await titresVignettes(page)
      expect(page1.length).toBe(12)

      await ouvrir(page, '/rubrique/environnement?page=2')
      const page2 = await titresVignettes(page)
      expect(page2.length).toBeGreaterThan(0)

      // Aucun chevauchement entre les deux pages.
      const communs = page1.filter((t) => page2.includes(t))
      expect(communs, 'des articles apparaissent sur deux pages').toEqual([])

      // Aucune omission : l'union est sans doublon.
      const union = [...page1, ...page2]
      expect(new Set(union).size).toBe(union.length)
    })

    test('montre l\'état vide sur une rubrique sans article', async ({ page }) => {
      await ouvrir(page, '/rubrique/diplomatie')
      await expect(page.getByTestId('etat-vide')).toBeVisible()
      // Ni grille, ni pagination : une charpente conservée, pas une erreur.
      await expect(page.locator('[data-role="titre"]')).toHaveCount(0)
    })
  })
}

test('une page hors bornes répond 404', async ({ page }) => {
  const reponse = await page.goto('/rubrique/environnement?page=999')
  expect(reponse?.status()).toBe(404)
})
