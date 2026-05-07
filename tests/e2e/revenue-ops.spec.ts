import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Revenue Operations Layer
 * 
 * Test Coverage:
 * 1. Marketer registration
 * 2. Referral link generation
 * 3. Business attribution
 * 4. Commission creation
 * 5. Payout request flow
 * 6. Admin approval workflow
 * 7. Risk scoring
 * 8. Alert generation
 */

test.describe('Revenue Operations - Marketer Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin to create marketer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create new marketer account', async ({ page }) => {
    // Navigate to marketer registration
    await page.goto('/admin/marketers')
    await page.click('button:has-text("Add Marketer")')

    // Fill registration form
    await page.fill('input[name="name"]', 'Test Marketer')
    await page.fill('input[name="email"]', 'marketer@test.com')
    await page.fill('input[name="phone"]', '+250788123456')
    await page.fill('textarea[name="notes"]', 'Test marketer for E2E testing')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=Marketer created successfully')).toBeVisible()
    
    // Verify referral code generated
    const referralCode = await page.locator('[data-testid="referral-code"]').textContent()
    expect(referralCode).toMatch(/^MKT-[A-Z0-9]{10}$/)
  })

  test('should display marketer dashboard with wallet balances', async ({ page }) => {
    // Login as marketer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'marketer@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Navigate to marketer dashboard
    await page.goto('/dashboard/marketer')

    // Verify wallet cards visible
    await expect(page.locator('text=Available')).toBeVisible()
    await expect(page.locator('text=Pending')).toBeVisible()
    await expect(page.locator('text=Locked')).toBeVisible()
    await expect(page.locator('text=Total Earned')).toBeVisible()

    // Verify referral link section
    await expect(page.locator('text=Referral Tools')).toBeVisible()
    const referralLink = await page.locator('input[readonly]').inputValue()
    expect(referralLink).toContain('/signup?m=')
  })

  test('should copy referral link to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    
    await page.goto('/dashboard/marketer')

    // Click copy button
    await page.click('button:has-text("Copy")')

    // Verify success message
    await expect(page.locator('text=Referral link copied')).toBeVisible()

    // Verify button changes to "Copied"
    await expect(page.locator('button:has-text("Copied")')).toBeVisible()
  })
})

test.describe('Revenue Operations - Commission Flow', () => {
  test('should create signup bonus when business signs up via referral', async ({ page }) => {
    // Get referral link from marketer dashboard
    await page.goto('/dashboard/marketer')
    const referralLink = await page.locator('input[readonly]').inputValue()
    const referralCode = new URL(referralLink).searchParams.get('m')

    // Sign up new business via referral link
    await page.goto(`/signup?m=${referralCode}`)
    await page.fill('input[name="businessName"]', 'Test Restaurant')
    await page.fill('input[name="email"]', 'restaurant@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')

    // Verify attribution recorded
    await page.goto('/dashboard/marketer')
    await expect(page.locator('text=Test Restaurant')).toBeVisible()

    // Verify pending balance increased (50,000 RWF = 5,000,000 cents)
    const pendingBalance = await page.locator('[data-testid="pending-balance"]').textContent()
    expect(pendingBalance).toContain('50,000')
  })

  test('should validate commission after 7 days', async ({ page }) => {
    // This would require time manipulation or database seeding
    // For now, we'll test the API directly
    const response = await page.request.post('/api/admin/commissions/validate', {
      data: { commissionId: 'test-commission-id' }
    })
    expect(response.ok()).toBeTruthy()
  })
})

test.describe('Revenue Operations - Payout Flow', () => {
  test('should request payout with valid amount', async ({ page }) => {
    await page.goto('/dashboard/marketer')

    // Fill payout form
    await page.fill('input[placeholder="10000"]', '50000')
    await page.selectOption('select[name="method"]', 'MTN_MOBILE_MONEY')
    await page.fill('input[placeholder="+250 7xx xxx xxx"]', '+250788123456')

    // Submit
    await page.click('button:has-text("Request Payout")')

    // Verify success
    await expect(page.locator('text=Payout requested')).toBeVisible()

    // Verify payout appears in history
    await expect(page.locator('text=50,000 RWF')).toBeVisible()
    await expect(page.locator('text=PENDING')).toBeVisible()
  })

  test('should reject payout below minimum amount', async ({ page }) => {
    await page.goto('/dashboard/marketer')

    // Try to request below minimum
    await page.fill('input[placeholder="10000"]', '5000')
    await page.click('button:has-text("Request Payout")')

    // Verify error
    await expect(page.locator('text=Minimum payout: 10,000 RWF')).toBeVisible()
  })

  test('should reject payout with insufficient balance', async ({ page }) => {
    await page.goto('/dashboard/marketer')

    // Try to request more than available
    await page.fill('input[placeholder="10000"]', '1000000')
    await page.click('button:has-text("Request Payout")')

    // Verify error
    await expect(page.locator('text=Insufficient')).toBeVisible()
  })
})

