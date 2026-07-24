import type { Page } from '@playwright/test'

/**
 * Aides partagées par les tests de bout en bout.
 */

/**
 * Ouvre une adresse et attend que la page soit RÉELLEMENT interactive.
 *
 * `page.goto()` rend la main au chargement du document, bien avant que Vue
 * n'ait hydraté la page. Interagir dans cet intervalle donne des échecs
 * trompeurs, de deux natures :
 *
 *   - un clic sur un bouton non encore hydraté ne déclenche rien, et rien ne
 *     le rattrapera ;
 *   - la planche de style lit ses libellés dans les variables CSS après le
 *     montage, ce qui déplace la mise en page — un survol visé avant ce
 *     moment se retrouve à côté de sa cible.
 *
 * Vue pose `__vue_app__` sur le conteneur au montage : c'est ce signal que
 * l'on attend, plutôt qu'une temporisation arbitraire.
 */
export async function ouvrir(page: Page, chemin = '/styleguide') {
  await page.goto(chemin)

  // 1. Vue a monté l'application sur son conteneur.
  await page.waitForFunction(
    () => !!(document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__,
  )

  // 2. Nuxt enveloppe la page dans un `Suspense` : le montage rend la main
  //    avant que les sous-arbres n'aient fini d'hydrater, et un clic tombé
  //    dans cet intervalle ne trouve aucun gestionnaire. En développement, ce
  //    qui reste à venir arrive par le réseau — attendre son silence est le
  //    seul signal fiable dont on dispose depuis la page.
  await page.waitForLoadState('networkidle')

  // 3. La planche lit ses libellés dans les variables CSS après le montage, ce
  //    qui déplace la mise en page. On laisse peindre avant de viser.
  await page.evaluate(
    () => new Promise((resoudre) => requestAnimationFrame(() => requestAnimationFrame(resoudre))),
  )
}

/**
 * Identifiants d'amorçage de la rédaction (feature 004). Le mot de passe vient
 * de l'environnement du seed ; sans lui, les tests d'administration ne peuvent
 * pas se connecter (aucun mot de passe par défaut, par construction).
 */
export const IDENTIFIANT_ADMIN
  = process.env.COMPTE_REDACTION_IDENTIFIANT ?? 'redaction@francometre.com'
export const MOT_DE_PASSE_ADMIN = process.env.COMPTE_REDACTION_MOT_DE_PASSE ?? ''

/**
 * Se connecte à l'administration et attend l'atterrissage sur la liste des
 * articles (`/admin` redirige vers `/admin/articles`). Partagé par les tests
 * d'administration, qui commencent tous connectés.
 */
export async function seConnecterAdmin(page: Page) {
  await ouvrir(page, '/connexion')
  await page.getByLabel('E-mail').fill(IDENTIFIANT_ADMIN)
  await page.getByLabel('Mot de passe').fill(MOT_DE_PASSE_ADMIN)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('**/admin/articles')
}
