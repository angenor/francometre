import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US3 — Publier un article dans le respect des règles.
 *
 * Publier n'aboutit qu'avec titre + chapô + corps + couverture décrite ; le
 * refus NOMME le manquant. Une date future vaut embargo (invisible du public
 * jusqu'à l'échéance). Le corps est assaini côté serveur (SC-004).
 */

async function png(): Promise<Buffer> {
  return sharp({
    create: { width: 800, height: 450, channels: 3, background: { r: 20, g: 60, b: 120 } },
  }).png().toBuffer()
}

/** Crée un brouillon dans l'éditeur et renvoie son identifiant. */
async function nouvelArticle(
  page: Page,
  options: { titre: string, chapo?: string, corps?: string, couverture?: boolean, alt?: string },
): Promise<string> {
  await ouvrir(page, '/admin/articles/nouveau')
  await page.getByLabel('Titre de l\'article').fill(options.titre)
  if (options.chapo) await page.getByLabel('Chapô').fill(options.chapo)
  await page.locator('.tiptap-corps').click()
  await page.keyboard.type(options.corps ?? 'Un corps de vérification.')

  await expect.poll(() => page.url(), { timeout: 15_000 })
    .toMatch(/\/admin\/articles\/[a-z0-9]{10,}$/)
  const id = page.url().split('/').pop()!

  if (options.couverture) {
    await page.getByTestId('champ-couverture').setInputFiles({
      name: 'c.png', mimeType: 'image/png', buffer: await png(),
    })
    // Le champ « Texte alternatif » n'apparaît qu'une fois le téléversement fait :
    // l'attendre garantit que la couverture est bien posée avant de publier.
    await expect(page.getByLabel('Texte alternatif')).toBeVisible()
    if (options.alt) await page.getByLabel('Texte alternatif').fill(options.alt)
  }
  return id
}

const jeton = () => Math.random().toString(36).slice(2, 8)

test.describe('US3 — Publier', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecterAdmin(page)
  })

  test('refuse sans couverture, en la nommant', async ({ page }) => {
    await nouvelArticle(page, { titre: `Sans couverture ${jeton()}`, chapo: 'Chapô présent.' })
    await page.getByRole('button', { name: 'Publier' }).click()
    await expect(page.getByRole('alert')).toContainText(/couverture/i)
  })

  test('refuse sans texte alternatif, en le nommant', async ({ page }) => {
    await nouvelArticle(page, {
      titre: `Sans alt ${jeton()}`, chapo: 'Chapô présent.', couverture: true,
    })
    await page.getByRole('button', { name: 'Publier' }).click()
    await expect(page.getByRole('alert')).toContainText(/alternatif/i)
  })

  test('refuse sans chapô, en le nommant', async ({ page }) => {
    await nouvelArticle(page, {
      titre: `Sans chapô ${jeton()}`, couverture: true, alt: 'Une couverture décrite.',
    })
    await page.getByRole('button', { name: 'Publier' }).click()
    await expect(page.getByRole('alert')).toContainText(/chapô/i)
  })

  test('publie un article complet, qui devient visible du public', async ({ page }) => {
    const titre = `Publié visible ${jeton()}`
    await nouvelArticle(page, {
      titre, chapo: 'Chapô de vérification.', corps: 'Un corps complet.',
      couverture: true, alt: 'Une couverture décrite.',
    })

    const attente = page.waitForResponse((r) => r.url().includes('/publier') && r.status() === 200)
    await page.getByRole('button', { name: 'Publier' }).click()
    await attente

    // Visible sur le site public (le plus récemment publié → première page).
    // Requête UNIQUE : `/articles` est en cache `swr` (006) et servirait du
    // contenu périmé après cette publication. Un paramètre distinct force un SSR
    // frais — on éprouve la VISIBILITÉ publiée, pas la fraîcheur du cache (M2).
    await ouvrir(page, `/articles?f=${jeton()}`)
    await expect(page.getByText(titre)).toBeVisible()
  })

  test('une date future vaut embargo : publié mais invisible du public', async ({ page }) => {
    const titre = `Embargo ${jeton()}`
    await nouvelArticle(page, {
      titre, chapo: 'Chapô.', corps: 'Corps.', couverture: true, alt: 'Décrite.',
    })
    await page.getByLabel('Date de publication').fill('2030-01-15')

    const attente = page.waitForResponse((r) => r.url().includes('/publier') && r.status() === 200)
    await page.getByRole('button', { name: 'Publier' }).click()
    await attente

    // Absent du public jusqu'à l'échéance (FR-014b).
    // Requête UNIQUE : `/articles` est en cache `swr` (006) et servirait du
    // contenu périmé après cette publication. Un paramètre distinct force un SSR
    // frais — on éprouve la VISIBILITÉ publiée, pas la fraîcheur du cache (M2).
    await ouvrir(page, `/articles?f=${jeton()}`)
    await expect(page.getByText(titre)).toHaveCount(0)
  })

  test('le corps est assaini côté serveur avant stockage (SC-004)', async ({ page }) => {
    const id = await nouvelArticle(page, { titre: `Balisage ${jeton()}` })

    // Requête depuis le navigateur (cookie de session valable) : on soumet du
    // balisage interdit et on relit ce qui est réellement stocké.
    const corps = await page.evaluate(async (identifiant) => {
      await fetch(`/api/admin/articles/${identifiant}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          corps: '<p onclick="voler()">Texte</p><script>voler()</script>'
            + '<div style="color:red">bloc</div><h1>Titre concurrent</h1>',
        }),
      })
      const r = await fetch(`/api/admin/articles/${identifiant}`)
      return (await r.json()).corpsHtml as string
    }, id)

    expect(corps).not.toContain('script')
    expect(corps).not.toContain('onclick')
    expect(corps).not.toContain('style=')
    expect(corps).not.toContain('<h1')
    expect(corps).toContain('<p>Texte</p>')
  })
})
