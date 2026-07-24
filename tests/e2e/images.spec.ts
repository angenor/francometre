import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US4 (006) — images `<NuxtImg>` dimensionnées, paresseuses hors LCP (SC-008).
 *
 * Seul le LCP (héros de l'accueil, couverture d'article) charge en `eager` ; le
 * reste (vignettes de grille) est `lazy`. Chaque `<NuxtImg>` émet un `srcset`
 * webp dimensionné, servi par IPX via la boucle locale (D10). Aucune image ne
 * provoque de défilement horizontal (porte 7).
 */

test('le héros de l’accueil charge en priorité (eager, high)', async ({ page }) => {
  await ouvrir(page, '/')
  const hero = page.getByTestId('une').locator('img[data-nuxt-img]').first()
  await expect(hero).toHaveAttribute('loading', 'eager')
  await expect(hero).toHaveAttribute('fetchpriority', 'high')
})

test('la couverture d’article charge en priorité (eager, high)', async ({ page }) => {
  await ouvrir(page, '/article/le-retour-du-lynx-dans-le-jura')
  const couverture = page.locator('figure img[data-nuxt-img]').first()
  await expect(couverture).toHaveAttribute('loading', 'eager')
  await expect(couverture).toHaveAttribute('fetchpriority', 'high')
})

test('les vignettes de grille sont différées (lazy)', async ({ page }) => {
  await ouvrir(page, '/articles')
  // Les vignettes de carte sont des `<img>` natifs (repli d'erreur fiable),
  // repérés par `data-role="visuel"` ; le héros/couverture LCP sont des NuxtImg.
  const vignettes = page.locator('main img[data-role="visuel"]')
  const total = await vignettes.count()
  expect(total).toBeGreaterThan(0)
  for (let i = 0; i < total; i += 1) {
    await expect(vignettes.nth(i)).toHaveAttribute('loading', 'lazy')
  }
})

test('les <NuxtImg> émettent un srcset webp dimensionné (FR-021)', async ({ page }) => {
  await ouvrir(page, '/')
  const srcset = await page.getByTestId('une').locator('img[data-nuxt-img]').first().getAttribute('srcset')
  // Les variantes passent par la route média (`/medias/…?w=&f=webp`), pas par IPX.
  expect(srcset).toContain('/medias/')
  expect(srcset).toContain('f=webp')
  // Au moins une variante à une largeur réelle (≥ 100 px), pas seulement 1w/2w.
  expect(srcset).toMatch(/w=\d{3,}/)
})

test('la couverture d’article sert bien une variante webp de la route média', async ({ page }) => {
  await ouvrir(page, '/article/le-retour-du-lynx-dans-le-jura')
  const srcset = await page.locator('figure img[data-nuxt-img]').first().getAttribute('srcset')
  expect(srcset).toContain('/medias/')
  expect(srcset).toContain('f=webp')
})

test('aucun débordement horizontal (porte 7, saillant à 375 px)', async ({ page }) => {
  for (const chemin of ['/', '/articles', '/article/le-retour-du-lynx-dans-le-jura']) {
    await ouvrir(page, chemin)
    const debord = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(debord, `${chemin} déborde horizontalement`).toBeLessThanOrEqual(1)
  }
})
