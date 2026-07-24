import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US4 — la vignette d'article, LE composant unique du site.
 *
 * Toute vignette du site en découle. Ce fichier vérifie sa structure, ses trois
 * états et les deux règles qui empêchent la divergence : l'état « sans image »
 * découle de l'ABSENCE de la donnée, jamais d'un paramètre, et le survol ne
 * produit rien d'autre que le zoom et le soulignement.
 */

test.beforeEach(async ({ page }) => {
  await ouvrir(page)
})

test('la vignette suit l’ordre imposé : image, rubrique, titre, date', async ({ page }) => {
  const carte = page.getByTestId('carte-repos')
  await expect(carte).toBeVisible()

  const hauteurs = await carte.evaluate((el) => {
    const cle = (nom: string) => el.querySelector(`[data-role="${nom}"]`)
    const ordre = ['image', 'rubrique', 'titre', 'date'].map(cle)
    if (ordre.some((n) => n === null)) return null
    return ordre.map((n) => n!.getBoundingClientRect().top)
  })

  expect(hauteurs, 'un élément de la vignette manque').not.toBeNull()
  for (let i = 1; i < hauteurs!.length; i++) {
    expect(hauteurs![i]).toBeGreaterThanOrEqual(hauteurs![i - 1]!)
  }
})

test('l’image respecte le format 16:9 strict', async ({ page }) => {
  const media = page.getByTestId('carte-repos').locator('[data-role="image"]')
  const boite = await media.boundingBox()
  expect(boite).not.toBeNull()
  expect(boite!.width / boite!.height).toBeCloseTo(16 / 9, 1)
})

test('la vignette entière est cliquable, sans bouton ni « lire la suite »', async ({ page }) => {
  const carte = page.getByTestId('carte-repos')

  // La vignette EST le lien.
  await expect(carte).toHaveRole('link')
  await expect(carte).toHaveAttribute('href', /\S/)

  await expect(carte.getByRole('button')).toHaveCount(0)
  await expect(carte).not.toHaveText(/lire la suite/i)
})

test('le titre est tronqué à trois lignes, sans faire grandir la vignette', async ({ page }) => {
  const titre = page.getByTestId('carte-titre-long').locator('[data-role="titre"]')

  const mesures = await titre.evaluate((el) => {
    const s = getComputedStyle(el)
    return {
      visible: el.clientHeight,
      reel: el.scrollHeight,
      interligne: Number.parseFloat(s.lineHeight),
      taille: Number.parseFloat(s.fontSize),
    }
  })

  const interligne = Number.isNaN(mesures.interligne) ? mesures.taille * 1.25 : mesures.interligne
  const plafond = Math.ceil(interligne * 3) + 2

  // L'invariant, vrai à TOUTE largeur : jamais plus de trois lignes affichées.
  expect(mesures.visible, 'le titre dépasse trois lignes').toBeLessThanOrEqual(plafond)

  // La troncature elle-même ne s'observe que si le texte déborde vraiment. En
  // colonne unique large, le même titre tient en moins de trois lignes : il n'y
  // a alors rien à tronquer, et l'exiger ne prouverait rien.
  if (mesures.reel > plafond) {
    expect(mesures.reel, 'le texte déborde mais n’est pas tronqué').toBeGreaterThan(mesures.visible)
  }
})

test('le survol agrandit l’image et souligne le titre — et rien d’autre', async ({ page }) => {
  const carte = page.getByTestId('carte-repos')
  const image = carte.locator('[data-role="visuel"]')
  const titre = carte.locator('[data-role="titre"]')

  // La vignette est amenée à l'écran AVANT toute mesure : `hover()` fait
  // défiler la page pour viser sa cible, et un relevé pris avant ce défilement
  // se comparerait à un repère qui a bougé pour une raison étrangère au survol.
  await carte.scrollIntoViewIfNeeded()

  /** Position absolue dans le document — insensible au défilement. */
  const releve = () =>
    carte.evaluate((el) => {
      const s = getComputedStyle(el)
      return {
        ombre: s.boxShadow,
        fond: s.backgroundColor,
        boite: el.getBoundingClientRect().top + window.scrollY,
      }
    })

  const avant = await releve()
  const echelleAvant = await image.evaluate((el) => getComputedStyle(el).transform)
  expect(echelleAvant, 'l’image est déjà transformée au repos').toBe('none')

  await carte.hover()

  // L'agrandissement s'installe en 150 ms : on attend qu'il aboutisse plutôt
  // que de mesurer au milieu de la transition.
  await expect
    .poll(() => image.evaluate((el) => getComputedStyle(el).transform), {
      message: 'l’image ne s’agrandit pas au survol',
    })
    .not.toBe('none')

  await expect(titre).toHaveCSS('text-decoration-line', 'underline')

  const apres = await releve()

  // Aucune ombre, aucun déplacement, aucun changement de fond.
  expect(apres.ombre).toBe(avant.ombre)
  expect(apres.ombre).toBe('none')
  expect(apres.fond).toBe(avant.fond)
  expect(apres.boite).toBeCloseTo(avant.boite, 0)
})

