/**
 * SECURITY TEST: campaign send tenant isolation
 *
 * api/campaigns/[id]/send.ts must not allow one business to trigger another
 * business's campaign (HIGH finding in WHATSAPP-DEEP-AUDIT §9).
 */

jest.mock('@/lib/prisma', () => ({
  prisma: { promotion: { findUnique: jest.fn() } },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() =>
    Promise.resolve({ user: { email: 'o@t.com', id: 'u1', businessId: 'biz-A' } })
  ),
}))
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@/lib/middleware/withFeatureCheck', () => ({ requiresFeature: () => (fn: any) => fn }))
jest.mock('@/lib/die/business-as-plugin/campaigns/campaigns.shadow', () => ({
  ingestCampaignShadowEvent: jest.fn().mockResolvedValue({}),
}))
const mockSend = jest.fn().mockResolvedValue({ sent: 1, failed: 0 })
jest.mock('@/lib/whatsapp/campaign-scheduler', () => ({ sendCampaignMessages: mockSend }))

import handler from '@/pages/api/campaigns/[id]/send'

function reqRes(id: string) {
  const req: any = { method: 'POST', query: { id }, headers: {}, cookies: {} }
  const res: any = {
    statusCode: 200, body: null,
    status(c: number) { res.statusCode = c; return res },
    json(d: any) { res.body = d; return res },
    setHeader() { return res },
  }
  return { req, res }
}

describe('campaign send — tenant boundary', () => {
  const { prisma } = require('@/lib/prisma')

  beforeEach(() => jest.clearAllMocks())

  it('allows own-tenant campaign send', async () => {
    prisma.promotion.findUnique.mockResolvedValue({ businessId: 'biz-A' })
    const { req, res } = reqRes('camp-1')
    await handler(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockSend).toHaveBeenCalledWith('camp-1')
  })

  it('rejects cross-tenant campaign send with 403', async () => {
    prisma.promotion.findUnique.mockResolvedValue({ businessId: 'biz-B' })
    const { req, res } = reqRes('camp-2')
    await handler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('returns 404 for unknown campaign', async () => {
    prisma.promotion.findUnique.mockResolvedValue(null)
    const { req, res } = reqRes('camp-x')
    await handler(req, res)
    expect(res.statusCode).toBe(404)
    expect(mockSend).not.toHaveBeenCalled()
  })
})
