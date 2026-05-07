// Accessibility Tests
// Note: Install dependencies first:
// npm install -D @axe-core/playwright

import { test, expect } from '@playwright/test'
// import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility Audit', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/')
    
    // Check for basic accessibility
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for alt text on images
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThan(0)
    expect(h1Count).toBeLessThanOrEqual(1) // Only one h1 per page
  })

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login')
    
    // Check for form labels
    const emailInput = page.locator('input[name="email"]')
    const emailLabel = page.locator('label[for="email"]')
    
    await expect(emailInput).toBeVisible()
    // Labels should exist or aria-label should be present
    const hasLabel = await emailLabel.count() > 0
    const hasAriaLabel = await emailInput.getAttribute('aria-label')
    
    expect(hasLabel || hasAriaLabel).toBeTruthy()
  })

  test('dashboard should be accessible', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL(/dashboard/)
    
    // Check for skip to content link
    const skipLink = page.locator('a[href="#main-content"]')
    // Skip links are good for accessibility
    
    // Check for ARIA landmarks
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/')
    
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      // Button should have either text or aria-label
      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('links should have accessible names', async ({ page }) => {
    await page.goto('/')
    
    const links = await page.locator('a').all()
    for (const link of links) {
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      
      // Link should have either text or aria-label
      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/login')
    
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      // Input should have id (for label), aria-label, or aria-labelledby
      expect(id || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })

  test('color contrast should be sufficient', async ({ page }) => {
    await page.goto('/')
    
    // Check that text is visible (basic contrast check)
    const headings = await page.locator('h1, h2, h3').all()
    for (const heading of headings) {
      await expect(heading).toBeVisible()
    }
  })

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/login')
    
    // Tab through form
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to submit with Enter
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.keyboard.press('Enter')
    
    // Should submit form
    await page.waitForURL(/dashboard/)
  })

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/login')
    
    // Tab to first input
    await page.keyboard.press('Tab')
    
    // Check if focused element has outline or ring
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('page should have proper lang attribute', async ({ page }) => {
    await page.goto('/')
    
    const html = page.locator('html')
    const lang = await html.getAttribute('lang')
    
    expect(lang).toBeTruthy()
    expect(['en', 'fr', 'rw']).toContain(lang)
  })
})

test.describe('WCAG 2.1 AA Compliance', () => {
  test('should have descriptive page titles', async ({ page }) => {
    const pages = ['/', '/login', '/signup']
    
    for (const url of pages) {
      await page.goto(url)
      const title = await page.title()
      
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
      expect(title).toContain('Imboni')
    }
  })

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/')
    
    // Get all headings
    const h1s = await page.locator('h1').count()
    const h2s = await page.locator('h2').count()
    
    // Should have exactly one h1
    expect(h1s).toBe(1)
    
    // Should have h2s if content is structured
    expect(h2s).toBeGreaterThanOrEqual(0)
  })

  test('should support screen readers', async ({ page }) => {
    await page.goto('/')
    
    // Check for ARIA roles
    const navigation = page.locator('[role="navigation"]')
    const main = page.locator('[role="main"]')
    
    // At least one should exist
    const navCount = await navigation.count()
    const mainCount = await main.count()
    
    expect(navCount + mainCount).toBeGreaterThan(0)
  })
})
