/**
 * OEC-001B.1 Remediation Tests
 *
 * Tests for the security and reliability fixes applied in OEC-001B.1:
 * - SQL injection fix (qr-menu.plugin.ts)
 * - Zod validation on public mutation APIs
 * - Rate limiting on public endpoints
 */

describe('OEC-001B.1 Remediation Verification', () => {
  describe('SQL Injection Fix (qr-menu.plugin.ts)', () => {
    it('should not use $executeRawUnsafe in qr-menu plugin', () => {
      const fs = require('fs')
      const path = require('path')
      const pluginPath = path.join(__dirname, '../../src/lib/die/plugins/built-in/qr-menu.plugin.ts')
      const content = fs.readFileSync(pluginPath, 'utf-8')

      // Check that there are no actual $executeRawUnsafe() calls (not just comments mentioning it)
      const executeRawUnsafeCalls = content.match(/\$executeRawUnsafe\s*\(/g)
      expect(executeRawUnsafeCalls).toBeNull()
      // Verify parameterized $executeRaw is used instead
      expect(content).toContain('$executeRaw`')
    })
  })

  describe('Public Order Confirm API Validation', () => {
    it('should use Zod schema for input validation', () => {
      const fs = require('fs')
      const path = require('path')
      const apiPath = path.join(__dirname, '../../src/pages/api/public/order/confirm.ts')
      const content = fs.readFileSync(apiPath, 'utf-8')

      expect(content).toContain('z.object')
      expect(content).toContain('safeParse')
      expect(content).toContain('withRateLimit')
      expect(content).toContain('withCsrf')
    })
  })

  describe('Waiter Calls API Validation', () => {
    it('should use Zod schema for input validation', () => {
      const fs = require('fs')
      const path = require('path')
      const apiPath = path.join(__dirname, '../../src/pages/api/waiter-calls/index.ts')
      const content = fs.readFileSync(apiPath, 'utf-8')

      expect(content).toContain('z.object')
      expect(content).toContain('safeParse')
      expect(content).toContain('withRateLimit')
      expect(content).toContain('withCsrf')
      expect(content).toContain("z.enum(['water', 'assistance', 'bill', 'other'])")
    })
  })

  describe('Public Menu API Rate Limiting', () => {
    it('should have rate limiting applied', () => {
      const fs = require('fs')
      const path = require('path')
      const apiPath = path.join(__dirname, '../../src/pages/api/public/menu.ts')
      const content = fs.readFileSync(apiPath, 'utf-8')

      expect(content).toContain('withRateLimit')
    })
  })

  describe('SVG Sanitizer (qr-builder.tsx)', () => {
    it('should import and use sanitizeSvg', () => {
      const fs = require('fs')
      const path = require('path')
      const pagePath = path.join(__dirname, '../../src/pages/dashboard/qr-builder.tsx')
      const content = fs.readFileSync(pagePath, 'utf-8')

      expect(content).toContain('sanitizeSvg')
      expect(content).toContain('escapeSvgValue')
    })

    it('should have a sanitizer utility module', () => {
      const fs = require('fs')
      const path = require('path')
      const sanitizerPath = path.join(__dirname, '../../src/lib/security/svg-sanitizer.ts')
      expect(fs.existsSync(sanitizerPath)).toBe(true)

      const content = fs.readFileSync(sanitizerPath, 'utf-8')
      expect(content).toContain('export function sanitizeSvg')
      expect(content).toContain('export function escapeSvgValue')
    })
  })

  describe('CSRF Middleware', () => {
    it('should have a CSRF middleware module', () => {
      const fs = require('fs')
      const path = require('path')
      const csrfPath = path.join(__dirname, '../../src/lib/middleware/csrf.ts')
      expect(fs.existsSync(csrfPath)).toBe(true)

      const content = fs.readFileSync(csrfPath, 'utf-8')
      expect(content).toContain('export function withCsrf')
      expect(content).toContain('CSRF_VALIDATION_FAILED')
    })
  })

  describe('Cron Job N+1 Fix', () => {
    it('subscription-reminders should use batched Promise.allSettled', () => {
      const fs = require('fs')
      const path = require('path')
      const cronPath = path.join(__dirname, '../../src/pages/api/cron/subscription-reminders.ts')
      const content = fs.readFileSync(cronPath, 'utf-8')

      expect(content).toContain('Promise.allSettled')
      expect(content).toContain('BATCH_SIZE')
    })

    it('cron.ts should use updateMany for trial status updates', () => {
      const fs = require('fs')
      const path = require('path')
      const cronPath = path.join(__dirname, '../../src/lib/cron.ts')
      const content = fs.readFileSync(cronPath, 'utf-8')

      expect(content).toContain('updateMany')
      expect(content).toContain('eligibleBusinessIds')
    })

    it('cron.ts should use batched Promise.allSettled for forfeits', () => {
      const fs = require('fs')
      const path = require('path')
      const cronPath = path.join(__dirname, '../../src/lib/cron.ts')
      const content = fs.readFileSync(cronPath, 'utf-8')

      expect(content).toContain('FORFEIT_BATCH_SIZE')
      expect(content).toContain('Promise.allSettled')
    })

    it('cron.ts should use batched Promise.allSettled for daily reports', () => {
      const fs = require('fs')
      const path = require('path')
      const cronPath = path.join(__dirname, '../../src/lib/cron.ts')
      const content = fs.readFileSync(cronPath, 'utf-8')

      expect(content).toContain('REPORT_BATCH_SIZE')
    })
  })

  describe('Unbounded Query Limits', () => {
    it('portal dashboard should have take limits on commission queries', () => {
      const fs = require('fs')
      const path = require('path')
      const portalPath = path.join(__dirname, '../../src/pages/api/portal/index.ts')
      const content = fs.readFileSync(portalPath, 'utf-8')

      // Check that the 6-month trend queries have take limits
      expect(content).toContain('take: 10000')
    })

    it('partnership-operational-query should have take limits on event queries', () => {
      const fs = require('fs')
      const path = require('path')
      const servicePath = path.join(__dirname, '../../src/lib/services/partnership-operational-query.service.ts')
      const content = fs.readFileSync(servicePath, 'utf-8')

      // Check that unbounded queries now have take limits
      expect(content).toContain('take: 50')
      expect(content).toContain('take: 100')
    })
  })
})
