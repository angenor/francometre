import { expect, test, type Page } from '@playwright/test'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US2 (006) — parcours au CLAVIER SEUL (FR-012, SC-003, research D12).
 *
 * On range la souris : chaque écran doit se parcourir à la tabulation, dans un
 * ordre logique, avec un repère de focus visible à chaque pas. Deux points durs
 * de l'administration sont couverts explicitement — l'éditeur TipTap et le
 * réordonnancement de la Une (déjà implémentés en 005, ici mis sous test).
 *
 * Le repère de focus est posé globalement par `main.css` sur `*:focus-visible` ;
 * la tabulation déclenche `:focus-visible`, donc on l'observe directement.
 */

/** L'élément actif : sa balise, et l'épaisseur/style de son repère de focus. */
async function focusActif(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return null
    return {
      tag: el.tagName,
      href: el.getAttribute('href'),
      contour: getComputedStyle(el).outlineStyle,
    }
  })
}

const INTERACTIFS = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY']

/**
 * Tabule `pas` fois depuis le haut de la page et vérifie, à CHAQUE pas, que le
 * focus tombe sur un élément interactif RÉEL, doté d'un repère visible.
 */
async function parcourir(page: Page, pas: number) {
  for (let i = 0; i < pas; i += 1) {
    await page.keyboard.press('Tab')
    const actif = await focusActif(page)
    expect(actif, `pas ${i + 1} : le focus est perdu`).not.toBeNull()
    expect(INTERACTIFS, `pas ${i + 1} : ${actif?.tag} n'est pas interactif`).toContain(actif!.tag)
    expect(actif!.contour, `pas ${i + 1} : repère de focus absent`).not.toBe('none')
  }
}

test.describe('Parcours clavier — pages publiques (SC-003)', () => {
  // `pas` = tabulations après la première ; borné au nombre d'interactifs de la
  // page pour ne pas franchir sa fin (la connexion n'a que quatre contrôles).
  for (const [intitule, chemin, pas] of [
    ['l’accueil', '/', 5],
    ['la page article', '/article/le-retour-du-lynx-dans-le-jura', 5],
    ['la page rubrique', '/rubrique/environnement', 5],
    ['la connexion', '/connexion', 3],
  ] as const) {
    test(`${intitule} se parcourt au clavier, focus visible`, async ({ page }) => {
      await ouvrir(page, chemin)
      await page.locator('body').press('Tab') // amorce depuis le tout début
      const premier = await focusActif(page)
      expect(premier, 'aucun élément focalisable').not.toBeNull()
      expect(premier!.contour).not.toBe('none')
      // Puis une poignée de pas supplémentaires, tous sur des interactifs repérés.
      await parcourir(page, pas)
    })
  }
})

test('le back-office se parcourt au clavier, focus visible', async ({ page }) => {
  await seConnecterAdmin(page)
  await ouvrir(page, '/admin/articles')
  await page.locator('body').press('Tab')
  const premier = await focusActif(page)
  expect(premier).not.toBeNull()
  expect(premier!.contour).not.toBe('none')
  await parcourir(page, 5)
})

test('l’éditeur TipTap : barre d’outils atteignable et un format basculable au clavier (D12)', async ({ page }) => {
  await seConnecterAdmin(page)
  await ouvrir(page, '/admin/articles/nouveau')

  // La zone d'édition reçoit le focus et du texte, sélectionné entièrement.
  const zone = page.getByRole('textbox', { name: 'Corps de l\'article' })
  await zone.click()
  await page.keyboard.type('bonjour le monde')
  await page.keyboard.press('ControlOrMeta+a')

  const gras = page.getByRole('button', { name: 'Gras' })
  // Atteignable et repérable au clavier.
  await gras.focus()
  expect(await gras.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')

  // Opérable : Entrée bascule le gras ; le bouton passe à l'état actif (accent).
  await gras.press('Enter')
  await expect(gras).toHaveClass(/text-accent/)
})

test('réordonnancement de la Une au clavier : flèches, annonce aria-live, focus rendu (D12)', async ({ page }) => {
  await seConnecterAdmin(page)
  await ouvrir(page, '/admin/une')

  const poignees = page.locator('[data-poignee]')
  const total = await poignees.count()
  expect(total, 'il faut au moins deux articles à la Une').toBeGreaterThanOrEqual(2)

  const idTete = await poignees.first().getAttribute('data-poignee')
  await poignees.first().focus()
  await page.keyboard.press('ArrowDown')

  // La région d'annonce a parlé.
  await expect(page.locator('[aria-live="polite"]')).toContainText(/déplacé au rang/)

  // Le focus est revenu sur la poignée déplacée (pour enchaîner les flèches).
  const idFocus = await page.evaluate(() => document.activeElement?.getAttribute('data-poignee'))
  expect(idFocus).toBe(idTete)

  // L'ordre a changé : l'article qui était en tête n'y est plus.
  expect(await poignees.first().getAttribute('data-poignee')).not.toBe(idTete)
})
