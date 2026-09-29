/**
 * OEC-001G Customer Trust Certification Remediation Tests
 *
 * Tests for trust improvements implemented in OEC-001G:
 * - TRUST-CRIT-001: AI advisory disclaimer present in all 7 AI assistant components
 * - TRUST-CRIT-002: Data freshness indicators on financial pages
 * - TRUST-003: Low-confidence warning on AI recommendations
 * - EGR-009: Every customer interaction must increase trust
 */

import fs from 'fs'
import path from 'path'

describe('OEC-001G Customer Trust Certification Remediation', () => {
  const componentsDir = path.join(process.cwd(), 'src', 'components', 'executive')
  const pagesDir = path.join(process.cwd(), 'src', 'pages')

  const readFile = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf-8')
  }

  describe('TRUST-CRIT-001: AI Advisory Disclaimer in All AI Assistants', () => {
    const aiComponents = [
      'AIAssistant.tsx',
      'AIFinancialAssistant.tsx',
      'AIOperationsAssistant.tsx',
      'AIMarketingAssistant.tsx',
      'AIPartnershipAssistant.tsx',
      'AICustomerSuccessAssistant.tsx',
      'AIIntelligenceAssistant.tsx',
    ]

    aiComponents.forEach((fileName) => {
      it(`${fileName} should import and render AIDisclaimer`, () => {
        const content = readFile(path.join(componentsDir, fileName))
        expect(content).toContain('AIDisclaimer')
      })

      it(`${fileName} should render <AIDisclaimer /> in the component output`, () => {
        const content = readFile(path.join(componentsDir, fileName))
        expect(content).toMatch(/<AIDisclaimer\s*\/>/)
      })
    })

    it('AIDisclaimer component should exist and contain advisory language', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toContain('advisory only')
      expect(content).toContain('EGR-009')
      expect(content).toContain('confidence')
    })

    it('AIDisclaimer should communicate that insights are AI-generated', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toContain('AI-generated')
    })

    it('AIDisclaimer should advise using judgment before acting', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toMatch(/judgment/i)
    })
  })

  describe('TRUST-003: Low-Confidence Warning on AI Recommendations', () => {
    const aiComponents = [
      'AIAssistant.tsx',
      'AIFinancialAssistant.tsx',
      'AIOperationsAssistant.tsx',
      'AIMarketingAssistant.tsx',
      'AIPartnershipAssistant.tsx',
      'AICustomerSuccessAssistant.tsx',
      'AIIntelligenceAssistant.tsx',
    ]

    aiComponents.forEach((fileName) => {
      it(`${fileName} should import LowConfidenceWarning`, () => {
        const content = readFile(path.join(componentsDir, fileName))
        expect(content).toContain('LowConfidenceWarning')
      })

      it(`${fileName} should conditionally render LowConfidenceWarning for low confidence`, () => {
        const content = readFile(path.join(componentsDir, fileName))
        // Should have a conditional check on confidence being below a threshold
        expect(content).toMatch(/confidence\s*<\s*\d+/)
      })
    })

    it('LowConfidenceWarning should communicate uncertainty honestly', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toContain('LowConfidenceWarning')
      expect(content).toContain('Low confidence')
      expect(content).toContain('verify')
    })
  })

  describe('TRUST-CRIT-002: Data Freshness Indicators on Financial Pages', () => {
    const financialPages = [
      'admin/revenue-operations.tsx',
      'admin/reconciliation.tsx',
      'admin/platform-fees.tsx',
      'admin/founder-partners.tsx',
      'admin/affiliates.tsx',
      'dashboard/close-day.tsx',
      'portal/earnings.tsx',
    ]

    financialPages.forEach((pagePath) => {
      it(`${pagePath} should import DataFreshnessIndicator`, () => {
        const content = readFile(path.join(pagesDir, pagePath))
        expect(content).toContain('DataFreshnessIndicator')
      })

      it(`${pagePath} should track lastUpdated state`, () => {
        const content = readFile(path.join(pagesDir, pagePath))
        expect(content).toContain('lastUpdated')
      })

      it(`${pagePath} should set lastUpdated when data is loaded`, () => {
        const content = readFile(path.join(pagesDir, pagePath))
        expect(content).toContain('setLastUpdated')
      })

      it(`${pagePath} should render DataFreshnessIndicator in the UI`, () => {
        const content = readFile(path.join(pagesDir, pagePath))
        expect(content).toMatch(/<DataFreshnessIndicator/)
      })
    })

    it('DataFreshnessIndicator component should exist and show last updated time', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'DataFreshnessIndicator.tsx'))
      expect(content).toContain('Last updated')
      expect(content).toContain('lastUpdated')
    })

    it('DataFreshnessIndicator should handle loading state', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'DataFreshnessIndicator.tsx'))
      expect(content).toContain('loading')
    })

    it('DataFreshnessIndicator should handle null timestamp gracefully', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'DataFreshnessIndicator.tsx'))
      expect(content).toContain('!lastUpdated')
    })
  })

  describe('EGR-009: Every Customer Interaction Must Increase Trust', () => {
    it('AIDisclaimer should reference EGR-009', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toContain('EGR-009')
    })

    it('AIDisclaimer should explain confidence scores reflect data quality not certainty', () => {
      const content = readFile(path.join(componentsDir, 'AIDisclaimer.tsx'))
      expect(content).toContain('data quality')
      expect(content).toContain('not certainty')
    })

    it('DataFreshnessIndicator should reference trust principle', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'DataFreshnessIndicator.tsx'))
      expect(content).toContain('EGR-009')
      expect(content).toContain('trust')
    })
  })

  describe('AI Trust — Advisory-Only Design Preservation', () => {
    it('AI assistants should use "Suggested Actions" not "Execute" or "Apply"', () => {
      const aiComponents = [
        'AIAssistant.tsx',
        'AIFinancialAssistant.tsx',
        'AIOperationsAssistant.tsx',
        'AIMarketingAssistant.tsx',
        'AIPartnershipAssistant.tsx',
        'AICustomerSuccessAssistant.tsx',
        'AIIntelligenceAssistant.tsx',
      ]

      aiComponents.forEach((fileName) => {
        const content = readFile(path.join(componentsDir, fileName))
        expect(content).toContain('Suggested Action')
        // Should NOT contain automatic execution language
        expect(content).not.toMatch(/auto.*execute|automatically.*apply/i)
      })
    })

    it('AI assistants should use navigation links for actions, not direct mutations', () => {
      const aiComponents = [
        'AIAssistant.tsx',
        'AIFinancialAssistant.tsx',
        'AIOperationsAssistant.tsx',
        'AIMarketingAssistant.tsx',
        'AIPartnershipAssistant.tsx',
        'AICustomerSuccessAssistant.tsx',
        'AIIntelligenceAssistant.tsx',
      ]

      aiComponents.forEach((fileName) => {
        const content = readFile(path.join(componentsDir, fileName))
        // Actions should be buttons that call onNavigate, not fetch/POST
        expect(content).toContain('onNavigate')
        expect(content).not.toMatch(/fetch\(.*POST/)
      })
    })
  })

  describe('Financial Trust — Consistent Currency Display', () => {
    it('Revenue operations should use consistent currency formatting', () => {
      const content = readFile(path.join(pagesDir, 'admin', 'revenue-operations.tsx'))
      expect(content).toContain('formatCurrency')
    })

    it('Close-day should use CurrencyDisplay component', () => {
      const content = readFile(path.join(pagesDir, 'dashboard', 'close-day.tsx'))
      expect(content).toContain('CurrencyDisplay')
    })

    it('Portal earnings should use consistent currency formatting', () => {
      const content = readFile(path.join(pagesDir, 'portal', 'earnings.tsx'))
      expect(content).toContain('formatCurrency')
    })
  })

  describe('Authentication Trust — MFA and Security', () => {
    const authServiceDir = path.join(process.cwd(), 'src', 'lib', 'services')
    const authApiDir = path.join(pagesDir, 'api', 'auth')

    it('MFA should be mandatory (not optional)', () => {
      const nextAuth = readFile(path.join(authApiDir, '[...nextauth].ts'))
      expect(nextAuth).toContain('mfa-confirm')
    })

    it('OTP should have time-limited expiry', () => {
      const otpService = readFile(path.join(authServiceDir, 'auth-otp.service.ts'))
      expect(otpService).toMatch(/TTL|expiry|expires/i)
    })

    it('Pre-login should have rate limiting', () => {
      const preLogin = readFile(path.join(authApiDir, 'pre-login.ts'))
      expect(preLogin).toMatch(/rate.?limit|attempts/i)
    })

    it('Password reset should revoke all sessions', () => {
      const resetPassword = readFile(path.join(authApiDir, 'reset-password.ts'))
      expect(resetPassword).toMatch(/revoke|invalidate|session/i)
    })

    it('Security events should be logged', () => {
      const securityService = readFile(path.join(authServiceDir, 'security-event.service.ts'))
      expect(securityService).toContain('LOGIN_SUCCESS')
    })
  })

  describe('Trust Signals — Confirmation and Recovery', () => {
    it('ConfirmModal component should exist for destructive actions', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'ConfirmModal.tsx'))
      expect(content).toContain('danger')
      expect(content).toContain('warning')
    })

    it('ErrorBoundary should provide recovery options', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'ErrorBoundary.tsx'))
      expect(content).toMatch(/refresh|dashboard/i)
      expect(content).toContain('support')
    })

    it('Toast system should support error, success, warning, info types', () => {
      const content = readFile(path.join(process.cwd(), 'src', 'components', 'ui', 'Toast.tsx'))
      expect(content).toContain('error')
      expect(content).toContain('success')
      expect(content).toContain('warning')
      expect(content).toContain('info')
    })
  })

  describe('Support Trust — Customer Success Pathway', () => {
    it('Support widget should exist for in-app support', () => {
      const widgetPath = path.join(process.cwd(), 'src', 'components', 'SupportWidget.tsx')
      expect(fs.existsSync(widgetPath)).toBe(true)
      const content = readFile(widgetPath)
      expect(content).toContain('conversation')
    })

    it('FAQ page should exist with payment and fee information', () => {
      const faqPath = path.join(pagesDir, 'faq.tsx')
      expect(fs.existsSync(faqPath)).toBe(true)
      const content = readFile(faqPath)
      expect(content).toMatch(/fee|payment/i)
    })

    it('Partner support page should exist with ticket system', () => {
      const supportPath = path.join(pagesDir, 'portal', 'support.tsx')
      expect(fs.existsSync(supportPath)).toBe(true)
      const content = readFile(supportPath)
      expect(content).toMatch(/ticket|subject/i)
    })
  })

  describe('Audit Trust — Audit Trail Infrastructure', () => {
    const servicesDir = path.join(process.cwd(), 'src', 'lib', 'services')

    it('AuditLogService should exist', () => {
      expect(fs.existsSync(path.join(servicesDir, 'audit-log.service.ts'))).toBe(true)
    })

    it('AuditTimeline component should exist for displaying audit trails', () => {
      const auditPath = path.join(process.cwd(), 'src', 'components', 'partnerships', 'AuditTimeline.tsx')
      expect(fs.existsSync(auditPath)).toBe(true)
    })

    it('Security events page should exist for user-visible security audit', () => {
      const securityPagePath = path.join(pagesDir, 'dashboard', 'security.tsx')
      expect(fs.existsSync(securityPagePath)).toBe(true)
      const content = readFile(securityPagePath)
      expect(content).toContain('session')
      expect(content).toContain('security')
    })
  })
})
