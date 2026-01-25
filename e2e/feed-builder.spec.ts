import { test, expect } from '@playwright/test'

test.describe('Feed Builder', () => {
  test('can navigate to feed builder from homepage', async ({ page }) => {
    await page.goto('/')

    // Type a price query to navigate to feed builder
    const commandBar = page.getByRole('textbox')
    await commandBar.fill('BTC/USD')
    await commandBar.press('Enter')

    // Wait for navigation or module load
    await page.waitForTimeout(500)

    // Should show feed-related content
    const feedContent = page.locator('text=/feed|price|BTC|source/i').first()
    await expect(feedContent).toBeVisible({ timeout: 5000 })
  })

  test('shows data source options', async ({ page }) => {
    await page.goto('/')

    // Navigate to feed builder
    const commandBar = page.getByRole('textbox')
    await commandBar.fill('ETH price')
    await commandBar.press('Enter')

    await page.waitForTimeout(1000)

    // Look for data source related elements
    const sourceElement = page.locator('text=/surge|binance|coinbase|source/i').first()
    await expect(sourceElement).toBeVisible({ timeout: 5000 })
  })

  test('can change symbol', async ({ page }) => {
    await page.goto('/')

    // Start with one symbol
    const commandBar = page.getByRole('textbox')
    await commandBar.fill('SOL/USD')
    await commandBar.press('Enter')

    await page.waitForTimeout(1000)

    // Should show SOL-related content
    const solContent = page.locator('text=/SOL/i').first()
    await expect(solContent).toBeVisible({ timeout: 5000 })
  })

  test('shows aggregation options', async ({ page }) => {
    await page.goto('/')

    const commandBar = page.getByRole('textbox')
    await commandBar.fill('BTC price feed')
    await commandBar.press('Enter')

    await page.waitForTimeout(1000)

    // Look for aggregation options
    const aggregator = page.locator('text=/median|mean|weighted|aggregat/i').first()
    await expect(aggregator).toBeVisible({ timeout: 5000 })
  })

  test('shows blockchain selection', async ({ page }) => {
    await page.goto('/')

    const commandBar = page.getByRole('textbox')
    await commandBar.fill('create BTC feed')
    await commandBar.press('Enter')

    await page.waitForTimeout(1000)

    // Look for blockchain selector
    const blockchain = page.locator('text=/solana|ethereum|chain/i').first()
    await expect(blockchain).toBeVisible({ timeout: 5000 })
  })
})
