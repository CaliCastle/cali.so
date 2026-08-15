import { expect, test } from '@playwright/test'
import { instant } from '@next/playwright'

import { prepareBrowserPage, watchBrowserErrors } from './support'

test('@hosted prefetched dock navigation renders instantly and preserves history', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  const projectsPrefetch = page.waitForResponse((response) => {
    const headers = response.request().headers()

    return (
      new URL(response.url()).pathname === '/en/projects' &&
      (headers['next-router-prefetch'] === '1' ||
        headers['next-router-segment-prefetch'] !== undefined)
    )
  })
  await page.goto('/en/blog')
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preferences' })).toBeEnabled()
  await projectsPrefetch

  const historyLength = await page.evaluate(() => window.history.length)
  await page.evaluate(() => {
    ;(window as Window & { __browserReleaseMarker?: string }).__browserReleaseMarker =
      'mounted'
  })

  await instant(page, async () => {
    await page.getByRole('link', { name: 'Projects, G then J' }).click()

    await expect(page).toHaveURL(/\/en\/projects$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    await expect(page.locator('main [data-list-stage-row]')).not.toHaveCount(0)
    expect(
      await page.evaluate(
        () => (window as Window & { __browserReleaseMarker?: string }).__browserReleaseMarker,
      ),
    ).toBe('mounted')
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength + 1)
  })

  await expect(page.locator('main a[target="_blank"]')).not.toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/en\/blog$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as Window & { __browserReleaseMarker?: string }).__browserReleaseMarker,
    ),
  ).toBe('mounted')
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength + 1)
  expect(browserErrors).toEqual([])
})

test('Cali Baby project navigates internally in the current locale', async ({ page }) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/en/projects')

  const project = page.locator('[data-list-stage-id="Cali 宝宝"]')
  await expect(project).toHaveAttribute('href', '/en/calibaby')
  await expect(project).not.toHaveAttribute('target', '_blank')
  await expect(project.locator('.external-mark')).toHaveCount(0)

  await project.click()
  await expect(page).toHaveURL(/\/en\/calibaby$/)
  await expect(page.locator('h1')).toContainText('You don’t have to')
  expect(browserErrors).toEqual([])
})

test('Preferences applies theme from the keyboard and restores trigger focus', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/en')

  const trigger = page.getByRole('button', { name: 'Preferences' })
  await expect(trigger).toBeEnabled()
  await trigger.focus()
  await trigger.press('Enter')

  const panel = page.getByRole('dialog', { name: 'Preferences' })
  await expect(panel).toBeVisible()
  await panel
    .getByRole('tablist', { name: 'Theme' })
    .getByRole('tab', { name: 'Dark' })
    .click()

  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()
  expect(browserErrors).toEqual([])
})

test('Preferences keeps the current route when switching languages', async ({ page }) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/projects')

  const trigger = page.getByRole('button', { name: '偏好设置' })
  await expect(trigger).toBeEnabled()
  await trigger.click()

  const panel = page.getByRole('dialog', { name: '偏好设置' })
  await panel
    .getByRole('tablist', { name: '语言' })
    .getByRole('tab', { name: 'English' })
    .click()

  await expect(page).toHaveURL(/\/en\/projects$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
  expect(browserErrors).toEqual([])
})
