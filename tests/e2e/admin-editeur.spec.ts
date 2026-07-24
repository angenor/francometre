import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US2 — Rédiger un article et enregistrer un brouillon.
 *
 * L'éditeur rend le corps EXACTEMENT comme publié (classe `.corps`), enregistre
 * seul (autosave + création paresseuse), accepte une couverture décrite et une
 * image de corps rangée en `/medias/<clé>` (jamais une URL de fournisseur, D4),
 * et restitue tout à la réouverture.
 */

/** Une image PNG de test, en mémoire (aucun fichier sur le disque). */
async function png(): Promise<Buffer> {
  return sharp({
    create: { width: 800, height: 450, channels: 3, background: { r: 30, g: 90, b: 160 } },
  }).png().toBuffer()
}

async function creerBrouillon(page: import('@playwright/test').Page) {
  await ouvrir(page, '/admin/articles/nouveau')
  await page.getByLabel('Titre de l\'article').fill('Un article de vérification')
  await page.getByLabel('Chapô').fill('Chapô de vérification pour l\'autosave.')
  // Création paresseuse : l'autosave crée le brouillon et l'URL bascule.
  await expect.poll(() => page.url(), { timeout: 15_000 })
    .toMatch(/\/admin\/articles\/[a-z0-9]{10,}$/)
  return page.url().split('/').pop()!
}

test.describe('US2 — Éditeur', () => {
  test('autosave : crée le brouillon, restitue à la réouverture', async ({ page }) => {
    await seConnecterAdmin(page)
    const id = await creerBrouillon(page)

    await expect(page.getByTestId('indicateur-autosave')).toContainText('Brouillon enregistré')

    // Réouverture depuis une navigation fraîche.
    await ouvrir(page, `/admin/articles/${id}`)
    await expect(page.getByLabel('Titre de l\'article')).toHaveValue('Un article de vérification')
    await expect(page.getByLabel('Chapô')).toHaveValue('Chapô de vérification pour l\'autosave.')
  })

  test('la mise en forme rend le corps en .corps (comme publié)', async ({ page }) => {
    await seConnecterAdmin(page)
    await creerBrouillon(page)

    const corps = page.locator('.tiptap-corps')
    await corps.click()
    await page.keyboard.type('Un intertitre')
    // Le curseur est dans le paragraphe : H2 le transforme en intertitre.
    await page.getByRole('button', { name: 'Titre de niveau 2' }).click()
    await expect(corps.locator('h2')).toHaveText('Un intertitre')

    // La zone d'édition porte bien la classe partagée avec le rendu public.
    await expect(corps).toHaveClass(/corps/)
  })

  test('image du corps → <img src="/medias/…"> dans le corps stocké', async ({ page }) => {
    await seConnecterAdmin(page)
    const id = await creerBrouillon(page)

    await page.locator('.tiptap-corps').click()
    await page.keyboard.type('Texte avant image.')

    // On observe le PATCH d'autosave qui persiste l'image (évite `page.request`,
    // dont le cookie `Secure` ne franchit pas HTTP).
    const attentePatch = page.waitForResponse(async (r) => {
      if (!r.url().includes(`/api/admin/articles/${id}`) || r.request().method() !== 'PATCH') return false
      const corps = (await r.json().catch(() => ({})))?.corpsHtml ?? ''
      return /<img[^>]+src="\/medias\//.test(corps)
    }, { timeout: 15_000 })

    await page.getByTestId('champ-image-corps').setInputFiles({
      name: 'corps.png',
      mimeType: 'image/png',
      buffer: await png(),
    })

    // L'image apparaît dans l'éditeur, adresse racine-relative.
    await expect(page.locator('.tiptap-corps img')).toHaveAttribute('src', /^\/medias\//)

    // Le corps STOCKÉ ne porte qu'une adresse d'application, jamais une URL de
    // fournisseur (D4).
    const reponse = await attentePatch
    const corps = (await reponse.json()).corpsHtml as string
    expect(corps).toMatch(/<img[^>]+src="\/medias\//)
    expect(corps).not.toMatch(/src="https?:/)
    expect(corps).not.toMatch(/data:/)
  })

  test('dépose une couverture et son texte alternatif', async ({ page }) => {
    await seConnecterAdmin(page)
    const id = await creerBrouillon(page)

    await page.getByTestId('champ-couverture').setInputFiles({
      name: 'couverture.png',
      mimeType: 'image/png',
      buffer: await png(),
    })
    // L'aperçu et le champ alt apparaissent une fois le téléversement fait.
    const attentePatch = page.waitForResponse(async (r) => {
      if (!r.url().includes(`/api/admin/articles/${id}`) || r.request().method() !== 'PATCH') return false
      return (await r.json().catch(() => ({})))?.couverture?.alt === 'Une image de couverture décrite.'
    }, { timeout: 15_000 })
    await page.getByLabel('Texte alternatif').fill('Une image de couverture décrite.')

    const dto = await (await attentePatch).json()
    expect(dto.couverture?.url).toMatch(/^\/medias\//)

    // Restitution à la réouverture.
    await ouvrir(page, `/admin/articles/${id}`)
    await expect(page.getByLabel('Texte alternatif')).toHaveValue('Une image de couverture décrite.')
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`aucun débordement horizontal en thème ${theme === 'dark' ? 'sombre' : 'clair'}`, async ({ page }) => {
      await seConnecterAdmin(page)
      await page.addInitScript((t) => window.localStorage.setItem('francometre-theme', t), theme)
      await ouvrir(page, '/admin/articles/nouveau')

      const deborde = await page.evaluate(
        () => document.body.scrollWidth > document.body.clientWidth,
      )
      expect(deborde, 'le corps déborde horizontalement').toBe(false)
    })
  }
})
