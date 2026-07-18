import { expect, test, type Page } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US2 — la bascule de thème comme mécanisme, pas comme dessin.
 *
 * Le module `@nuxtjs/color-mode` annonce résoudre le FOUC. C'est ce fichier qui
 * le PROUVE, pas sa documentation : un module qui annonce résoudre le flash et
 * un site qui ne clignote pas sont deux affirmations distinctes.
 */

const CLE = 'francometre-theme'

/** L'interrupteur réellement affiché — colonne au-dessus de 1000 px, barre en dessous. */
const bascule = (page: Page) => page.locator('[data-testid="bascule-theme"]:visible').first()

const themeAffiche = (page: Page) =>
  page.evaluate(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'))

test.describe('Ouverture sur le thème du système', () => {
  test.use({ colorScheme: 'dark' })

  test('sans choix enregistré, le site s’ouvre en sombre', async ({ page }) => {
    await ouvrir(page)
    expect(await themeAffiche(page)).toBe('dark')
  })

  test('la classe posée est « dark », jamais « dark-mode »', async ({ page }) => {
    await ouvrir(page)
    const classes = await page.evaluate(() => [...document.documentElement.classList])
    expect(classes).toContain('dark')
    expect(classes).not.toContain('dark-mode')
  })
})

test.describe('Ouverture sur le thème du système — clair', () => {
  test.use({ colorScheme: 'light' })

  test('sans choix enregistré, le site s’ouvre en clair', async ({ page }) => {
    await ouvrir(page)
    expect(await themeAffiche(page)).toBe('light')
  })
})

test.describe('Absence de flash au premier rendu', () => {
  test.use({ colorScheme: 'light' })

  test('le thème enregistré est posé AVANT la première peinture', async ({ page }) => {
    // Le cas qui fait clignoter : le système dit clair, le choix dit sombre.
    // Une résolution faite au montage d'un composant afficherait le clair une
    // fraction de seconde. Ce test l'interdit.
    await page.addInitScript(
      ([cle]) => {
        try {
          window.localStorage.setItem(cle!, 'dark')
        }
        catch {
          /* stockage indisponible — couvert par un autre test */
        }

        const releves: { classe: string, etat: DocumentReadyState }[] = []
        Object.defineProperty(window, '__releves', { value: releves, writable: false })

        const noter = () =>
          releves.push({
            classe: document.documentElement?.className ?? '',
            etat: document.readyState,
          })

        noter()
        // L'observation porte sur `document` et non sur `documentElement` :
        // au moment où ce script s'exécute, l'élément racine n'existe pas
        // encore. `subtree` capte donc sa création puis ses changements de
        // classe, ce qu'une observation directe manquerait entièrement.
        new MutationObserver(noter).observe(document, {
          attributes: true,
          subtree: true,
          attributeFilter: ['class'],
        })
      },
      [CLE],
    )

    await ouvrir(page)

    const releves = await page.evaluate(
      () => (window as unknown as { __releves: { classe: string, etat: string }[] }).__releves,
    )

    // Le thème sombre a bien été retenu…
    expect(await themeAffiche(page)).toBe('dark')

    // …et il l'a été pendant que le document se chargeait encore, donc par le
    // script du <head>, avant toute peinture — jamais après hydratation.
    const premierSombre = releves.find((r) => r.classe.split(/\s+/).includes('dark'))
    expect(premierSombre, 'la classe « dark » n’a jamais été posée').toBeDefined()
    expect(
      premierSombre!.etat,
      'la classe a été posée après le chargement : c’est le flash que FR-015 interdit',
    ).toBe('loading')
  })
})

test.describe('Bascule et persistance', () => {
  test.use({ colorScheme: 'light' })

  test('l’interrupteur fait passer d’un thème à l’autre', async ({ page }) => {
    await ouvrir(page)
    expect(await themeAffiche(page)).toBe('light')

    // La classe est reposée par un observateur de Vue, donc au tour suivant :
    // l'affirmation attend ce tour au lieu de le devancer.
    await bascule(page).click()
    await expect.poll(() => themeAffiche(page)).toBe('dark')

    await bascule(page).click()
    await expect.poll(() => themeAffiche(page)).toBe('light')
  })

  test('l’interrupteur est un bouton réel, actionnable au clavier', async ({ page }) => {
    await ouvrir(page)
    const bouton = bascule(page)

    await expect(bouton).toHaveRole('button')
    await expect(bouton).toHaveAttribute('aria-label', /Passer en (clair|sombre)/)

    await bouton.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => themeAffiche(page)).toBe('dark')

    // L'état courant est exposé aux technologies d'assistance.
    await expect(bouton).toHaveAttribute('aria-pressed', 'true')
    await expect(bouton).toHaveAttribute('aria-label', 'Passer en clair')
  })

  test('le choix survit à dix rechargements', async ({ page }) => {
    await ouvrir(page)
    await bascule(page).click()
    await expect.poll(() => themeAffiche(page)).toBe('dark')

    for (let i = 0; i < 10; i++) {
      await page.reload()
      expect(await themeAffiche(page), `rechargement n° ${i + 1}`).toBe('dark')
    }

    const enregistre = await page.evaluate((cle) => window.localStorage.getItem(cle), CLE)
    expect(enregistre).toBe('dark')
  })
})

test.describe('Suivi de la préférence système', () => {
  test.use({ colorScheme: 'light' })

  test('tant qu’aucun choix n’est exprimé, l’affichage suit le système', async ({ page }) => {
    await ouvrir(page)
    expect(await themeAffiche(page)).toBe('light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect
      .poll(() => themeAffiche(page), { message: 'l’affichage n’a pas suivi le système' })
      .toBe('dark')
  })

  test('dès qu’un choix est exprimé, il l’emporte sur le système', async ({ page }) => {
    await ouvrir(page)
    await bascule(page).click()
    await expect.poll(() => themeAffiche(page)).toBe('dark')

    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(300)
    expect(await themeAffiche(page), 'le choix du visiteur a cédé au système').toBe('dark')
  })
})

test.describe('Stockage indisponible', () => {
  test.use({ colorScheme: 'dark' })

  test('le site reste utilisable ; seule la persistance est perdue', async ({ page }) => {
    await page.addInitScript(() => {
      const refus = () => {
        throw new Error('stockage refusé')
      }
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: refus,
      })
    })

    await ouvrir(page)

    // L'affichage retombe sur la préférence système, sans erreur.
    expect(await themeAffiche(page)).toBe('dark')
    await expect(bascule(page)).toBeVisible()

    // Et la bascule fonctionne toujours pour la session en cours.
    await bascule(page).click()
    await expect.poll(() => themeAffiche(page)).toBe('light')
  })
})
