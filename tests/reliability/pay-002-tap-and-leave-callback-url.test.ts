/**
 * PAY-002 — Tap & Leave Callback URL Priority Regression Test
 *
 * Forensic finding: `src/pages/api/checkout/tap-and-leave.ts` previously derived
 * the InTouch `callbackurl` exclusively from `NEXTAUTH_URL`, silently ignoring
 * `INTOUCH_CALLBACK_URL` even when the founder configured it (as instructed by
 * FOUNDER-GPV-001-Environment-Prerequisites.md). During sandbox testing behind
 * an ngrok tunnel, NEXTAUTH_URL is typically still `http://localhost:3000`
 * (required for cookie/session correctness), so the callback URL InTouch was
 * told to invoke was unreachable from the public internet — the webhook could
 * never arrive.
 *
 * Fix: prefer INTOUCH_CALLBACK_URL when set, matching the fallback order
 * already used by InTouchProvider (src/lib/payments/providers/intouch.provider.ts).
 */

const mockPrisma = {
  business: { findUnique: jest.fn() },
  paymentTransaction: { create: jest.fn(), update: jest.fn() },
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

const mockSlip = {
  id: 'slip-1',
  businessId: 'biz-1',
  status: 'active',
  runningTotalCents: 10000,
  finalBillCents: null,
  slipNumber: 'SLIP-001',
  session: { table: { number: 'T1' } },
}

jest.mock('@/lib/services/dining-session-slip.service', () => ({
  DiningSessionSlipService: {
    getSlipBySessionId: jest.fn().mockResolvedValue(mockSlip),
    initiateCheckout: jest.fn().mockResolvedValue(undefined),
    finalizeBill: jest.fn().mockResolvedValue(undefined),
    getSlipById: jest.fn().mockResolvedValue(mockSlip),
    markPaymentTriggered: jest.fn().mockResolvedValue(undefined),
    markPaymentFailed: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/lib/services/currency-conversion.service', () => ({
  convertToRWF: jest.fn(async (amt: number) => amt),
  getExchangeRate: jest.fn(async () => 1),
}))

jest.mock('@/lib/services/platform-fee.service', () => ({
  getPlatformFee: jest.fn().mockResolvedValue(5),
  FeeType: { DIGITAL_PAYMENT_FEE: 'DIGITAL_PAYMENT_FEE' },
}))

jest.mock('@/lib/services/payment-ledger-events.service', () => ({
  ensurePaymentLedgerEvent: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/die/business-as-plugin/dining-slips/slips.shadow', () => ({
  ingestDiningSlipShadowEvent: jest.fn().mockResolvedValue(undefined),
}))

const requestPaymentSpy = jest.fn().mockResolvedValue({
  responsecode: '1000',
  status: 'Pending',
  transactionid: 'TX-001',
})

jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: {
    generateRequestTransactionId: () => 'RT-TEST-001',
    requestPayment: requestPaymentSpy,
    isSuccess: (code?: string) => code === '01',
    isPending: (code?: string) => code === '1000',
    getErrorMessage: (code?: string) => `error-${code}`,
  },
}))

describe('PAY-002: Tap & Leave callback URL priority', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    requestPaymentSpy.mockClear()
    process.env = { ...ORIGINAL_ENV }
    process.env.NODE_ENV = 'production' // disable simulate bypass
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'payment-1' })
    mockPrisma.paymentTransaction.update.mockResolvedValue({})
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  function buildReqRes() {
    const req: any = {
      method: 'POST',
      body: { sessionId: 'session-1', phone: '250788123456' },
      query: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    }
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    }
    return { req, res }
  }

  it('uses INTOUCH_CALLBACK_URL when configured (sandbox tunnel)', async () => {
    process.env.INTOUCH_CALLBACK_URL = 'https://abc123.ngrok.io/api/webhooks/intouch'

    const handler = require('@/pages/api/checkout/tap-and-leave').default
    const { req, res } = buildReqRes()

    await handler(req, res)

    expect(requestPaymentSpy).toHaveBeenCalledTimes(1)
    const callArg = requestPaymentSpy.mock.calls[0][0]
    expect(callArg.callbackUrl).toBe('https://abc123.ngrok.io/api/webhooks/intouch')
  })

  it('falls back to NEXTAUTH_URL-derived callback when INTOUCH_CALLBACK_URL is not set', async () => {
    delete process.env.INTOUCH_CALLBACK_URL

    const handler = require('@/pages/api/checkout/tap-and-leave').default
    const { req, res } = buildReqRes()

    await handler(req, res)

    expect(requestPaymentSpy).toHaveBeenCalledTimes(1)
    const callArg = requestPaymentSpy.mock.calls[0][0]
    expect(callArg.callbackUrl).toBe('http://localhost:3000/api/webhooks/intouch')
  })
})
