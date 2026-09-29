/**
 * P0 REGRESSION: QR signature consistency
 *
 * generateURL signs `tableId || seatId || outletId`; the token endpoint must
 * validate with the same precedence or seat-only/outlet-only QRs 401 forever.
 * The QR builder must never encode an unsigned /order URL.
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    orderToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    business: { findUnique: jest.fn() },
    table: { findFirst: jest.fn() },
    seat: { findFirst: jest.fn() },
    outlet: { findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (fn: any) => fn }))

import { generateQRSignature, validateQRSignature } from '@/lib/services/qr-token.service'
import { QRGeneratorService } from '@/lib/services/qr-generator.service'

describe('QR signature correctness', () => {
  it('round-trips for table QR', () => {
    const sig = generateQRSignature('biz-1', 'table-1', '1')
    expect(validateQRSignature('biz-1', 'table-1', '1', sig)).toBe(true)
  })

  it('seat-only QR signature validates when the entity id is forwarded', () => {
    // generateURL signs the seatId in the entity slot
    const sig = generateQRSignature('biz-1', 'seat-9', '1')
    // validateQRSignature's second arg is the entity id — token endpoint now
    // passes tableId || seatId || outletId
    expect(validateQRSignature('biz-1', 'seat-9', '1', sig)).toBe(true)
    // Without forwarding the seat id, it must still fail (prevents forgery)
    expect(validateQRSignature('biz-1', undefined, '1', sig)).toBe(false)
  })

  it('outlet-only QR signature validates when forwarded', () => {
    const sig = generateQRSignature('biz-1', 'outlet-7', '1')
    expect(validateQRSignature('biz-1', 'outlet-7', '1', sig)).toBe(true)
  })

  it('branch-only QR (no entity) validates', () => {
    const sig = generateQRSignature('biz-1', undefined, '1')
    expect(validateQRSignature('biz-1', undefined, '1', sig)).toBe(true)
  })

  it('tampered entity id fails', () => {
    const sig = generateQRSignature('biz-1', 'table-1', '1')
    expect(validateQRSignature('biz-1', 'table-2', '1', sig)).toBe(false)
  })

  it('generateURL emits signed absolute URL with entity param', () => {
    const url = QRGeneratorService.generateURL({ branchId: 'biz-1', tableId: 't1', mode: 'invenue' })
    expect(url).toContain('signature=')
    expect(url).toContain('version=1')
    expect(url).toContain('tableId=t1')
    expect(url).toContain('/order?')
  })

  it('generateURL for seat includes seatId and matching signature', () => {
    const url = QRGeneratorService.generateURL({ branchId: 'biz-1', seatId: 's3' })
    const parsed = new URL(url)
    expect(parsed.searchParams.get('seatId')).toBe('s3')
    const sig = parsed.searchParams.get('signature')!
    // Must validate when seat id forwarded as the entity
    expect(validateQRSignature('biz-1', 's3', '1', sig)).toBe(true)
  })
})
