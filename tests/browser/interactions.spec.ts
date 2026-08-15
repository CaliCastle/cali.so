import { expect, test } from '@playwright/test'

import {
  gotoBrowserArticleFixture,
  prepareBrowserPage,
  watchBrowserErrors,
} from './support'

async function runningAnimationCount(pageOrLocator: {
  evaluate<Result>(callback: () => Result): Promise<Result>
}) {
  return pageOrLocator.evaluate(
    () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
  )
}

test('keyboard preview cards open without card or contribution-cell motion', async ({ page }) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/en')
  await expect(page.getByRole('button', { name: 'Preferences' })).toBeEnabled()

  const trigger = page.locator('main a[href="https://github.com/CaliCastle"]:visible')
  await expect(trigger).toHaveCount(1)
  await trigger.focus()

  const card = page.locator('.link-card')
  await expect(card).toBeVisible()
  await expect(card).toHaveClass(/preview-card-instant/)
  await expect(card.locator('.contrib-grid i')).toHaveCount(182)
  expect(
    await card.evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0)
  expect(browserErrors).toEqual([])
})

test('keyboard lightbox opens and closes immediately with focus restoration', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await gotoBrowserArticleFixture(page)
  await expect(page.getByRole('button', { name: 'Preferences' })).toBeEnabled()

  const trigger = page.locator('.zoom-trigger:visible').first()
  await expect(trigger).toBeVisible()
  await trigger.focus()
  await trigger.press('Enter')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('data-state', 'open')
  await expect(dialog).toHaveAttribute('data-motion', 'instant')
  expect(
    await dialog.evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  expect(browserErrors).toEqual([])
})

test('keyboard article-map toggles settle without transition motion', async ({ page }) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await gotoBrowserArticleFixture(page)
  await expect(page.getByRole('button', { name: 'Preferences' })).toBeEnabled()

  const root = page.locator('.post-minimap-root')
  const closeToggle = page.getByRole('button', { name: 'Close article map' })
  await expect(closeToggle).toBeVisible()
  await expect.poll(() => runningAnimationCount(page)).toBe(0)
  await closeToggle.focus()
  await closeToggle.press('Enter')

  await expect(root).not.toHaveAttribute('data-open', '')
  await expect(root).toHaveAttribute('data-toggle-motion', 'instant')
  await expect.poll(() => runningAnimationCount(page)).toBe(0)

  const openToggle = page.getByRole('button', { name: 'Open article map' })
  await openToggle.press('Enter')
  await expect(root).toHaveAttribute('data-open', 'true')
  await expect(page.getByRole('navigation', { name: 'Article map' })).toBeVisible()
  await expect.poll(() => runningAnimationCount(page)).toBe(0)
  expect(browserErrors).toEqual([])
})

test('reduced motion leaves the public shell with no running web animations', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en')
  await expect(page.getByRole('button', { name: 'Preferences' })).toBeEnabled()

  await expect.poll(() => runningAnimationCount(page)).toBe(0)
  expect(browserErrors).toEqual([])
})
