/**
 * OEC-001D Product Experience Remediation Tests
 *
 * Tests for UX improvements implemented in OEC-001D:
 * - UX-CRIT-001: alert() replaced with showToast() on customer-facing pages
 * - UX-PRE-001: alert() replaced with showToast() on admin/portal pages
 */

import fs from 'fs'
import path from 'path'

describe('OEC-001D Product Experience Remediation', () => {
  const srcDir = path.join(process.cwd(), 'src')

  // Helper: read a source file
  const readSrc = (relPath: string): string => {
    return fs.readFileSync(path.join(srcDir, relPath), 'utf-8')
  }

  describe('UX-CRIT-001: No alert() on customer-facing pages', () => {
    const customerFacingFiles = [
      'pages/dashboard/waiter.tsx',
      'pages/order/index.tsx',
      'pages/order/confirmation.tsx',
      'pages/store/cart.tsx',
      'pages/store/checkout.tsx',
      'pages/dashboard/partner.tsx',
      'pages/affiliate/index.tsx',
      'pages/refer/index.tsx',
      'pages/discover/feed.tsx',
      'pages/supplier/orders.tsx',
    ]

    customerFacingFiles.forEach((relPath) => {
      it(`${relPath} should not contain alert() calls`, () => {
        const content = readSrc(relPath)
        // Check no alert( calls (not showAlert, not showAlertBanner, etc.)
        const alertCalls = content.match(/\balert\s*\(/g)
        expect(alertCalls).toBeNull()
      })

      it(`${relPath} should import useToast from @/components/Toast`, () => {
        const content = readSrc(relPath)
        expect(content).toContain("useToast")
        expect(content).toContain("@/components/Toast")
      })
    })
  })

  describe('UX-PRE-001: No alert() on admin and portal pages', () => {
    const adminPortalFiles = [
      'pages/admin/founder-partners.tsx',
      'pages/admin/affiliates.tsx',
      'pages/admin/founder-codes.tsx',
      'pages/admin/operations-intelligence.tsx',
      'pages/admin/platform-fees.tsx',
      'pages/admin/partnership-applications/[id].tsx',
      'pages/portal/profile.tsx',
      'pages/portal/support.tsx',
      'pages/portal/campaigns.tsx',
    ]

    adminPortalFiles.forEach((relPath) => {
      it(`${relPath} should not contain alert() calls`, () => {
        const fullPath = path.join(srcDir, relPath)
        if (!fs.existsSync(fullPath)) {
          console.warn(`File not found: ${relPath}`)
          return
        }
        const content = readSrc(relPath)
        const alertCalls = content.match(/\balert\s*\(/g)
        expect(alertCalls).toBeNull()
      })
    })
  })

  describe('Toast system integration', () => {
    it('Toast component should exist at @/components/Toast', () => {
      const toastPath = path.join(srcDir, 'components', 'Toast.tsx')
      expect(fs.existsSync(toastPath)).toBe(true)
    })

    it('Toast component should export useToast hook', () => {
      const content = readSrc('components/Toast.tsx')
      expect(content).toContain('useToast')
      expect(content).toContain('showToast')
    })

    it('ToastProvider should wrap the app in _app.tsx', () => {
      const content = readSrc('pages/_app.tsx')
      expect(content).toContain('ToastProvider')
    })
  })

  describe('showToast usage patterns', () => {
    const allFixedFiles = [
      'pages/dashboard/waiter.tsx',
      'pages/order/index.tsx',
      'pages/order/confirmation.tsx',
      'pages/store/cart.tsx',
      'pages/store/checkout.tsx',
      'pages/dashboard/partner.tsx',
      'pages/affiliate/index.tsx',
      'pages/refer/index.tsx',
      'pages/discover/feed.tsx',
      'pages/supplier/orders.tsx',
      'pages/admin/founder-partners.tsx',
    ]

    allFixedFiles.forEach((relPath) => {
      it(`${relPath} should use showToast() instead of alert()`, () => {
        const content = readSrc(relPath)
        expect(content).toContain('showToast(')
        expect(content).not.toMatch(/\balert\s*\(/)
      })
    })
  })

  describe('Toast type usage', () => {
    it('waiter.tsx should use error toast for failures', () => {
      const content = readSrc('pages/dashboard/waiter.tsx')
      expect(content).toContain("showToast('error'")
    })

    it('order/index.tsx should use success toast for order confirmation', () => {
      const content = readSrc('pages/order/index.tsx')
      expect(content).toContain("showToast('success'")
    })

    it('store/checkout.tsx should use warning for validation and error for failures', () => {
      const content = readSrc('pages/store/checkout.tsx')
      expect(content).toContain("showToast('warning'")
      expect(content).toContain("showToast('error'")
    })

    it('store/cart.tsx should use warning for minimum order validation', () => {
      const content = readSrc('pages/store/cart.tsx')
      expect(content).toContain("showToast('warning'")
    })
  })
})
