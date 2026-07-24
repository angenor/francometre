import { expect, test } from '@playwright/test'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US1 — Parcourir et retrouver les articles.
 *
 * La liste dense montre TOUS les articles (brouillons compris), se filtre
 * (rubrique, statut, texte) en cumulant, se pagine, et affiche un état vide
 * quand rien ne correspond — le tout dans les deux thèmes, sans débordement
 * horizontal à 375 px.
 */

test.describe('US1 — Liste des articles', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecterAdmin(page)
    await ouvrir(page, '/admin/articles')
  })

  test('affiche la table et son en-tête', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Articles', level: 1 })).toBeVisible()
    await expect(page.getByTestId('table-articles')).toBeVisible()
  })

  test('montre les brouillons, invisibles du public', async ({ page }) => {
    // Filtrer sur les brouillons : au moins un existe dans le seed (diplomatie).
    await page.getByLabel('Statut').selectOption('brouillon')
    const table = page.getByTestId('table-articles')
    await expect(table.getByText('Brouillon').first()).toBeVisible()
  })

  test('affiche le rang à la une (« 01 » sur le héros)', async ({ page }) => {
    // Le lynx (Environnement) est le rang 1 de la Une dans le seed.
    await page.getByLabel('Rubrique').selectOption('environnement')
    await expect(page.getByTestId('table-articles').getByText('01', { exact: true }).first())
      .toBeVisible()
  })

  test('cumule les filtres et repart à la page 1', async ({ page }) => {
    // On part d'une page 2 pour prouver la remise à 1.
    await ouvrir(page, '/admin/articles?page=2')
    await page.getByLabel('Rubrique').selectOption('environnement')

    await expect(page).toHaveURL(/rubriqueId=environnement/)
    await expect(page).not.toHaveURL(/page=/)

    // Puis un second filtre, cumulé.
    await page.getByLabel('Statut').selectOption('publie')
    await expect(page).toHaveURL(/rubriqueId=environnement/)
    await expect(page).toHaveURL(/statut=publie/)
  })

  test('affiche l\'état vide quand aucun article ne correspond', async ({ page }) => {
    // La diplomatie ne compte qu'un brouillon dans le seed : « publié » ⇒ vide.
    await page.getByLabel('Rubrique').selectOption('diplomatie')
    await page.getByLabel('Statut').selectOption('publie')

    await expect(page.getByTestId('etat-vide')).toBeVisible()
    await expect(page.getByText('Aucun article ne correspond.')).toBeVisible()
  })

  test('la pagination existe et mène à la page suivante', async ({ page }) => {
    const suivant = page.getByRole('link', { name: 'Suivant' })
    await expect(suivant).toBeVisible()
    await suivant.click()
    await expect(page).toHaveURL(/page=2/)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`aucun débordement horizontal en thème ${theme === 'dark' ? 'sombre' : 'clair'}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/admin/articles')

      const deborde = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth,
      )
      expect(deborde, 'le corps déborde horizontalement').toBe(false)
    })
  }
})
