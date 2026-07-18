import { expect, test, type Page } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US3 — le socle sur petit écran.
 *
 * Le comportement sous 1000 px n'est dessiné dans aucune maquette : il est
 * CONÇU ici, une seule fois, et toutes les pages suivantes s'y conforment
 * (constitution, principe V).
 */

const petitEcran = (page: Page) => (page.viewportSize()?.width ?? 0) < 1000

async function debordement(page: Page) {
  return page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    corps: document.body.scrollWidth - document.body.clientWidth,
  }))
}

test.describe('Aucun débordement horizontal', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`à cette largeur, en thème ${theme === 'dark' ? 'sombre' : 'clair'}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page)

      const ecart = await debordement(page)
      expect(ecart.document, 'le document déborde horizontalement').toBeLessThanOrEqual(0)
      expect(ecart.corps, 'le corps déborde horizontalement').toBeLessThanOrEqual(0)
    })
  }
})

test.describe('Bascule colonne / barre supérieure', () => {
  test('la colonne et la barre ne coexistent jamais', async ({ page }) => {
    await ouvrir(page)

    const railVisible = await page.getByTestId('rail').isVisible()
    const barreVisible = await page.getByTestId('barre').isVisible()

    expect(railVisible).toBe(!petitEcran(page))
    expect(barreVisible).toBe(petitEcran(page))
  })

  test('le point de rupture tombe exactement à 1000 px', async ({ page }) => {
    await ouvrir(page)

    await page.setViewportSize({ width: 999, height: 900 })
    await expect(page.getByTestId('rail')).toBeHidden()
    await expect(page.getByTestId('barre')).toBeVisible()

    await page.setViewportSize({ width: 1000, height: 900 })
    await expect(page.getByTestId('rail')).toBeVisible()
    await expect(page.getByTestId('barre')).toBeHidden()
  })
})

test.describe('Menu de petit écran', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1000, 'Le menu n’existe que sous 1000 px.')

  test.beforeEach(async ({ page }) => {
    await ouvrir(page)
  })

  test('la barre supérieure porte la marque, le menu et l’interrupteur — rien d’autre', async ({ page }) => {
    const barre = page.getByTestId('barre')
    await expect(barre.getByTestId('marque')).toBeVisible()
    await expect(barre.getByTestId('menu-bouton')).toBeVisible()
    await expect(barre.getByTestId('bascule-theme')).toBeVisible()
  })

  test('le bouton expose son état et l’élément qu’il commande', async ({ page }) => {
    const bouton = page.getByTestId('menu-bouton')
    await expect(bouton).toHaveAttribute('aria-expanded', 'false')
    await expect(bouton).toHaveAttribute('aria-controls', /\S/)

    await bouton.click()
    await expect(bouton).toHaveAttribute('aria-expanded', 'true')
  })

  test('le menu présente les mêmes huit rubriques, dans le même ordre', async ({ page }) => {
    await page.getByTestId('menu-bouton').click()

    const liens = page.getByTestId('menu-panneau').getByTestId('rubriques').getByRole('link')
    await expect(liens).toHaveCount(8)
    await expect(liens).toHaveText([
      'Environnement',
      'Sport',
      'Éducation',
      'Santé',
      'Diplomatie',
      'Culture',
      'Technologie',
      'Économie',
    ])
  })

  test('le focus ne sort pas du panneau ouvert', async ({ page }) => {
    await page.getByTestId('menu-bouton').click()
    await expect(page.getByTestId('menu-panneau')).toBeVisible()

    // Un tour complet et au-delà : le focus doit rester à l'intérieur.
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab')
      const dedans = await page.evaluate(
        () => !!document.activeElement?.closest('[data-testid="menu-panneau"]'),
      )
      expect(dedans, `le focus est sorti du panneau au ${i + 1}ᵉ Tab`).toBe(true)
    }
  })

  test('la touche d’échappement referme et rend le focus au bouton', async ({ page }) => {
    const bouton = page.getByTestId('menu-bouton')
    await bouton.click()
    await expect(page.getByTestId('menu-panneau')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-panneau')).toBeHidden()

    const focusRendu = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid,
    )
    expect(focusRendu).toBe('menu-bouton')
  })

  test('un contrôle de fermeture visible referme aussi le panneau', async ({ page }) => {
    await page.getByTestId('menu-bouton').click()
    const fermer = page.getByTestId('menu-fermer')
    await expect(fermer).toBeVisible()

    await fermer.click()
    await expect(page.getByTestId('menu-panneau')).toBeHidden()
  })

  test('le panneau ne subsiste pas au franchissement de 1000 px', async ({ page }) => {
    await page.getByTestId('menu-bouton').click()
    await expect(page.getByTestId('menu-panneau')).toBeVisible()

    await page.setViewportSize({ width: 1200, height: 900 })
    await expect(page.getByTestId('menu-panneau')).toBeHidden()
    await expect(page.getByTestId('rail')).toBeVisible()
  })
})

test.describe('Gouttière', () => {
  test('20 px sous le point de rupture, 24 px au-dessus', async ({ page }) => {
    await ouvrir(page)

    const attendue = petitEcran(page) ? 20 : 24
    const mesuree = await page
      .getByTestId('colonne-contenu')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft))

    expect(mesuree).toBe(attendue)
  })
})
