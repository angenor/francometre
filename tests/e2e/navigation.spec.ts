import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US1 — la charpente et la colonne de navigation.
 *
 * La colonne n'existe qu'à partir du point de rupture du socle : sous 1000 px
 * c'est la barre supérieure qui prend le relais, couverte par
 * `responsive.spec.ts`.
 */

const LIBELLES_ATTENDUS = [
  'Environnement',
  'Sport',
  'Éducation',
  'Santé',
  'Diplomatie',
  'Culture',
  'Technologie',
  'Économie',
]

test.describe('Colonne de navigation', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1000,
    'La colonne latérale ne se rend qu’à partir de 1000 px.',
  )

  test.beforeEach(async ({ page }) => {
    await ouvrir(page)
  })

  test('le cadre est borné, centré et cerné d’un filet', async ({ page }) => {
    const cadre = page.getByTestId('cadre')
    await expect(cadre).toBeVisible()

    const cotes = await cadre.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        largeur: el.getBoundingClientRect().width,
        bordure: Number.parseFloat(s.borderTopWidth),
        gauche: el.getBoundingClientRect().left,
      }
    })

    expect(cotes.largeur).toBeLessThanOrEqual(1440)
    expect(cotes.bordure).toBeGreaterThan(0)

    // Centré : autant d'espace à gauche qu'à droite.
    const largeurFenetre = page.viewportSize()!.width
    const droite = largeurFenetre - (cotes.gauche + cotes.largeur)
    expect(Math.abs(cotes.gauche - droite)).toBeLessThanOrEqual(1)
  })

  test('la colonne fait 248 px et porte un filet vertical', async ({ page }) => {
    const rail = page.getByTestId('rail')
    await expect(rail).toBeVisible()

    const mesures = await rail.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        largeur: el.getBoundingClientRect().width,
        filet: Number.parseFloat(s.borderRightWidth),
      }
    })

    expect(mesures.largeur).toBe(248)
    expect(mesures.filet).toBeGreaterThan(0)
  })

  test('les éléments se suivent dans l’ordre imposé', async ({ page }) => {
    // Marque → recherche → rubriques → interrupteur de thème poussé en bas.
    const positions = await page.evaluate(() => {
      const cle = (nom: string) =>
        document.querySelector(`[data-testid="rail"] [data-testid="${nom}"]`)
      const ordonnes = ['marque', 'recherche', 'rubriques', 'bascule-theme'].map(cle)
      if (ordonnes.some((el) => el === null)) return null
      return ordonnes.map((el) => el!.getBoundingClientRect().top)
    })

    expect(positions).not.toBeNull()
    for (let i = 1; i < positions!.length; i++) {
      expect(positions![i]).toBeGreaterThan(positions![i - 1]!)
    }
  })

  test('les huit rubriques sont présentes, dans l’ordre invariable', async ({ page }) => {
    // Portée à la colonne : le menu de petit écran et le pied de page
    // présentent la même liste, sous le même identifiant d'essai.
    const liens = page.getByTestId('rail').getByTestId('rubriques').getByRole('link')
    await expect(liens).toHaveCount(8)
    await expect(liens).toHaveText(LIBELLES_ATTENDUS)
  })

  test('chaque rubrique mène à sa destination', async ({ page }) => {
    // Portée à la colonne : le menu de petit écran et le pied de page
    // présentent la même liste, sous le même identifiant d'essai.
    const liens = page.getByTestId('rail').getByTestId('rubriques').getByRole('link')
    const destinations = await liens.evaluateAll((els) => els.map((el) => el.getAttribute('href')))

    expect(destinations).toHaveLength(8)
    for (const href of destinations) {
      expect(href).toMatch(/^\/rubrique\//)
    }
  })

  test('la marque est un lien vers l’accueil', async ({ page }) => {
    // Portée à la colonne : la barre supérieure porte la même marque.
    const marque = page.getByTestId('rail').getByTestId('marque')
    await expect(marque).toHaveAttribute('href', '/')

    const alts = await marque
      .locator('img')
      .evaluateAll((els) => els.map((el) => el.getAttribute('alt')))

    expect(alts.length).toBeGreaterThan(0)
    for (const alt of alts) {
      expect(alt?.trim()).toBeTruthy()
    }
  })

  test('une page sans rubrique ne signale rien', async ({ page }) => {
    // `aria-current` désigne la page réellement affichée, jamais une valeur par
    // défaut (constitution VIII, défaut relevé n° 5). La planche de style
    // n'occupe aucune rubrique.
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0)
  })

  test('le point d’entrée de recherche est un contrôle réel, sans champ', async ({ page }) => {
    const recherche = page.getByTestId('recherche')
    await expect(recherche).toBeVisible()
    await expect(recherche).toHaveText(/Rechercher/)

    // Ni champ de saisie, ni panneau : ils relèvent de la feature de recherche.
    await expect(page.getByTestId('rail').locator('input')).toHaveCount(0)
  })

  test('la colonne se parcourt entièrement au clavier, focus toujours visible', async ({ page }) => {
    await page.evaluate(() => document.body.focus())

    const atteints: string[] = []
    let baliseBascule = false

    for (let i = 0; i < 14 && !baliseBascule; i++) {
      await page.keyboard.press('Tab')

      const actif = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el) return null
        const s = getComputedStyle(el)
        return {
          testid: el.dataset.testid ?? null,
          dansRail: !!el.closest('[data-testid="rail"]'),
          texte: (el.textContent ?? '').trim().slice(0, 40),
          epaisseurRepere: s.outlineWidth,
          styleRepere: s.outlineStyle,
        }
      })

      if (!actif?.dansRail) continue
      atteints.push(actif.texte)

      // Un repère de focus réel : ni absent, ni d'épaisseur nulle.
      expect(actif.styleRepere).not.toBe('none')
      expect(Number.parseFloat(actif.epaisseurRepere)).toBeGreaterThan(0)

      if (actif.testid === 'bascule-theme') baliseBascule = true
    }

    // Marque, recherche, huit rubriques, interrupteur.
    expect(baliseBascule).toBe(true)
    expect(atteints.length).toBeGreaterThanOrEqual(11)
  })
})
