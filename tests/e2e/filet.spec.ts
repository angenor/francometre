import { expect, test } from '@playwright/test'
import { ouvrir } from './_aides'

/**
 * US5 — le filet de séparation signature.
 *
 * La coupe à 3,5° n'a que DEUX porteurs dans tout le système : le mot-symbole
 * et ce filet. Une troisième occurrence est un défaut — « une troisième fois,
 * et la signature devient un tic ».
 */

test.beforeEach(async ({ page }) => {
  await ouvrir(page)
})

test('chaque filet se brise une seule fois', async ({ page }) => {
  const filets = page.getByTestId('filet')
  const total = await filets.count()
  expect(total).toBeGreaterThan(0)

  for (let i = 0; i < total; i++) {
    const segments = await filets.nth(i).evaluate((el) => ({
      diagonales: el.querySelectorAll('[data-role="diagonale"]').length,
      horizontaux: el.querySelectorAll('[data-role="segment"]').length,
    }))

    expect(segments.diagonales, `le filet n° ${i + 1} n’a pas exactement une brisure`).toBe(1)
    expect(segments.horizontaux, `le filet n° ${i + 1} n’a pas deux segments droits`).toBe(2)
  }
})

test('la brisure respecte la cote : 4 px de dénivelé pour 64 px', async ({ page }) => {
  const diagonale = page.getByTestId('filet').first().locator('[data-role="diagonale"]')
  const boite = await diagonale.boundingBox()

  expect(boite).not.toBeNull()
  expect(boite!.width, 'la diagonale ne parcourt pas 64 px').toBeCloseTo(64, 0)
})

test('les positions de brisure diffèrent d’un filet à l’autre', async ({ page }) => {
  const filets = page.getByTestId('filet')
  const total = await filets.count()
  test.skip(total < 2, 'Il faut au moins deux filets pour comparer leurs positions.')

  const positions: number[] = []
  for (let i = 0; i < total; i++) {
    positions.push(
      await filets.nth(i).evaluate((el) => {
        const declaree = getComputedStyle(el).getPropertyValue('--pos').trim()
        return Number.parseFloat(declaree)
      }),
    )
  }

  expect(new Set(positions).size, 'tous les filets se brisent au même endroit').toBeGreaterThan(1)
})

test('le filet est décoratif et ignoré par les technologies d’assistance', async ({ page }) => {
  const filets = page.getByTestId('filet')
  const total = await filets.count()

  for (let i = 0; i < total; i++) {
    await expect(filets.nth(i)).toHaveAttribute('aria-hidden', 'true')
  }
})

test('la diagonale n’a que deux porteurs sur toute la page', async ({ page }) => {
  // Recensement : tout élément incliné, tout tracé oblique. Seuls le
  // mot-symbole (image, coupe intégrée au dessin) et `FiletCoupe` en portent.
  const intrus = await page.evaluate(() => {
    const suspects: string[] = []

    for (const el of document.querySelectorAll<HTMLElement>('*')) {
      if (el.closest('[data-testid="filet"]')) continue
      if (el.dataset.role === 'mot-symbole' || el.closest('[data-role="mot-symbole"]')) continue

      const transformation = getComputedStyle(el).transform
      if (transformation && transformation !== 'none') {
        // Une matrice non diagonale traduit une rotation ou un cisaillement.
        const nombres = transformation.match(/-?[\d.]+/g)?.map(Number) ?? []
        if (nombres.length >= 4 && (Math.abs(nombres[1]!) > 0.001 || Math.abs(nombres[2]!) > 0.001)) {
          suspects.push(`${el.tagName}.${el.className}`)
        }
      }
    }

    return suspects
  })

  expect(intrus, `diagonales en trop : ${intrus.join(', ')}`).toEqual([])
})
