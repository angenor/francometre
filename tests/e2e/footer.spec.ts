import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US6 — le pied de page.
 *
 * Il ferme la colonne de DROITE, jamais la page entière : il ne passe jamais
 * sous la colonne de navigation (FR-039).
 */

test.beforeEach(async ({ page }) => {
  await ouvrir(page)
})

test('le pied de page se place dans la colonne de droite', async ({ page }) => {
  const pied = page.getByTestId('pied')
  await expect(pied).toBeVisible()

  const dansLaColonne = await pied.evaluate(
    (el) => !!el.closest('[data-testid="colonne-contenu"]'),
  )
  expect(dansLaColonne, 'le pied de page est sorti de la colonne de contenu').toBe(true)

  // Sur grand écran, son bord gauche reste à droite du filet vertical.
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    const rail = await page.getByTestId('rail').boundingBox()
    const boitePied = await pied.boundingBox()
    expect(boitePied!.x).toBeGreaterThanOrEqual(rail!.x + rail!.width - 1)
  }
})

test('il présente les huit rubriques, aux mêmes destinations que la colonne', async ({ page }) => {
  const liens = page.getByTestId('pied').getByTestId('rubriques').getByRole('link')
  await expect(liens).toHaveCount(8)

  const destinations = await liens.evaluateAll((els) =>
    els.map((el) => el.getAttribute('href')),
  )

  expect(destinations).toEqual([
    '/rubrique/environnement',
    '/rubrique/sport',
    '/rubrique/education',
    '/rubrique/sante',
    '/rubrique/diplomatie',
    '/rubrique/culture',
    '/rubrique/technologie',
    '/rubrique/economie',
  ])
})

test('il présente la marque, sa signature et les deux groupes de liens', async ({ page }) => {
  const pied = page.getByTestId('pied')

  await expect(pied.locator('[data-role="mot-symbole"]')).toBeVisible()
  await expect(pied).toContainText('L’actualité est francophone.')
  await expect(pied.getByRole('heading', { name: 'Informations' })).toBeVisible()
  await expect(pied.getByRole('heading', { name: 'Suivre' })).toBeVisible()
  await expect(pied).toContainText('Francomètre')
})

test('les groupes s’empilent sans débordement', async ({ page }) => {
  const pied = page.getByTestId('pied')

  const debordement = await pied.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(debordement).toBeLessThanOrEqual(0)
})
