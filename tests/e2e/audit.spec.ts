import { chromium, test, type Browser } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

/**
 * SC-001 — Lighthouse ≥ 90 (performance / référencement / accessibilité) sur
 * l'accueil et un article, en profils MOBILE et BUREAU (research D11).
 *
 * Audit LOURD et lent : SKIPPÉ dans `npm run test:e2e` par défaut, lancé par
 * `npm run audit` (`AUDIT=1`) contre une PRÉVERSION DE PRODUCTION
 * (`npm run build && npm run preview`) — les scores de performance n'ont de sens
 * que sur le build, pas sur le serveur de développement.
 *
 * L'audit pilote son PROPRE Chromium (port de débogage fixe requis par
 * Lighthouse), indépendant du navigateur de la suite : le viewport du projet
 * Playwright n'influe pas, Lighthouse émule lui-même chaque profil.
 */
const AUDIT_ACTIF = !!process.env.AUDIT
const PORT_DEBUG = 9222
const SEUILS = { performance: 90, seo: 90, accessibility: 90 }
const BASE = process.env.FRANCOMETRE_URL ?? 'http://127.0.0.1:3000'

const PAGES = [
  ['l’accueil', '/'],
  ['un article', '/article/le-retour-du-lynx-dans-le-jura'],
] as const

const CATEGORIES = ['performance', 'seo', 'accessibility']

// Chaque profil porte SON throttling : `lighthouse:default` EST mobile (slow 4G
// + 4× CPU) ; le profil bureau doit RÉTABLIR un throttling bureau, sans quoi
// Lighthouse applique le ralentissement mobile au bureau (perf faussée à ~62).
const PROFILS = [
  ['bureau', {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: CATEGORIES,
      formFactor: 'desktop',
      throttling: { rttMs: 40, throughputKbps: 10_240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    },
  }],
  ['mobile', {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: CATEGORIES,
      formFactor: 'mobile',
      // Throttling par défaut de lighthouse:default (slow 4G + 4× CPU) conservé.
      screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
    },
  }],
] as const

test.describe('Audit Lighthouse ≥ 90 (SC-001)', () => {
  test.skip(!AUDIT_ACTIF, 'Audit lourd — lancer via `npm run audit` (préversion de production requise).')
  test.describe.configure({ mode: 'serial', timeout: 180_000 })

  let navigateur: Browser | undefined
  test.beforeAll(async () => {
    if (!AUDIT_ACTIF) return
    navigateur = await chromium.launch({ args: [`--remote-debugging-port=${PORT_DEBUG}`] })
  })
  test.afterAll(async () => {
    await navigateur?.close()
  })

  for (const [nomPage, chemin] of PAGES) {
    for (const [nomProfil, config] of PROFILS) {
      test(`${nomPage} — profil ${nomProfil} ≥ 90 (perf/réf/a11y)`, async () => {
        const page = await navigateur!.newPage()
        await page.goto(BASE + chemin, { waitUntil: 'networkidle' })
        await playAudit({
          page,
          port: PORT_DEBUG,
          thresholds: SEUILS,
          ignoreBrowserName: true,
          config,
        })
        await page.close()
      })
    }
  }
})
