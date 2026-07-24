import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * Contrôle d'accessibilité automatisé.
 *
 * `analyze()` n'examine que l'ÉTAT COURANT de la page : le menu de petit écran
 * est donc ouvert avant d'être analysé, sans quoi son contenu échapperait
 * entièrement au contrôle.
 *
 * Limite assumée : axe-core ne détecte pas tout. Un passage sans violation
 * n'est pas une preuve d'accessibilité, seulement l'absence d'erreurs connues.
 * Le contraste sur image et la pertinence des textes alternatifs restent
 * couverts par la relecture et par `contrastes.py`.
 */

const NORMES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Deux exclusions, toutes deux légitimes sur une page système :
//   · `nuxt-error-overlay` — incrustation d'ERREUR du serveur de DÉVELOPPEMENT
//     (bouton « Hide error overlay »), absente du build de production : elle ne
//     fait pas partie de la page auditée ;
//   · `[data-role="filigrane"]` — le grand chiffre en filigrane d'`error.vue`,
//     ORNEMENT `aria-hidden` dont le sens est porté par le `h1` (WCAG 1.4.3
//     exempte le texte purement décoratif du contraste minimal).
const analyser = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(NORMES)
    .exclude('nuxt-error-overlay')
    .exclude('[data-role="filigrane"]')
    .analyze()

/**
 * Vérifie les repères de navigation d'une page charpentée.
 *
 * Toute `nav` présente doit être NOMMÉE (`aria-label`) — c'est ce qui distingue
 * plusieurs navigations. À partir du socle (1000 px), le rail porte une nav
 * permanente ; SOUS le socle, la navigation est repliée derrière le bouton de
 * menu, il n'y a donc aucune nav persistante et l'on n'en exige pas.
 */
