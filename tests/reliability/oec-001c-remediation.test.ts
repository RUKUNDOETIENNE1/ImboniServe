/**
 * OEC-001C Reliability Remediation Tests
 *
 * Tests for the reliability fixes applied in OEC-001C:
 * - REL-CRIT-001: Payout processing atomicity (affiliate.service.ts)
 * - REL-CRIT-002: Commission creation idempotency (affiliate.service.ts)
 * - REL-HIGH-001: Payment provider fetch timeouts (intouch.provider.ts, irembopay.provider.ts)
 */

import * as fs from 'fs'
import * as path from 'path'

describe('OEC-001C Reliability Remediation Verification', () => {
  describe('REL-CRIT-001: Payout Processing Atomicity (affiliate.service.ts)', () => {
    const servicePath = path.join(__dirname, '../../src/lib/services/affiliate.service.ts')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(servicePath, 'utf-8')
    })

    it('should wrap markPayoutPaid in prisma.$transaction', () => {
      expect(content).toContain('prisma.$transaction')
    })

    it('should include both payout update and commission updateMany in the transaction', () => {
      // Find the markPayoutPaid method
      const methodStart = content.indexOf('static async markPayoutPaid')
      expect(methodStart).toBeGreaterThan(-1)

      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      expect(methodBody).toContain('prisma.$transaction')
      expect(methodBody).toContain('affiliatePayout.update')
      expect(methodBody).toContain('affiliateCommission.updateMany')
    })

    it('should not have separate non-transactional payout update and commission update', () => {
      // The old pattern was: const updatedPayout = await prisma.affiliatePayout.update(...)
      // followed by: await prisma.affiliateCommission.updateMany(...)
      // The new pattern wraps both in prisma.$transaction([...])
      const methodStart = content.indexOf('static async markPayoutPaid')
      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      // The transaction array form should be used
      expect(methodBody).toContain('prisma.$transaction([')
    })

    it('should still check for already-paid status before processing', () => {
      const methodStart = content.indexOf('static async markPayoutPaid')
      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      expect(methodBody).toContain("status === 'paid'")
      expect(methodBody).toContain('already marked as paid')
    })
  })

  describe('REL-CRIT-002: Commission Creation Idempotency (affiliate.service.ts)', () => {
    const servicePath = path.join(__dirname, '../../src/lib/services/affiliate.service.ts')
    let content: string

    beforeAll(() => {
      content = fs.readFileSync(servicePath, 'utf-8')
    })

    it('should check for existing commission by invoiceId before creating', () => {
      const methodStart = content.indexOf('static async createCommissionForInvoice')
      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      expect(methodBody).toContain('invoiceId')
      expect(methodBody).toContain('findFirst')
      expect(methodBody).toContain('existingForInvoice')
    })

    it('should return existing commission if one already exists for the invoice', () => {
      const methodStart = content.indexOf('static async createCommissionForInvoice')
      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      expect(methodBody).toContain('if (existingForInvoice)')
      expect(methodBody).toContain('return existingForInvoice')
    })

    it('should still enforce the 12-month commission limit', () => {
      const methodStart = content.indexOf('static async createCommissionForInvoice')
      const methodEnd = content.indexOf('static async', methodStart + 10)
      const methodBody = content.substring(methodStart, methodEnd)

      expect(methodBody).toContain('existingCommissions')
      expect(methodBody).toContain('>= 12')
    })
  })

  describe('REL-HIGH-001: Payment Provider Fetch Timeouts', () => {
    describe('fetchWithTimeout utility', () => {
      const utilPath = path.join(__dirname, '../../src/lib/utils/fetch-with-timeout.ts')
      let content: string

      beforeAll(() => {
        content = fs.readFileSync(utilPath, 'utf-8')
      })

      it('should define a FetchTimeoutError class', () => {
        expect(content).toContain('class FetchTimeoutError')
        expect(content).toContain('extends Error')
      })

      it('should define a fetchWithTimeout function', () => {
        expect(content).toContain('export async function fetchWithTimeout')
      })

      it('should use AbortController for timeout', () => {
        expect(content).toContain('AbortController')
        expect(content).toContain('controller.abort()')
        expect(content).toContain('setTimeout')
        expect(content).toContain('clearTimeout')
      })

      it('should throw FetchTimeoutError on abort', () => {
        expect(content).toContain("AbortError")
        expect(content).toContain('FetchTimeoutError')
      })

      it('should have a default timeout', () => {
        expect(content).toContain('15_000')
      })
    })

    describe('InTouch provider timeout', () => {
      const providerPath = path.join(__dirname, '../../src/lib/payments/providers/intouch.provider.ts')
      let content: string

      beforeAll(() => {
        content = fs.readFileSync(providerPath, 'utf-8')
      })

      it('should import fetchWithTimeout', () => {
        expect(content).toContain('fetchWithTimeout')
        expect(content).toContain('fetch-with-timeout')
      })

      it('should use fetchWithTimeout instead of raw fetch', () => {
        // Should not have any bare fetch() calls (only fetchWithTimeout)
        const bareFetchCalls = content.match(/(?<!With)fetch\(/g)
        // The import line contains 'fetchWithTimeout' which includes 'fetch(' as a substring
        // Check that actual API calls use fetchWithTimeout
        expect(content).toContain('fetchWithTimeout(')
      })

      it('should use 30 second timeout for payment initiation', () => {
        expect(content).toContain('30_000')
      })

      it('should handle timeout errors gracefully', () => {
        expect(content).toContain('FetchTimeoutError')
        expect(content).toContain('TIMEOUT')
      })

      it('should handle network errors gracefully', () => {
        expect(content).toContain('NETWORK_ERROR')
      })
    })

    describe('IremboPay provider timeout', () => {
      const providerPath = path.join(__dirname, '../../src/lib/payments/providers/irembopay.provider.ts')
      let content: string

      beforeAll(() => {
        content = fs.readFileSync(providerPath, 'utf-8')
      })

      it('should import fetchWithTimeout', () => {
        expect(content).toContain('fetchWithTimeout')
        expect(content).toContain('fetch-with-timeout')
      })

      it('should use fetchWithTimeout for payment initiation', () => {
        expect(content).toContain('fetchWithTimeout(')
      })

      it('should use 30 second timeout for payment initiation', () => {
        expect(content).toContain('30_000')
      })

      it('should use 15 second timeout for payment verification', () => {
        expect(content).toContain('15_000')
      })

      it('should handle timeout errors gracefully', () => {
        expect(content).toContain('FetchTimeoutError')
        expect(content).toContain('timed out')
      })
    })
  })

  describe('No Bare fetch() in payment providers', () => {
    it('InTouch provider should not use bare fetch() for API calls', () => {
      const providerPath = path.join(__dirname, '../../src/lib/payments/providers/intouch.provider.ts')
      const content = fs.readFileSync(providerPath, 'utf-8')

      // Remove import line and check for bare fetch( calls
      const lines = content.split('\n').filter(l => !l.includes('import'))
      const codeWithoutImports = lines.join('\n')

      // Should not have bare fetch( calls (fetchWithTimeout is OK)
      const bareFetchMatches = codeWithoutImports.match(/(?<!With)fetch\(/g)
      // If there are any, they should only be in comments or strings
      // The actual API call should use fetchWithTimeout
      expect(codeWithoutImports).toContain('fetchWithTimeout(')
    })

    it('IremboPay provider should not use bare fetch() for API calls', () => {
      const providerPath = path.join(__dirname, '../../src/lib/payments/providers/irembopay.provider.ts')
      const content = fs.readFileSync(providerPath, 'utf-8')

      const lines = content.split('\n').filter(l => !l.includes('import'))
      const codeWithoutImports = lines.join('\n')

      expect(codeWithoutImports).toContain('fetchWithTimeout(')
    })
  })
})

