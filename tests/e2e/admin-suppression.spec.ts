import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'
import { ouvrir, seConnecterAdmin } from './_aides'

/**
 * US5 — Supprimer un article avec confirmation.
 *
 * La suppression n'est envoyée qu'APRÈS confirmation (dialogue à focus piégé,
 * `Échap` annule). Un article épinglé est retiré de la Une AU PASSAGE, si bien
 * que l'accueil ne présente aucun emplacement orphelin (FR-029/US5 sc.4).
 *
 * Tests destructifs (créent/suppriment) : en série, sur un seul écran.
 */

const surUnSeulEcran = (page: Page) => (page.viewportSize()?.width ?? 0) !== 1440
const jeton = () => Math.random().toString(36).slice(2, 8)

async function png(): Promise<Buffer> {
  return sharp({
    create: { width: 800, height: 450, channels: 3, background: { r: 40, g: 80, b: 120 } },
  }).png().toBuffer()
}

/** Crée un brouillon via l'API (navigateur authentifié) et renvoie son id. */
async function creerBrouillon(page: Page, titre: string): Promise<string> {
  return page.evaluate(async (t) => {
    const r = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ titre: t, chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport' }),
    })
    return (await r.json()).id as string
  }, titre)
}

async function compositionUne(page: Page) {
  return page.evaluate(async () => {
    const r = await fetch('/api/admin/une')
    return r.json() as Promise<{ emplacements: { rang: number, article: { id: string } | null }[] }>
  })
}

test.describe.configure({ mode: 'serial' })

test.describe('US5 — Suppression', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecterAdmin(page)
  })

  test('le dialogue piège le focus et Échap annule sans supprimer', async ({ page }) => {
    test.skip(surUnSeulEcran(page), 'Test d’état — un seul écran, en série.')
    const titre = `À conserver ${jeton()}`
    await creerBrouillon(page, titre)
    await ouvrir(page, `/admin/articles?q=${encodeURIComponent(titre)}`)

    await page.getByRole('button', { name: 'Supprimer' }).first().click()
    const dialogue = page.locator('dialog[open]')
    await expect(dialogue).toBeVisible()

    // Le dialogue est MODAL (piège de focus + inertie de l'arrière-plan natifs).
    expect(await dialogue.evaluate((d) => (d as HTMLDialogElement).matches(':modal'))).toBe(true)
    // Le focus est entré dans le dialogue.
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)
    // Après tabulation, il y reste (confinement natif).
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)

    // Échap referme sans supprimer : l'article est toujours là.
    await page.keyboard.press('Escape')
    await expect(dialogue).toBeHidden()
    await expect(page.getByText(titre)).toBeVisible()
  })

  test('supprime un article non épinglé après confirmation', async ({ page }) => {
    test.skip(surUnSeulEcran(page), 'Test d’état — un seul écran, en série.')
    const titre = `À supprimer ${jeton()}`
    await creerBrouillon(page, titre)
    await ouvrir(page, `/admin/articles?q=${encodeURIComponent(titre)}`)
    await expect(page.getByText(titre)).toBeVisible()

    await page.getByRole('button', { name: 'Supprimer' }).first().click()
    await page.locator('dialog[open]').getByRole('button', { name: 'Supprimer' }).click()

    // Disparu : la liste filtrée n'a plus de résultat.
    await expect(page.getByTestId('etat-vide')).toBeVisible()
    await expect(page.getByText(titre)).toHaveCount(0)
  })

  test('supprimer un épinglé le retire de la Une au passage (aucun orphelin)', async ({ page }) => {
    test.skip(surUnSeulEcran(page), 'Test d’état — un seul écran, en série.')

    // 1. Un article publié complet, unique.
    const titre = `Épinglé à supprimer ${jeton()}`
    const id = await page.evaluate(async ({ t, png }) => {
      const cree = await (await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ titre: t, chapo: 'Chapô.', corps: '<p>Corps.</p>', rubriqueId: 'sport' }),
      })).json()
      // Couverture + alt, puis publication.
      const form = new FormData()
      form.append('fichier', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'c.png')
      const media = await (await fetch('/api/admin/medias', { method: 'POST', body: form })).json()
      await fetch(`/api/admin/articles/${cree.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ couvertureId: media.id, couvertureAlt: 'Décrite.' }),
      })
      await fetch(`/api/admin/articles/${cree.id}/publier`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      return cree.id as string
    }, { t: titre, png: [...(await png())] })

    // 2. L'épingler au rang 5, en conservant les rangs 1..4 existants.
    const avant = await compositionUne(page)
    const rangs14 = avant.emplacements.slice(0, 4).map((e) => e.article?.id).filter(Boolean) as string[]
    const evince = avant.emplacements[4]!.article?.id
    await page.evaluate(async (ordre) => {
      await fetch('/api/admin/une', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ordre }),
      })
    }, [...rangs14, id])

    // Confirmer qu'il est bien à la Une (rang 5).
    const pinned = await compositionUne(page)
    expect(pinned.emplacements[4]!.article!.id).toBe(id)

    // 3. Le supprimer via la liste (il est épinglé).
    await ouvrir(page, `/admin/articles?q=${encodeURIComponent(titre)}`)
    await page.getByRole('button', { name: 'Supprimer' }).first().click()
    await page.locator('dialog[open]').getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByText(titre)).toHaveCount(0)

    // 4. La Une ne le référence plus : le rang 5 est libre, aucun orphelin.
    const apres = await compositionUne(page)
    expect(apres.emplacements[4]!.article).toBeNull()
    expect(apres.emplacements.some((e) => e.article?.id === id)).toBe(false)

    // 5. Remise en état : réépingler l'évincé au rang 5.
    if (evince) {
      await page.evaluate(async (ordre) => {
        await fetch('/api/admin/une', {
          method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ordre }),
        })
      }, [...rangs14, evince])
    }
  })
})
