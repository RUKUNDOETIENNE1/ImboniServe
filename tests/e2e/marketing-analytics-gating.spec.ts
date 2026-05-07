import { test, expect } from '@playwright/test'

// Helper to click the cookie banner button by label if visible
async function clickIfVisible(page: import('@playwright/test').Page, nameRegex: RegExp) {
  const btn = page.getByRole('button', { name: nameRegex })
  if (await btn.isVisible()) {
    await btn.click()
  }
}

// Sentry gating tests
test.describe('Sentry gating by Analytics consent', () => {
  test('With DNT=1 (no consent), Sentry should not initialize', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, extraHTTPHeaders: { DNT: '1' } })
    const page = await context.newPage()
    await page.goto('/')
    // Wait a tick for client init code to run
    await page.waitForTimeout(200)
    const sentryInit = await page.evaluate(() => (window as any).__SENTRY_INIT_DONE ?? false)
    expect(sentryInit).toBeFalsy()
    await context.close()
  })

  test('Accept all initializes Sentry when DSN is set', async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SENTRY_DSN, 'SENTRY DSN not set')
    await page.goto('/')
    await clickIfVisible(page, /accept all/i)
    await page.waitForTimeout(300)
    const sentryInit = await page.evaluate(() => (window as any).__SENTRY_INIT_DONE ?? false)
    expect(sentryInit).toBeTruthy()
  })
})

// Crisp gating tests
test.describe('Crisp chat gating by Marketing consent', () => {
  test('Reject non-essential keeps Crisp disabled (no init flag)', async ({ page }) => {
    await page.goto('/')
    await clickIfVisible(page, /reject non-essential/i)
    await page.waitForTimeout(200)
    const crispInit = await page.evaluate(() => (window as any).CRISP_INITIALIZED ?? false)
    expect(crispInit).toBeFalsy()
  })

  test('Accept all initializes Crisp when website ID is set', async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID, 'CRISP website ID not set')
    await page.goto('/')
    await clickIfVisible(page, /accept all/i)
    await page.waitForTimeout(300)
    const crispInit = await page.evaluate(() => (window as any).CRISP_INITIALIZED ?? false)
    expect(crispInit).toBeTruthy()
  })
})