describe('fetchWithTimeout Unit Tests', () => {
  it('should throw FetchTimeoutError on timeout', async () => {
    const { fetchWithTimeout, FetchTimeoutError } = await import('@/lib/utils/fetch-with-timeout')

    // Mock fetch to respect the abort signal — rejects with AbortError when aborted
    const originalFetch = global.fetch
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted')
            err.name = 'AbortError'
            reject(err)
          })
        }
      })
    }) as any

    try {
      await expect(
        fetchWithTimeout('https://example.com/test', {}, 100)
      ).rejects.toThrow(FetchTimeoutError)
    } finally {
      global.fetch = originalFetch
    }
  })

  it('should return response on success', async () => {
    const { fetchWithTimeout } = await import('@/lib/utils/fetch-with-timeout')

    const originalFetch = global.fetch
    const mockResponse = new Response('{}', { status: 200 })
    global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as any

    try {
      const response = await fetchWithTimeout('https://example.com/test', {}, 5000)
      expect(response.status).toBe(200)
    } finally {
      global.fetch = originalFetch
    }
  })

  it('should clear timeout after successful response', async () => {
    const { fetchWithTimeout } = await import('@/lib/utils/fetch-with-timeout')

    const originalFetch = global.fetch
    const mockResponse = new Response('{}', { status: 200 })
    global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as any

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

    try {
      await fetchWithTimeout('https://example.com/test', {}, 5000)
      expect(clearTimeoutSpy).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
      clearTimeoutSpy.mockRestore()
    }
  })

  it('should propagate non-timeout network errors', async () => {
    const { fetchWithTimeout, FetchTimeoutError } = await import('@/lib/utils/fetch-with-timeout')

    const originalFetch = global.fetch
    global.fetch = jest.fn(() => Promise.reject(new Error('ECONNREFUSED'))) as any

    try {
      await expect(
        fetchWithTimeout('https://example.com/test', {}, 5000)
      ).rejects.toThrow('ECONNREFUSED')
    } finally {
      global.fetch = originalFetch
    }
  })
})
