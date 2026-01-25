import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/FeedGod|Feed|Switchboard/i)
  })

  test('displays main heading', async ({ page }) => {
    // Check for a main heading element
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('displays command bar', async ({ page }) => {
    // Command bar should be visible on homepage
    const commandBar = page.getByRole('textbox')
    await expect(commandBar).toBeVisible()
  })

  test('shows example prompts', async ({ page }) => {
    // Example prompts should be visible
    const examples = page.locator('button').filter({ hasText: /BTC|price|weather|@/i })
    await expect(examples.first()).toBeVisible()
  })

  test('navigation modules are accessible', async ({ page }) => {
    // Check for module cards or navigation elements
    const moduleLinks = page.locator('[href*="feed"], [href*="weather"], button').filter({ hasText: /feed|weather|prediction/i })
    const count = await moduleLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Page should still be functional
    await expect(page.getByRole('textbox')).toBeVisible()
  })

  test('dark mode toggle works', async ({ page }) => {
    // Look for theme toggle button
    const themeButton = page.locator('button').filter({ hasText: /theme|dark|light/i }).first()

    if (await themeButton.isVisible()) {
      const htmlBefore = await page.locator('html').getAttribute('class')
      await themeButton.click()
      const htmlAfter = await page.locator('html').getAttribute('class')

      // Class should change after toggle
      expect(htmlBefore).not.toBe(htmlAfter)
    }
  })
})
