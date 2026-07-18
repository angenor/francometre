import { defineConfig, devices } from '@playwright/test'

// Cinq largeurs : 375 (téléphone), 768 (tablette), 999 et 1000 (de part et
// d'autre du point de rupture du socle), 1440 (cadre à sa largeur maximale).
const LARGEURS = [375, 768, 999, 1000, 1440] as const

/**
 * Serveur visé — trois modes, du plus courant au plus particulier.
 *
 *   npm run test:e2e                      serveur de développement (défaut)
 *   FRANCOMETRE_BUILD=1 npm run test:e2e  serveur COMPILÉ (`npm run build` d'abord)
 *   FRANCOMETRE_URL=… npm run test:e2e    serveur déjà lancé, à l'adresse donnée
 *
 * Le deuxième mode compte : vérifier le socle sur la compilation, et pas
 * seulement en développement, est une exigence de la feature. Playwright
 * démarre et arrête lui-même ce serveur — c'est plus sûr que de le lancer à la
 * main en arrière-plan, où rien ne garantit qu'il survive à la suite.
 */
const SERVEUR_EXTERNE = process.env.FRANCOMETRE_URL
const CIBLE_COMPILATION = !!process.env.FRANCOMETRE_BUILD
const PORT = CIBLE_COMPILATION ? 3100 : 3000
const BASE = SERVEUR_EXTERNE ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,

  // Le serveur de développement compile à la demande : saturé par cinq projets
  // en parallèle, il répond assez lentement pour que des attentes légitimes
  // expirent. La limite de tâches et le délai d'affirmation ci-dessous tiennent
  // compte de cette latence — ils ne masquent aucun défaut, ils cessent d'en
  // inventer.
  workers: process.env.CI ? 1 : 4,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],

  use: {
    // 127.0.0.1 et non `localhost` : Nuxt n'écoute que sur `[::1]` par défaut,
    // et la sonde de démarrage résout `localhost` en IPv4 d'abord. L'hôte est
    // donc imposé des deux côtés — voir `webServer` plus bas.
    baseURL: BASE,
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },

  projects: LARGEURS.map((largeur) => ({
    name: `${largeur}px`,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: largeur, height: 900 },
    },
  })),

  // Aucun serveur à démarrer si l'on vise une adresse fournie.
  webServer: SERVEUR_EXTERNE
    ? undefined
    : {
        // En mode compilation, la sortie de `npm run build` est servie telle
        // quelle. Sinon, le serveur de développement — `NUXT_IGNORE_LOCK`
        // parce que le verrou de Nuxt survit à un serveur tué brutalement et
        // bloque alors toute exécution suivante, alors qu'il n'a rien à
        // protéger pour un serveur de test éphémère.
        command: CIBLE_COMPILATION
          ? `PORT=${PORT} node .output/server/index.mjs`
          : 'NUXT_IGNORE_LOCK=1 npm run dev -- --host 127.0.0.1',
        // La sonde vise `/styleguide` et non `/` : Fondations ne livre aucune
        // page de contenu (FR-049), la racine renvoie donc une 404 — que
        // Playwright interpréterait comme « serveur pas encore prêt ».
        url: `http://127.0.0.1:${PORT}/styleguide`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
