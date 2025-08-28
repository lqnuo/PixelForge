import { test, expect } from '@playwright/test'

test('home page renders and shows hero', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/)

  // Brand and headline
  await expect(page.getByText('PixelForge', { exact: false })).toBeVisible()
  await expect(page.getByText('桌面 AI 图像生产力', { exact: false })).toBeVisible()

  // Primary CTAs
  await expect(page.getByRole('link', { name: /下载|download/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /定价|pricing/i })).toBeVisible()

  // Capture a full-page screenshot for visual inspection
  await page.screenshot({ path: 'tests-artifacts/home.png', fullPage: true })
})