test('le focus clavier produit un retour équivalent au survol', async ({ page }) => {
  const carte = page.getByTestId('carte-repos')
  const titre = carte.locator('[data-role="titre"]')

  await carte.focus()
  await page.waitForTimeout(300)

  await expect(titre).toHaveCSS('text-decoration-line', 'underline')
  await expect(carte).toBeFocused()
})

test('sans image, la zone d’image disparaît au profit d’un filet supérieur', async ({ page }) => {
  const carte = page.getByTestId('carte-sans-image')
  await expect(carte).toBeVisible()

  // Aucune zone d'image réservée.
  await expect(carte.locator('[data-role="image"]')).toHaveCount(0)

  const filet = await carte.evaluate((el) => {
    const s = getComputedStyle(el)
    return { epaisseur: Number.parseFloat(s.borderTopWidth), style: s.borderTopStyle }
  })
  expect(filet.epaisseur).toBe(2)
  expect(filet.style).toBe('solid')

  // L'ordre restant est conservé : rubrique, titre, date.
  const positions = await carte.evaluate((el) =>
    ['rubrique', 'titre', 'date'].map(
      (r) => el.querySelector(`[data-role="${r}"]`)!.getBoundingClientRect().top,
    ),
  )
  expect(positions[1]).toBeGreaterThanOrEqual(positions[0]!)
  expect(positions[2]).toBeGreaterThanOrEqual(positions[1]!)
})

test('une image qui échoue au chargement produit le rendu « sans image »', async ({ page }) => {
  await page.route('**/demo/**', (route) => route.abort())
  await ouvrir(page)

  const carte = page.getByTestId('carte-repos')
  // La vignette charge en `lazy` (US4) : on l'amène à l'écran pour que sa requête
  // parte, échoue (abort) et déclenche le repli — exactement comme pour un lecteur
  // qui l'atteint au défilement (research D10). Une vignette jamais atteinte n'est
  // jamais demandée, et son repli est sans objet.
  await carte.scrollIntoViewIfNeeded()
  await expect(carte.locator('[data-role="image"]')).toHaveCount(0)
  await expect(carte).toHaveCSS('border-top-width', '2px')
})

test('toute image de couverture porte un texte alternatif réel', async ({ page }) => {
  const images = page.locator('[data-testid^="carte-"] [data-role="image"] img')
  const total = await images.count()

  for (let i = 0; i < total; i++) {
    const alt = await images.nth(i).getAttribute('alt')
    expect(alt, `la vignette n° ${i + 1} n’a pas de texte alternatif réel`).toBeTruthy()
    expect(alt!.trim().length).toBeGreaterThan(0)
  }
})

test.describe('Mouvement réduit', () => {
  test('aucune animation ne subsiste', async ({ page }) => {
    // `emulateMedia` plutôt que l'option de contexte `reducedMotion` : seule la
    // première prend effet ici, vérifié à la sonde.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await ouvrir(page)

    const carte = page.getByTestId('carte-repos')
    const image = carte
      .locator('[data-role="image"] img, [data-role="image"] [data-role="visuel"]')
      .first()

    const duree = await image.evaluate((el) => getComputedStyle(el).transitionDuration)
    const millisecondes = Number.parseFloat(duree) * (duree.includes('ms') ? 1 : 1000)
    expect(millisecondes).toBeLessThan(1)
  })
})
