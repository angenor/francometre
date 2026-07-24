import { expect, test, type Page } from '@playwright/test'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US4 — Composer la Une et fixer l'ordre de l'accueil.
 *
 * Épingler, retirer, réordonner (souris ET clavier), enregistrer → l'accueil se
 * recompose ; avant enregistrement, l'accueil ne bouge pas (FR-027).
 *
 * La Une est un état GLOBAL : les tests qui la mutent tournent en SÉRIE et sur
 * un seul viewport, pour ne pas se concurrencer en exécution parallèle.
 */

/** Lit la composition serveur depuis le navigateur (cookie de session valable). */
async function composition(page: Page) {
  return page.evaluate(async () => {
    const r = await fetch('/api/admin/une')
    return r.json() as Promise<{ emplacements: { rang: number, article: { id: string, titre: string } | null }[] }>
  })
}

const surUnSeulEcran = (page: Page) => (page.viewportSize()?.width ?? 0) !== 1440

test.describe.configure({ mode: 'serial' })

test.describe('US4 — Composer la Une', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecterAdmin(page)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`affiche les cinq emplacements sans débordement (thème ${theme === 'dark' ? 'sombre' : 'clair'})`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/admin/une')

      await expect(page.getByRole('heading', { name: 'À la une', level: 1 })).toBeVisible()
      for (const rang of ['01', '02', '03', '04', '05']) {
        await expect(page.getByText(rang, { exact: true }).first()).toBeVisible()
      }

      const deborde = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth)
      expect(deborde, 'le corps déborde horizontalement').toBe(false)
    })
  }

  test('retirer libère un emplacement, épingler le comble', async ({ page }) => {
    test.skip(surUnSeulEcran(page), 'Test d’état — un seul écran, en série.')
    await ouvrir(page, '/admin/une')

    // La Une du seed est pleine (5/5).
    await expect(page.getByText('5 / 5 emplacements')).toBeVisible()

    // Retirer un emplacement → 4/5, un « Emplacement libre » apparaît.
    await page.getByRole('button', { name: 'Retirer' }).first().click()
    await expect(page.getByText('4 / 5 emplacements')).toBeVisible()
    await expect(page.getByText('Emplacement libre')).toBeVisible()

    // Épingler un publiable → de nouveau 5/5.
    await page.getByRole('button', { name: 'Épingler' }).first().click()
    await expect(page.getByText('5 / 5 emplacements')).toBeVisible()
  })

  test('réordonne au clavier, enregistre, et l’accueil se recompose', async ({ page }) => {
    test.skip(surUnSeulEcran(page), 'Test d’état — un seul écran, en série.')
    await ouvrir(page, '/admin/une')

    // On note l'article du rang 2 : on va le remonter au rang 1.
    const avant = await composition(page)
    const cible = avant.emplacements[1]!.article!
    const ancienRang1 = avant.emplacements[0]!.article!

    // Flèche Haut sur la poignée focalisée : rang 2 → rang 1.
    await page.locator(`[data-poignee="${cible.id}"]`).focus()
    await page.keyboard.press('ArrowUp')

    // AVANT enregistrement, l'état serveur (donc l'accueil) est INCHANGÉ (FR-027).
    const pendant = await composition(page)
    expect(pendant.emplacements[0]!.article!.id).toBe(ancienRang1.id)

    // Enregistrer → l'ordre serveur bascule.
    const attente = page.waitForResponse((r) => r.url().endsWith('/api/admin/une') && r.request().method() === 'PUT')
    await page.getByRole('button', { name: 'Enregistrer la Une' }).click()
    await attente

    const apres = await composition(page)
    expect(apres.emplacements[0]!.article!.id).toBe(cible.id)

    // L'accueil public montre bien la cible (recomposé). Requête UNIQUE : l'accueil
    // est en cache `swr` (006) et servirait du contenu périmé après ce
    // réordonnancement ; un paramètre distinct force un SSR frais (ignoré par la
    // page, qui ne lit aucune query).
    await ouvrir(page, `/?f=${Math.random().toString(36).slice(2)}`)
    await expect(page.getByText(cible.titre).first()).toBeVisible()

    // Remise en état pour ne pas polluer les autres exécutions.
    await ouvrir(page, '/admin/une')
    await page.locator(`[data-poignee="${cible.id}"]`).focus()
    await page.keyboard.press('ArrowDown')
    const remise = page.waitForResponse((r) => r.url().endsWith('/api/admin/une') && r.request().method() === 'PUT')
    await page.getByRole('button', { name: 'Enregistrer la Une' }).click()
    await remise
  })
})
