import { test, expect } from '@playwright/test'

test.describe('Command Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('focuses on Cmd+K', async ({ page }) => {
    // Ensure command bar exists
    const commandBar = page.getByRole('textbox')
    await expect(commandBar).toBeVisible()

    // Click elsewhere first
    await page.locator('body').click()

    // Press Cmd+K (or Ctrl+K on non-Mac)
    await page.keyboard.press('Meta+k')

    // Command bar should be focused
    await expect(commandBar).toBeFocused()
  })

  test('clears on Escape', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    await commandBar.fill('test query')
    expect(await commandBar.inputValue()).toBe('test query')

    await page.keyboard.press('Escape')

    expect(await commandBar.inputValue()).toBe('')
  })

  test('shows intent detection for price queries', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    await commandBar.fill('BTC price')

    // Should show price/feed intent indicator
    const indicator = page.locator('text=/price|feed/i').first()
    await expect(indicator).toBeVisible({ timeout: 2000 })
  })

  test('shows intent detection for social queries', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    await commandBar.fill('@elonmusk')

    // Should show social intent indicator
    const indicator = page.locator('text=/social/i').first()
    await expect(indicator).toBeVisible({ timeout: 2000 })
  })

  test('shows intent detection for weather queries', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    await commandBar.fill('tokyo weather')

    // Should show weather intent indicator
    const indicator = page.locator('text=/weather/i').first()
    await expect(indicator).toBeVisible({ timeout: 2000 })
  })

  test('clicking example fills command bar', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    // Find and click an example prompt
    const example = page.locator('button').filter({ hasText: /BTC|price/i }).first()

    if (await example.isVisible()) {
      await example.click()

      // Command bar should be filled
      const value = await commandBar.inputValue()
      expect(value.length).toBeGreaterThan(0)
    }
  })

  test('submitting query navigates to module', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    await commandBar.fill('BTC/USD feed')
    await commandBar.press('Enter')

    // Should show loading or navigate
    await page.waitForTimeout(500)

    // Content should change
    const feedContent = page.locator('text=/feed|price|source|BTC/i').first()
    await expect(feedContent).toBeVisible({ timeout: 5000 })
  })

  test('shows keyboard shortcut hint', async ({ page }) => {
    // Look for keyboard shortcut indicator
    const shortcutHint = page.locator('kbd, text=/\u2318K|Ctrl\\+K/i').first()
    await expect(shortcutHint).toBeVisible()
  })

  test('handles empty submit gracefully', async ({ page }) => {
    const commandBar = page.getByRole('textbox')

    // Ensure empty
    await commandBar.clear()
    await commandBar.press('Enter')

    // Should not crash or show error
    await expect(commandBar).toBeVisible()
  })
})