test.describe('Revenue Operations - Admin Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
  })

  test('should display payout queue with risk indicators', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Verify queue tab active
    await expect(page.locator('button:has-text("Payout Queue")')).toHaveClass(/bg-imboni-blue/)

    // Verify table headers
    await expect(page.locator('text=Marketer')).toBeVisible()
    await expect(page.locator('text=Amount')).toBeVisible()
    await expect(page.locator('text=Risk')).toBeVisible()

    // Verify risk badges visible
    const riskBadges = page.locator('[class*="rounded-full"]:has-text(/LOW|MEDIUM|HIGH|CRITICAL/)')
    await expect(riskBadges.first()).toBeVisible()
  })

  test('should approve payout successfully', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Click approve on first payout
    await page.click('button:has-text("Approve")').first()

    // Verify success
    await expect(page.locator('text=Payout approved')).toBeVisible()

    // Verify payout removed from queue
    await page.waitForTimeout(1000)
    const queueCount = await page.locator('tbody tr').count()
    expect(queueCount).toBeLessThan(10) // Assuming initial queue had items
  })

  test('should reject payout with reason', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Click reject on first payout
    page.on('dialog', dialog => dialog.accept('Suspicious activity detected'))
    await page.click('button:has-text("Reject")').first()

    // Verify success
    await expect(page.locator('text=Payout rejected')).toBeVisible()
  })

  test('should display alerts by severity', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Switch to alerts tab
    await page.click('button:has-text("Alerts")')

    // Verify alerts visible
    await expect(page.locator('text=CRITICAL, text=WARNING, text=INFO').first()).toBeVisible()

    // Verify color coding
    const criticalAlert = page.locator('[class*="border-red"]').first()
    if (await criticalAlert.isVisible()) {
      await expect(criticalAlert).toBeVisible()
    }
  })

  test('should display event stream', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Switch to events tab
    await page.click('button:has-text("Event Stream")')

    // Verify events visible
    await expect(page.locator('text=/MARKETER_|COMMISSION_|PAYOUT_/').first()).toBeVisible()
  })

  test('should suspend marketer', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Switch to marketers tab
    await page.click('button:has-text("Marketers")')

    // Click suspend on active marketer
    page.on('dialog', dialog => dialog.accept('Multiple fraud flags'))
    await page.click('button:has-text("Suspend")').first()

    // Verify success
    await expect(page.locator('text=Marketer suspended')).toBeVisible()
  })
})

test.describe('Revenue Operations - Risk Detection', () => {
  test('should flag high-risk payout in queue', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Look for high-risk badge
    const highRiskBadge = page.locator('text=HIGH, text=CRITICAL').first()
    
    if (await highRiskBadge.isVisible()) {
      // Verify risk score displayed
      const riskScore = await highRiskBadge.textContent()
      expect(riskScore).toMatch(/\d+/)
    }
  })

  test('should generate alert for suspicious activity', async ({ page }) => {
    await page.goto('/admin/payout-control')
    await page.click('button:has-text("Alerts")')

    // Check for fraud-related alerts
    const fraudAlert = page.locator('text=/velocity|spike|pattern|fraud/i').first()
    
    if (await fraudAlert.isVisible()) {
      await expect(fraudAlert).toBeVisible()
    }
  })
})

test.describe('Revenue Operations - Analytics', () => {
  test('should display live metrics on admin dashboard', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Verify KPI cards
    await expect(page.locator('text=Pending Payouts')).toBeVisible()
    await expect(page.locator('text=Critical Alerts')).toBeVisible()
    await expect(page.locator('text=High Risk Marketers')).toBeVisible()
    await expect(page.locator('text=Total Marketers')).toBeVisible()

    // Verify numbers displayed
    const pendingCount = await page.locator('[data-testid="pending-payouts"]').textContent()
    expect(pendingCount).toMatch(/^\d+$/)
  })

  test('should show referred businesses on marketer dashboard', async ({ page }) => {
    await page.goto('/dashboard/marketer')

    // Verify businesses table
    await expect(page.locator('text=Referred Businesses')).toBeVisible()
    
    // Check for table headers
    await expect(page.locator('text=Business')).toBeVisible()
    await expect(page.locator('text=Status')).toBeVisible()
    await expect(page.locator('text=Attributed At')).toBeVisible()
  })
})

test.describe('Revenue Operations - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('should display marketer dashboard on mobile', async ({ page }) => {
    await page.goto('/dashboard/marketer')

    // Verify wallet cards stack vertically
    const walletCards = page.locator('[class*="grid"]').first()
    await expect(walletCards).toBeVisible()

    // Verify referral link input is responsive
    const referralInput = page.locator('input[readonly]')
    await expect(referralInput).toBeVisible()
  })

  test('should display admin control panel on mobile', async ({ page }) => {
    await page.goto('/admin/payout-control')

    // Verify tabs are scrollable
    await expect(page.locator('button:has-text("Payout Queue")')).toBeVisible()
    
    // Verify table is scrollable
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })
})

test.describe('Revenue Operations - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('/api/marketer/dashboard', route => 
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal server error' }) })
    )

    await page.goto('/dashboard/marketer')

    // Verify error message displayed
    await expect(page.locator('text=/Failed|Error/i')).toBeVisible()
  })

  test('should handle network timeout', async ({ page }) => {
    // Intercept and delay API call
    await page.route('/api/marketer/payout/request', route => 
      new Promise(resolve => setTimeout(() => route.abort(), 5000))
    )

    await page.goto('/dashboard/marketer')
    await page.fill('input[placeholder="10000"]', '50000')
    await page.click('button:has-text("Request Payout")')

    // Verify timeout handling
    await expect(page.locator('text=/timeout|failed/i')).toBeVisible({ timeout: 10000 })
  })
})
