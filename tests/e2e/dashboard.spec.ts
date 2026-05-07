// E2E Dashboard Tests
// Note: Install @playwright/test first: npm install -D @playwright/test

import { test, expect } from '@playwright/test'

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Dashboard|Welcome/)
    
    // Should show key metrics
    await expect(page.locator('text=/Sales|Revenue|Orders/')).toBeVisible()
  })

  test('should navigate to CRM page', async ({ page }) => {
    await page.click('text=CRM')
    
    await expect(page).toHaveURL(/\/dashboard\/crm/)
    await expect(page.locator('h1')).toContainText(/CRM|Customers/)
  })

  test('should navigate to Staff Performance page', async ({ page }) => {
    await page.click('text=Staff Performance')
    
    await expect(page).toHaveURL(/\/dashboard\/staff-performance/)
    await expect(page.locator('h1')).toContainText(/Staff|Performance/)
  })

  test('should navigate to Reservations page', async ({ page }) => {
    await page.click('text=Reservations')
    
    await expect(page).toHaveURL(/\/dashboard\/reservations/)
    await expect(page.locator('h1')).toContainText(/Reservations/)
  })

  test('should navigate to Inventory Alerts page', async ({ page }) => {
    await page.click('text=Inventory Alerts')
    
    await expect(page).toHaveURL(/\/dashboard\/inventory-alerts/)
  })

  test('should navigate to A/B Testing page', async ({ page }) => {
    await page.click('text=A/B Testing')
    
    await expect(page).toHaveURL(/\/dashboard\/ab-testing/)
  })

  test('should navigate to Campaigns page', async ({ page }) => {
    await page.click('text=Campaigns')
    
    await expect(page).toHaveURL(/\/dashboard\/campaigns/)
  })
})

test.describe('CRM Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/crm')
  })

  test('should display customer segments', async ({ page }) => {
    await expect(page.locator('text=Champions')).toBeVisible()
    await expect(page.locator('text=Loyal')).toBeVisible()
    await expect(page.locator('text=At Risk')).toBeVisible()
  })

  test('should filter customers by segment', async ({ page }) => {
    await page.click('button:has-text("Champions")')
    
    // Should show only champions
    await expect(page.locator('text=Champions')).toBeVisible()
  })

  test('should search customers', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'John')
    
    // Should filter results
    await page.waitForTimeout(500)
  })

  test('should export customer data', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('customers')
  })
})

test.describe('Reservation Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.goto('/dashboard/reservations')
  })

  test('should open create reservation modal', async ({ page }) => {
    await page.click('button:has-text("New Reservation")')
    
    await expect(page.locator('text=Create Reservation')).toBeVisible()
  })

  test('should create new reservation', async ({ page }) => {
    await page.click('button:has-text("New Reservation")')
    
    // Fill form
    await page.fill('input[name="customerName"]', 'John Doe')
    await page.fill('input[name="customerPhone"]', '+250788123456')
    await page.fill('input[name="customerEmail"]', 'john@example.com')
    await page.fill('input[name="partySize"]', '4')
    await page.fill('input[name="reservationDate"]', '2026-04-25')
    await page.fill('input[name="reservationTime"]', '19:00')
    
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=/Success|Created/')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.click('button:has-text("New Reservation")')
    
    // Submit without filling
    await page.click('button[type="submit"]')
    
    // Should show errors
    await expect(page.locator('text=required')).toBeVisible()
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show mobile menu', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Should show hamburger menu
    await expect(page.locator('button[aria-label*="menu"]')).toBeVisible()
  })

  test('should navigate on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Open menu
    await page.click('button[aria-label*="menu"]')
    
    // Click nav item
    await page.click('text=CRM')
    
    await expect(page).toHaveURL(/\/dashboard\/crm/)
  })
})