async function verifierNavsNommees(page: Page) {
  const navs = await page.getByRole('navigation').all()
  for (const nav of navs) {
    expect(((await nav.getAttribute('aria-label')) ?? '').trim().length).toBeGreaterThan(0)
  }
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    expect(navs.length).toBeGreaterThan(0)
  }
}

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'

  test(`la planche de style passe AA en thème ${nom}`, async ({ page }) => {
    await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
    await ouvrir(page)

    const resultat = await analyser(page)
    expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
  })

  test(`le menu de petit écran ouvert passe AA en thème ${nom}`, async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1000, 'Le menu n’existe que sous 1000 px.')

    await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
    await ouvrir(page)

    await page.getByTestId('menu-bouton').click()
    await expect(page.getByTestId('menu-panneau')).toBeVisible()

    const resultat = await analyser(page)
    expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
  })

  // Pages publiques de la feature 003 — contraste AA (mesuré DANS les deux
  // thèmes, l'accent valant deux fois), textes alternatifs, aria-current
  // (porte 8, SC-008). Le contrôle du contraste par axe couvre l'accent en
  // clair (#1F35FF) comme en sombre (#8A97FF).
  for (const [intitule, chemin] of [
    ['l’accueil', '/'],
    ['la page rubrique', '/rubrique/environnement'],
    ['la page article', '/article/le-retour-du-lynx-dans-le-jura'],
  ] as const) {
    test(`${intitule} passe AA en thème ${nom}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, chemin)

      const resultat = await analyser(page)
      expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
    })
  }
}

test.describe('États et repères d’accessibilité des pages publiques', () => {
  test('toute couverture d’article porte un texte alternatif réel (FR-030)', async ({ page }) => {
    await ouvrir(page, '/article/le-retour-du-lynx-dans-le-jura')
    const image = page.locator('figure img').first()
    const alt = await image.getAttribute('alt')
    expect(alt?.trim().length ?? 0).toBeGreaterThan(0)
  })

  test('la rubrique affichée est marquée aria-current dans la colonne', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1000, 'La colonne n’est visible qu’à partir de 1000 px.')

    await ouvrir(page, '/rubrique/environnement')
    const courant = page.getByTestId('rail').getByRole('link', { name: 'Environnement' })
    await expect(courant).toHaveAttribute('aria-current', 'page')
  })

  test('le repère de focus reste visible sur la pagination', async ({ page }) => {
    await ouvrir(page, '/rubrique/environnement')
    const suivant = page.getByRole('link', { name: 'Suivant' })
    await suivant.focus()
    const contour = await suivant.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contour).not.toBe('none')
  })
})

// Back-office (005) — axe sans violation sur les trois écrans + éditeur, DANS LES
// DEUX THÈMES (porte 8, SC-008) ; focus visible ; aria-current sur la page rendue.
test.describe('Back-office — accessibilité (porte 8)', () => {
  const ECRANS = [
    ['la liste des articles', '/admin/articles'],
    ['l’éditeur', '/admin/articles/nouveau'],
    ['composer la Une', '/admin/une'],
  ] as const

  for (const theme of ['light', 'dark'] as const) {
    const nom = theme === 'dark' ? 'sombre' : 'clair'
    for (const [intitule, chemin] of ECRANS) {
      test(`${intitule} passe AA en thème ${nom}`, async ({ page }) => {
        await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
        await seConnecterAdmin(page)
        await ouvrir(page, chemin)

        const resultat = await analyser(page)
        expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
      })
    }
  }

  test('le repère de focus reste visible sur la barre d’outils de l’éditeur', async ({ page }) => {
    await seConnecterAdmin(page)
    await ouvrir(page, '/admin/articles/nouveau')
    const bouton = page.getByRole('button', { name: 'Gras' })
    await bouton.focus()
    const contour = await bouton.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contour).not.toBe('none')
  })

  test('l’entrée de rail active porte aria-current sur la page rendue', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1000, 'Le rail n’est visible qu’à partir de 1000 px.')
    await seConnecterAdmin(page)
    await ouvrir(page, '/admin/une')
    const actif = page.getByTestId('rail-admin').getByRole('link', { name: 'À la une' })
    await expect(actif).toHaveAttribute('aria-current', 'page')
  })
})

// ===========================================================================
// US2 (006) — extension de la couverture a11y.
//
// Axe sur `/articles`, `/connexion` et une page système, DANS LES DEUX THÈMES ;
// un seul `h1` et des repères nommés par page (public + admin) ; texte
// alternatif réel sur les couvertures ; neutralisation sous « mouvement réduit »
// (FR-014→017, SC-006, SC-010).
// ===========================================================================

for (const theme of ['light', 'dark'] as const) {
  const nom = theme === 'dark' ? 'sombre' : 'clair'
  for (const [intitule, chemin] of [
    ['« tous les articles »', '/articles'],
    ['la connexion', '/connexion'],
    ['une page système (404)', '/adresse-vraiment-inexistante'],
  ] as const) {
    test(`${intitule} passe AA en thème ${nom} (SC-006)`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, chemin)
      const resultat = await analyser(page)
      expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
    })
  }
}

test.describe('Structure sémantique — pages publiques (SC-010)', () => {
  // Un seul `h1` partout, y compris la connexion et les pages système.
  const AVEC_H1 = [
    ['l’accueil', '/'],
    ['« tous les articles »', '/articles'],
    ['la page rubrique', '/rubrique/environnement'],
    ['la page article', '/article/le-retour-du-lynx-dans-le-jura'],
    ['la connexion', '/connexion'],
    ['une page système (404)', '/adresse-vraiment-inexistante'],
  ] as const

  for (const [intitule, chemin] of AVEC_H1) {
    test(`${intitule} n’a qu’un seul h1`, async ({ page }) => {
      await ouvrir(page, chemin)
      await expect(page.locator('h1')).toHaveCount(1)
    })
  }

  // Repères des pages de contenu (layout par défaut) : un `main` et un
  // `contentinfo` uniques, toute `nav` nommée. La connexion (layout nu) n'a pas
  // de charpente de navigation — elle en est exclue.
  const AVEC_CHARPENTE = [
    ['l’accueil', '/'],
    ['« tous les articles »', '/articles'],
    ['la page rubrique', '/rubrique/environnement'],
    ['la page article', '/article/le-retour-du-lynx-dans-le-jura'],
  ] as const

  for (const [intitule, chemin] of AVEC_CHARPENTE) {
    test(`${intitule} : main + contentinfo uniques, nav nommées`, async ({ page }) => {
      await ouvrir(page, chemin)
      await expect(page.getByRole('main')).toHaveCount(1)
      await expect(page.getByRole('contentinfo')).toHaveCount(1)
      await verifierNavsNommees(page)
    })
  }
})

test.describe('Structure sémantique — administration (SC-010)', () => {
  const ADMIN = [
    ['la liste des articles', '/admin/articles'],
    ['l’éditeur', '/admin/articles/nouveau'],
    ['composer la Une', '/admin/une'],
  ] as const

  for (const [intitule, chemin] of ADMIN) {
    test(`${intitule} n’a qu’un seul h1`, async ({ page }) => {
      await seConnecterAdmin(page)
      await ouvrir(page, chemin)
      await expect(page.locator('h1')).toHaveCount(1)
    })

    test(`${intitule} : main unique, nav nommées`, async ({ page }) => {
      await seConnecterAdmin(page)
      await ouvrir(page, chemin)
      await expect(page.getByRole('main')).toHaveCount(1)
      await verifierNavsNommees(page)
    })
  }
})

test.describe('Couvertures — texte alternatif réel (FR-016)', () => {
  for (const [intitule, chemin] of [
    ['l’accueil', '/'],
    ['« tous les articles »', '/articles'],
  ] as const) {
    test(`${intitule} : chaque couverture porte un alt non vide`, async ({ page }) => {
      await ouvrir(page, chemin)
      const images = await page.locator('main img').all()
      expect(images.length).toBeGreaterThan(0)
      for (const img of images) {
        expect(((await img.getAttribute('alt')) ?? '').trim().length).toBeGreaterThan(0)
      }
    })
  }
})

test('sous « mouvement réduit », transitions et animations sont neutralisées (FR-017)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ouvrir(page, '/')
  // Un lien de rubrique du pied porte une transition de couleur (150 ms) ; sous
  // « mouvement réduit », la règle globale de `main.css` la ramène à ~0. La MÊME
  // règle neutralise le squelette animé des maquettes (jamais rendu ici) et
  // l'`animate-pulse` de l'autosave.
  const lien = page.getByTestId('pied').getByTestId('rubriques').getByRole('link').first()
  const duree = await lien.evaluate((el) => getComputedStyle(el).transitionDuration)
  // '0s' ou '0.00001s' selon le navigateur : dans tous les cas ≤ 1 ms.
  expect(Number.parseFloat(duree) * 1000).toBeLessThanOrEqual(1)
})
