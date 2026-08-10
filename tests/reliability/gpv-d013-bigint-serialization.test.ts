/**
 * GPV-D013 Regression Tests — BigInt JSON Serialization
 *
 * Verifies that BigInt values (e.g., Business.storageUsedBytes) can be
 * serialized to JSON without throwing "Do not know how to serialize a BigInt".
 *
 * The fix adds BigInt.prototype.toJSON in src/lib/prisma.ts, which converts
 * BigInt to its string representation for JSON serialization.
 *
 * Tests cover:
 *   - BigInt values serialize to JSON without error
 *   - BigInt values serialize to string representation
 *   - Business object with storageUsedBytes serializes correctly
 *   - Supplier order with business relation serializes correctly
 *   - null BigInt values serialize correctly
 *   - 0 BigInt values serialize correctly
 *   - Large BigInt values serialize correctly
 *   - Nested objects with BigInt serialize correctly
 *   - Arrays of objects with BigInt serialize correctly
 *   - JSON.stringify of response-like objects works end-to-end
 */

// Import prisma to trigger the BigInt.prototype.toJSON patch
import { prisma } from '@/lib/prisma'

// ─── Tests: BigInt Serialization ─────────────────────────────────────────────

describe('GPV-D013: BigInt JSON Serialization', () => {
  describe('Basic BigInt serialization', () => {
    it('should serialize a BigInt value without throwing', () => {
      const value = BigInt(123456789)
      expect(() => JSON.stringify(value)).not.toThrow()
    })

    it('should serialize BigInt to string representation', () => {
      const value = BigInt(123456789)
      const json = JSON.stringify(value)
      expect(json).toBe('"123456789"')
    })

    it('should serialize BigInt(0) correctly', () => {
      const value = BigInt(0)
      const json = JSON.stringify(value)
      expect(json).toBe('"0"')
    })

    it('should serialize very large BigInt correctly', () => {
      const value = BigInt('9007199254740993') // Larger than Number.MAX_SAFE_INTEGER
      const json = JSON.stringify(value)
      expect(json).toBe('"9007199254740993"')
    })

    it('should serialize BigInt inside an object', () => {
      const obj = { id: 'biz-1', storageUsedBytes: BigInt(1024) }
      const json = JSON.stringify(obj)
      const parsed = JSON.parse(json)
      expect(parsed.storageUsedBytes).toBe('1024')
    })

    it('should serialize BigInt inside a nested object', () => {
      const obj = {
        id: 'order-1',
        orderNumber: 'SUP-001',
        business: {
          id: 'biz-1',
          name: 'Test Restaurant',
          storageUsedBytes: BigInt(2048),
        },
      }
      const json = JSON.stringify(obj)
      const parsed = JSON.parse(json)
      expect(parsed.business.storageUsedBytes).toBe('2048')
    })

    it('should serialize BigInt inside an array of objects', () => {
      const arr = [
        { id: 'biz-1', storageUsedBytes: BigInt(100) },
        { id: 'biz-2', storageUsedBytes: BigInt(200) },
      ]
      const json = JSON.stringify(arr)
      const parsed = JSON.parse(json)
      expect(parsed[0].storageUsedBytes).toBe('100')
      expect(parsed[1].storageUsedBytes).toBe('200')
    })
  })

  describe('Business model with storageUsedBytes', () => {
    it('should serialize a Business object with storageUsedBytes', () => {
      const business = {
        id: 'biz-d013-1',
        name: 'Test Restaurant',
        currency: 'RWF',
        storageUsedBytes: BigInt(5242880), // 5MB
        phone: '+250788000000',
        whatsappNumber: null,
      }
      expect(() => JSON.stringify(business)).not.toThrow()
      const json = JSON.stringify(business)
      const parsed = JSON.parse(json)
      expect(parsed.id).toBe('biz-d013-1')
      expect(parsed.storageUsedBytes).toBe('5242880')
    })

    it('should serialize a Business with storageUsedBytes = 0', () => {
      const business = {
        id: 'biz-d013-2',
        storageUsedBytes: BigInt(0),
      }
      const json = JSON.stringify(business)
      const parsed = JSON.parse(json)
      expect(parsed.storageUsedBytes).toBe('0')
    })
  })

  describe('Supplier order with business relation (the GPV-D013 scenario)', () => {
    it('should serialize a supplier order list response with business', () => {
      // Simulate the response from GET /api/supplier/orders
      const orders = [
        {
          id: 'so-1',
          orderNumber: 'SUP-001',
          status: 'PENDING',
          totalAmountCents: 50000,
          supplier: { id: 'sup-1', name: 'Test Supplier' },
          business: {
            id: 'biz-1',
            name: 'Test Restaurant',
            storageUsedBytes: BigInt(1048576),
          },
          items: [
            {
              id: 'item-1',
              quantity: 10,
              unitPriceCents: 5000,
              product: { id: 'prod-1', name: 'Flour' },
            },
          ],
        },
      ]

      expect(() => JSON.stringify(orders)).not.toThrow()
      const json = JSON.stringify(orders)
      const parsed = JSON.parse(json)
      expect(parsed[0].business.storageUsedBytes).toBe('1048576')
      expect(parsed[0].items[0].product.name).toBe('Flour')
    })

    it('should serialize a supplier order deliver response with business', () => {
      // Simulate the response from POST /api/supplier/orders/[id]/deliver
      const response = {
        success: true,
        order: {
          id: 'so-1',
          orderNumber: 'SUP-001',
          status: 'DELIVERED',
          updatedAt: new Date().toISOString(),
          business: {
            id: 'biz-1',
            name: 'Test Restaurant',
            storageUsedBytes: BigInt(2097152),
            phone: '+250788000000',
            whatsappNumber: '+250788000000',
          },
        },
      }

      expect(() => JSON.stringify(response)).not.toThrow()
      const json = JSON.stringify(response)
      const parsed = JSON.parse(json)
      expect(parsed.success).toBe(true)
      expect(parsed.order.business.storageUsedBytes).toBe('2097152')
    })

    it('should serialize multiple supplier orders with different BigInt values', () => {
      const orders = [
        {
          id: 'so-1',
          business: { id: 'biz-1', storageUsedBytes: BigInt(0) },
        },
        {
          id: 'so-2',
          business: { id: 'biz-2', storageUsedBytes: BigInt(999999999999) },
        },
        {
          id: 'so-3',
          business: { id: 'biz-3', storageUsedBytes: BigInt(123456789) },
        },
      ]

      const json = JSON.stringify(orders)
      const parsed = JSON.parse(json)
      expect(parsed[0].business.storageUsedBytes).toBe('0')
      expect(parsed[1].business.storageUsedBytes).toBe('999999999999')
      expect(parsed[2].business.storageUsedBytes).toBe('123456789')
    })
  })

  describe('Other BigInt fields (no regression)', () => {
    it('should serialize PaymentTransaction with webhookTimestamp BigInt', () => {
      const txn = {
        id: 'pt-1',
        amountCents: 11800,
        webhookTimestamp: BigInt(1691510400000),
      }
      expect(() => JSON.stringify(txn)).not.toThrow()
      const json = JSON.stringify(txn)
      const parsed = JSON.parse(json)
      expect(parsed.webhookTimestamp).toBe('1691510400000')
    })

    it('should serialize null BigInt field correctly', () => {
      const txn = {
        id: 'pt-2',
        webhookTimestamp: null,
      }
      const json = JSON.stringify(txn)
      const parsed = JSON.parse(json)
      expect(parsed.webhookTimestamp).toBeNull()
    })

    it('should serialize DailyMetrics with totalRevenueCents BigInt', () => {
      const metrics = {
        id: 'dm-1',
        date: '2026-08-08',
        totalRevenueCents: BigInt(5000000),
      }
      expect(() => JSON.stringify(metrics)).not.toThrow()
      const json = JSON.stringify(metrics)
      const parsed = JSON.parse(json)
      expect(parsed.totalRevenueCents).toBe('5000000')
    })
  })

  describe('JSON.stringify does not throw on complex nested structures', () => {
    it('should handle deeply nested objects with BigInt at multiple levels', () => {
      const complex = {
        level1: {
          level2: {
            level3: {
              business: {
                storageUsedBytes: BigInt(999999),
              },
            },
          },
        },
        direct: BigInt(42),
      }

      expect(() => JSON.stringify(complex)).not.toThrow()
      const json = JSON.stringify(complex)
      const parsed = JSON.parse(json)
      expect(parsed.level1.level2.level3.business.storageUsedBytes).toBe('999999')
      expect(parsed.direct).toBe('42')
    })
  })
})
