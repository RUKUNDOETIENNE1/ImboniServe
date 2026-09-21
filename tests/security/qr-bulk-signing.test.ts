/**
 * REGRESSION: P0-2 — bulk QR PNGs must contain signed URLs
 *
 * Bug: dashboard/qr-builder.tsx bulk export embedded unsigned
 * `/order?branchId&tableId` URLs → every scanned bulk QR 401'd at
 * /api/public/order/token.
 *
 * Fix: bulk path now fetches /api/public/order/link per table — the SAME
 * canonical signed-link mechanism as the single-QR path.
 *
 * This test proves the contract the bulk path now consumes:
 *  1. link.ts returns a URL carrying signature/version/entity params
 *  2. that URL passes the same validateQRSignature used by token issuance
 *  3. entity binding holds (signature for table A fails for table B)
 *  4. an unsigned equivalent is rejected
 *  5. QR enablement gating is preserved
 */

const mockPrisma = {
  business: { findUnique: jest.fn() },
  table: { findFirst: jest.fn() },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import handler from '@/pages/api/public/order/link'
import { validateQRSignature } from '@/lib/services/qr-token.service'

function reqRes(query: Record<string, string>) {
  const req: any = { method: 'GET', query }
  const res: any = {
    statusCode: 200, body: null,
    status(c: number) { res.statusCode = c; return res },
    json(d: any) { res.body = d; return res },
    setHeader() { return res },
  }
  return { req, res }
}

function parseUrl(url: string) {
  const u = new URL(url, 'https://app.test')
  const p = u.searchParams
  return {
    branchId: p.get('branchId'),
    tableId: p.get('tableId'),
    seatId: p.get('seatId'),
    outletId: p.get('outletId'),
    version: p.get('version') || '1',
    signature: p.get('signature'),
    mode: p.get('mode'),
  }
}

describe('Bulk QR signed-link contract (P0-2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'biz-1', enableQRInVenue: true, enableQRRemote: true,
    })
    mockPrisma.table.findFirst.mockResolvedValue({ id: 'tbl-A', businessId: 'biz-1' })
  })

  it('link endpoint returns a signed URL carrying signature + entity params', async () => {
    const { req, res } = reqRes({ branchId: 'biz-1', tableId: 'tbl-A', mode: 'invenue' })
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    const parts = parseUrl(res.body.url)
    expect(parts.signature).toBeTruthy()
    expect(parts.branchId).toBe('biz-1')
    expect(parts.tableId).toBe('tbl-A')
  })

  it('generated URL passes the same signature verification token.ts applies', async () => {
    const { req, res } = reqRes({ branchId: 'biz-1', tableId: 'tbl-A', mode: 'invenue' })
    await handler(req, res)
    const p = parseUrl(res.body.url)
    // token.ts computes entityId = tableId || seatId || outletId
    const entityId = p.tableId || p.seatId || p.outletId
    expect(validateQRSignature(p.branchId!, entityId!, p.version!, p.signature!)).toBe(true)
  })

  it('entity binding holds — signature for table A fails against table B', async () => {
    const { req, res } = reqRes({ branchId: 'biz-1', tableId: 'tbl-A', mode: 'invenue' })
    await handler(req, res)
    const p = parseUrl(res.body.url)
    expect(validateQRSignature('biz-1', 'tbl-B', p.version!, p.signature!)).toBe(false)
    expect(validateQRSignature('biz-OTHER', 'tbl-A', p.version!, p.signature!)).toBe(false)
  })

  it('unsigned /order?… URL (old bulk behavior) remains rejected', () => {
    // Simulate the pre-fix bulk URL — no signature param at all
    const unsigned = '/order?branchId=biz-1&tableId=tbl-A&mode=invenue'
    const p = parseUrl(unsigned)
    expect(p.signature).toBeNull()
    // token.ts rejects when signature is absent before even calling validate
    expect(p.signature || '').toBe('')
    // And a fabricated/empty signature fails verification
    expect(validateQRSignature('biz-1', 'tbl-A', '1', p.signature || '')).toBe(false)
  })

  it('rejects link generation when in-venue QR is disabled', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'biz-1', enableQRInVenue: false, enableQRRemote: false,
    })
    const { req, res } = reqRes({ branchId: 'biz-1', tableId: 'tbl-A', mode: 'invenue' })
    await handler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('rejects a table that does not belong to the business', async () => {
    mockPrisma.table.findFirst.mockResolvedValue(null)
    const { req, res } = reqRes({ branchId: 'biz-1', tableId: 'tbl-FOREIGN', mode: 'invenue' })
    await handler(req, res)
    expect(res.statusCode).toBe(404)
  })
})
