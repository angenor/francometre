import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * La boucle vérifiable de l'authentification : qui n'est pas connecté ne voit
 * pas l'administration, qui l'est y accède, se déconnecter la referme.
 *
 * Couvre US1 (connexion), US2 (refus par défaut), US3 (échec indistinct),
 * US4 (déconnexion), US5 (persistance) et la porte 8 (a11y, deux thèmes).
 */

const IDENTIFIANT = process.env.COMPTE_REDACTION_IDENTIFIANT ?? 'redaction@francometre.com'
const MOT_DE_PASSE = process.env.COMPTE_REDACTION_MOT_DE_PASSE ?? ''
const MESSAGE_ECHEC = 'E-mail ou mot de passe incorrect.'

/** Remplit et soumet le formulaire de connexion (la page doit être ouverte). */
async function soumettre(page: Page, identifiant: string, motDePasse: string) {
  await page.getByLabel('E-mail').fill(identifiant)
  await page.getByLabel('Mot de passe').fill(motDePasse)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

/** Ouvre `/connexion` et se connecte avec les identifiants d'amorçage valides. */
async function seConnecter(page: Page) {
  await ouvrir(page, '/connexion')
  await soumettre(page, IDENTIFIANT, MOT_DE_PASSE)
  await page.waitForURL('**/admin')
}

test.describe('US1 — Un membre de la rédaction se connecte', () => {
  test('admet un membre valide, arrive sur /admin, et la session persiste au rechargement', async ({ page }) => {
    await seConnecter(page)
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()

    // Rechargement : l'accès reste ouvert (session portée par le cookie).
    await page.reload()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()
  })

  test('admet un identifiant à casse et espaces différents (FR-018)', async ({ page }) => {
    await ouvrir(page, '/connexion')
    await soumettre(page, `  ${IDENTIFIANT.toUpperCase()}  `, MOT_DE_PASSE)
    await page.waitForURL('**/admin')
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()
  })
})

test.describe('US2 — L\'accès à l\'administration est refusé par défaut', () => {
  test('renvoie /admin non connecté vers la connexion, sans contenu d\'administration', async ({ page }) => {
    await ouvrir(page, '/admin')
    await expect(page).toHaveURL(/\/connexion\?retour=/)
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toHaveCount(0)
  })

  test('refuse une adresse profonde /admin/* par préfixe (sans opt-in)', async ({ page }) => {
    await ouvrir(page, '/admin/quoi-que-ce-soit')
    await expect(page).toHaveURL(/\/connexion\?retour=/)
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  })

  test('après connexion, ramène vers l\'espace demandé (retour validé)', async ({ page }) => {
    await ouvrir(page, '/admin')
    // Le middleware pose `?retour=…` pointant vers /admin (vue-router décode le
    // `%2F` en `/` dans la query — chemin interne, accepté par le serveur).
    await expect(page).toHaveURL(/\/connexion\?retour=(%2F|\/)admin/)
    await soumettre(page, IDENTIFIANT, MOT_DE_PASSE)
    await page.waitForURL('**/admin')
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()
  })
})

test.describe('US3 — Erreur signalée sans culpabiliser ni renseigner', () => {
  // Les trois causes d'échec doivent produire EXACTEMENT le même message, sans
  // désigner de champ. L'identifiant est conservé, le mot de passe vidé.
  for (const [cas, identifiant, motDePasse] of [
    ['identifiant inconnu', 'inconnu@francometre.com', MOT_DE_PASSE],
    ['mot de passe faux', IDENTIFIANT, 'ce-n-est-pas-le-bon'],
    ['champ mot de passe vide', IDENTIFIANT, ''],
  ] as const) {
    test(`« ${cas} » : message unique et indistinct`, async ({ page }) => {
      await ouvrir(page, '/connexion')
      await soumettre(page, identifiant, motDePasse)

      const alerte = page.getByRole('alert')
      await expect(alerte).toHaveText(MESSAGE_ECHEC)
      // Aucun champ n'est désigné : le message n'apparaît qu'une fois.
      await expect(page.getByText(MESSAGE_ECHEC)).toHaveCount(1)

      // Identifiant conservé, mot de passe vidé ; on reste sur la connexion.
      await expect(page.getByLabel('E-mail')).toHaveValue(identifiant)
      await expect(page.getByLabel('Mot de passe')).toHaveValue('')
      await expect(page).toHaveURL(/\/connexion/)
    })
  }

  test('marque les champs en erreur autrement que par la seule couleur (aria-invalid)', async ({ page }) => {
    await ouvrir(page, '/connexion')
    await soumettre(page, IDENTIFIANT, 'mauvais')
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Mot de passe')).toHaveAttribute('aria-invalid', 'true')
  })
})

test.describe('US4 — Un membre se déconnecte', () => {
  test('la déconnexion referme l\'accès, y compris via « précédent »', async ({ page }) => {
    await seConnecter(page)

    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await page.waitForURL('**/connexion')

    // Demander /admin : renvoi vers la connexion.
    await ouvrir(page, '/admin')
    await expect(page).toHaveURL(/\/connexion\?retour=/)

    // « Précédent » vers /admin : toujours renvoyé (pas de page en cache).
    await page.goBack()
    await expect(page).toHaveURL(/\/connexion/)
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toHaveCount(0)
  })
})

test.describe('US5 — La session persiste puis expire', () => {
  test('la session survit à un rechargement au sein de sa durée de vie', async ({ page }) => {
    await seConnecter(page)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()
  })

  test('la page de connexion mène directement à /admin si déjà connecté (FR-008)', async ({ page }) => {
    await seConnecter(page)
    await ouvrir(page, '/connexion')
    await page.waitForURL('**/admin')
    await expect(page.getByRole('heading', { name: 'Espace d\'administration' })).toBeVisible()
  })
})

test.describe('Identité visuelle & accessibilité (porte 8)', () => {
  const NORMES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

  for (const theme of ['light', 'dark'] as const) {
    const nom = theme === 'dark' ? 'sombre' : 'clair'

    test(`la connexion passe AA en thème ${nom}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/connexion')

      const resultat = await new AxeBuilder({ page }).withTags(NORMES).analyze()
      expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
    })

    test(`la connexion en erreur passe AA en thème ${nom}`, async ({ page }) => {
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/connexion')
      await soumettre(page, IDENTIFIANT, 'mauvais')
      await expect(page.getByRole('alert')).toBeVisible()

      const resultat = await new AxeBuilder({ page }).withTags(NORMES).analyze()
      expect(resultat.violations, JSON.stringify(resultat.violations, null, 2)).toEqual([])
    })
  }

  test('aucun défilement horizontal à 375 px', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) !== 375, 'Contrôle propre à la largeur téléphone.')
    await ouvrir(page, '/connexion')
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(deborde).toBe(false)
  })

  test('le repère de focus reste visible sur le bouton (outline rétabli)', async ({ page }) => {
    await ouvrir(page, '/connexion')
    const bouton = page.getByRole('button', { name: 'Se connecter' })
    await bouton.focus()
    const contour = await bouton.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contour).not.toBe('none')
  })
})
