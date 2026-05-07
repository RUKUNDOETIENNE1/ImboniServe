// E2E Authentication Tests
// Note: Install @playwright/test first: npm install -D @playwright/test

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page).toHaveTitle(/Imboni Serve/)
    await expect(page.locator('h1')).toContainText(/Sign In|Login/)
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button[type="submit"]')
    
    // Should show validation messages
    await expect(page.locator('text=required')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('text=Sign Up')
    
    await expect(page).toHaveURL(/signup/)
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in credentials (use test account)
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=/Invalid|Error|Failed/')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@imboniserve.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/dashboard/)
    
    // Logout
    await page.click('button:has-text("Logout")')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard')
    
    await expect(page).toHaveURL(/login/)
  })

  test('should redirect to login when accessing CRM without auth', async ({ page }) => {
    await page.goto('/dashboard/crm')
    
    await expect(page).toHaveURL(/login/)
  })

  test('should allow access to public pages', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Imboni Serve/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
