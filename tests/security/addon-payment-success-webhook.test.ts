/**
 * SECURITY TESTS: Add-on payment-success webhook
 *
 * src/pages/api/webhooks/addons/payment-success.ts must:
 * 1. reject unauthenticated requests
 * 2. reject invalid credentials
 * 3. accept legitimate Bearer CRON_SECRET requests
 * 4. stay idempotent on duplicate events
 * 5. never promote a non-SUCCESS transaction to SUCCESS
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    paymentTransaction: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  },
}))

jest.mock('@/lib/services/site-builder-subscription.service', () => ({
  upgradeToPro: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/discovery-subscription.service', () => ({
  upgradeDiscoveryTier: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/ai-credit.service', () => ({
  purchaseExtraCredits: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/credits/credit-purchase.service', () => ({
  fulfillPurchase: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn().mockResolvedValue({}),
}))

import handler from '@/pages/api/webhooks/addons/payment-success'

const CRON = 'test-cron-secret'

function req(body: any = {}, headers: Record<string, string> = {}) {
  return {
    method: 'POST',
    headers,
    body,
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as any
}

function res() {
  const r: any = {
    statusCode: 200,
    body: null,
    status(c: number) { r.statusCode = c; return r },
    json(d: any) { r.body = d; return r },
    setHeader() { return r },
  }
  return r
}

describe('addon payment-success webhook security', () => {
  const { prisma } = require('@/lib/prisma')
  const { upgradeToPro } = require('@/lib/services/site-builder-subscription.service')

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = CRON
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  const successTxn = {
    id: 'txn-1',
    businessId: 'biz-1',
    status: 'SUCCESS',
    rawRequest: { type: 'addon', addon: 'site_builder_pro' },
    business: { id: 'biz-1', name: 'Test' },
  }

  it('rejects unauthenticated request (no auth header)', async () => {
    const response = res()
    await handler(req({ transactionId: 'txn-1', status: 'SUCCESS' }), response)
    expect(response.statusCode).toBe(401)
    expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled()
    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled()
  })

  it('rejects invalid bearer token', async () => {
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'SUCCESS' }, { authorization: 'Bearer wrong' }),
      response
    )
    expect(response.statusCode).toBe(401)
    expect(upgradeToPro).not.toHaveBeenCalled()
  })

  it('rejects all requests when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'SUCCESS' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(401)
  })

  it('activates add-on for authenticated request on verified SUCCESS transaction', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue(successTxn)
    prisma.paymentTransaction.update.mockResolvedValue(successTxn)
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'SUCCESS' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(200)
    expect(upgradeToPro).toHaveBeenCalledWith('biz-1')
  })

  it('refuses to activate when transaction is still PENDING (forgery defense)', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({ ...successTxn, status: 'PENDING' })
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'SUCCESS' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toMatch(/not confirmed/i)
    expect(upgradeToPro).not.toHaveBeenCalled()
    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled()
  })

  it('is idempotent — already-activated transaction returns success without re-fulfilling', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue({
      ...successTxn,
      rawRequest: { type: 'addon', addon: 'site_builder_pro', activated: true },
    })
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'SUCCESS' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toMatch(/already activated/i)
    expect(upgradeToPro).not.toHaveBeenCalled()
    expect(prisma.paymentTransaction.update).not.toHaveBeenCalled()
  })

  it('ignores non-success event status payloads', async () => {
    const response = res()
    await handler(
      req({ transactionId: 'txn-1', status: 'PENDING' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(200)
    expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled()
  })

  it('returns 404 for unknown transaction without leaking', async () => {
    prisma.paymentTransaction.findUnique.mockResolvedValue(null)
    const response = res()
    await handler(
      req({ transactionId: 'nope', status: 'SUCCESS' }, { authorization: `Bearer ${CRON}` }),
      response
    )
    expect(response.statusCode).toBe(404)
  })
})
