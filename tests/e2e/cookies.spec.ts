import { test, expect, request as pwRequest } from '@playwright/test'

// Utility: post to analytics with current context cookies
async function postTrack(page: import('@playwright/test').Page, body: any) {
  const res = await page.request.post('/api/analytics/track', {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  return res
}

test.describe('Cookie consent - server DNT and preferences gating', () => {
  test('DNT=1 header blocks analytics server-side (204)', async ({ baseURL, playwright }) => {
    const req = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { DNT: '1', 'Content-Type': 'application/json' },
    })
    const res = await req.post('/api/analytics/track', { data: { type: 'test_dnt' } })
    expect(res.status()).toBe(204)
  })

  test('Reject non-essential disables analytics (204)', async ({ page }) => {
    await page.goto('/')
    // Click Reject non-essential on the banner
    await expect(page.getByRole('button', { name: /reject non-essential/i })).toBeVisible()
    await page.getByRole('button', { name: /reject non-essential/i }).click()

    // Now posting analytics should be blocked
    const res = await postTrack(page, { type: 'test_reject_non_essential' })
    expect(res.status()).toBe(204)
  })

  test('Accept all enables analytics (200)', async ({ page }) => {
    await page.goto('/')
    // Click Accept all on the banner
    await expect(page.getByRole('button', { name: /accept all/i })).toBeVisible()
    await page.getByRole('button', { name: /accept all/i }).click()

    const res = await postTrack(page, { type: 'test_accept_all' })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('ok', true)
  })
})
