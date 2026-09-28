/**
 * PHASE 4R — LAUNCH STABILITY / SECURITY REMEDIATION regression tests
 *
 * P1-A  /api/checkout/tap-and-leave — anonymous payment initiation rejected;
 *       session-bound capability (participant tempId / seat token) or
 *       business staff session required.
 * P1-B  /api/checkout/tap-and-leave/status/[id] — status polling can mutate
 *       payment state; must be bound to the payment's dining session.
 * P1-C  /api/session/* — capability binding for join, initialize, close,
 *       summary, slip, update-participant, generate-invite.
 * P1-D  /api/waiter-calls/[id] — unconditional staff auth + business
 *       ownership for PATCH/DELETE.
 * P1-E  /api/marketplace/orders/pay — order.userId ownership (or business
 *       staff) verified before PaymentTransaction creation.
 * P1-F  /api/pre-order/schedule — businessId derived from menu items;
 *       cross-tenant scheduling rejected.
 */

// ─── Shared prisma mock ───────────────────────────────────────────────────
const mockPrisma = {
  tableSession: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  sessionParticipant: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  seatSession: { findFirst: jest.fn() },
  table: { findUnique: jest.fn() },
  business: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  waiterCall: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  marketplaceOrder: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  menuItem: { findMany: jest.fn() },
  sale: { create: jest.fn() },
  paymentTransaction: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tableSessionInvite: { findUnique: jest.fn() },
  diningSessionSlip: {},
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
}

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

const mockGetServerSession = jest.fn()
jest.mock('next-auth/next', () => ({ __esModule: true, getServerSession: (...a: any[]) => mockGetServerSession(...a) }))
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => () => {}),
  getServerSession: (...a: any[]) => mockGetServerSession(...a),
}))

jest.mock('@/lib/middleware/error-handler.middleware', () => ({ withErrorHandler: (h: any) => h }))
jest.mock('@/lib/middleware/withRateLimit', () => ({ withRateLimit: (h: any) => h }))
jest.mock('@/lib/middleware/csrf', () => ({ withCsrf: (h: any) => h }))

const mockValidateQRSignature = jest.fn()
jest.mock('@/lib/services/qr-token.service', () => ({
  validateQRSignature: (...a: any[]) => mockValidateQRSignature(...a),
}))

jest.mock('@/lib/services/dining-session-slip.service', () => ({
  DiningSessionSlipService: {
    getSlipBySessionId: jest.fn(),
    getSlipById: jest.fn(),
    createSlip: jest.fn(),
    initiateCheckout: jest.fn(),
    finalizeBill: jest.fn(),
    markPaymentTriggered: jest.fn(),
    markPaymentFailed: jest.fn(),
  },
}))
jest.mock('@/lib/services/intouch.service', () => ({
  InTouchService: {
    generateRequestTransactionId: jest.fn(() => 'req-tx-1'),
    requestPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    isSuccess: jest.fn((c: any) => c === '1000'),
    isPending: jest.fn((c: any) => c === '01' || c === '100'),
    getErrorMessage: jest.fn(() => 'err'),
  },
}))
jest.mock('@/lib/services/tap-leave-finalization.service', () => ({
  TapLeaveFinalizationService: { finalize: jest.fn() },
}))
jest.mock('@/lib/services/currency-exchange.service', () => ({
  convertMinorUnits: jest.fn(),
  getDefaultPaymentRateMaxAgeHours: jest.fn(() => 24),
  getRateTypeForOperation: jest.fn(() => 'AVERAGE'),
}))
jest.mock('@/lib/services/platform-fee.service', () => ({
  getPlatformFee: jest.fn().mockResolvedValue(5),
  FeeType: { DIGITAL_PAYMENT_FEE: 'DIGITAL_PAYMENT_FEE' },
}))
jest.mock('@/lib/services/payment-ledger-events.service', () => ({ ensurePaymentLedgerEvent: jest.fn() }))
jest.mock('@/lib/die/business-as-plugin/dining-slips/slips.shadow', () => ({
  ingestDiningSlipShadowEvent: jest.fn().mockResolvedValue({}),
}))
jest.mock('@/lib/services/table-invite.service', () => ({
  TableInviteService: {
    generateInvite: jest.fn().mockResolvedValue({ success: true, inviteCode: 'ABC12345', shareUrl: 'https://x/join?c=ABC12345' }),
    acceptInvite: jest.fn(),
    checkInviteReward: jest.fn(),
  },
}))
jest.mock('@/lib/realtime', () => ({ realtimeService: { emit: jest.fn().mockResolvedValue({}) } }))
jest.mock('@/lib/die/business-as-plugin/waiter-calls/waiter-calls.adapter', () => ({
  WaiterCallsPluginAdapter: jest.fn().mockImplementation(() => ({})),
}))
jest.mock('@/lib/die/business-as-plugin/conversion/event-router', () => ({ routeDomainEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/die/business-as-plugin/shadow/shadow-bindings', () => ({ shadowBindings: {} }))

const mockCreatePayment = jest.fn()
jest.mock('@/lib/payments/providers', () => ({
  PaymentProviderFactory: { getProvider: jest.fn(() => ({ createPayment: (...a: any[]) => mockCreatePayment(...a) })) },
}))
jest.mock('@/lib/payments/types', () => ({
  PaymentProviderType: { INTOUCH: 'intouch', IREMBO_PAY: 'irembo_pay' },
  PaymentMethodType: {
    MOBILE_MONEY_MTN: 'MTN_MOBILE_MONEY', MOBILE_MONEY_AIRTEL: 'AIRTEL_MONEY',
    CARD_VISA: 'CARD_VISA', CARD_MASTERCARD: 'CARD_MASTERCARD',
  },
}))
jest.mock('@/lib/services/billing-ledger.service', () => ({ logBillingEvent: jest.fn().mockResolvedValue({}) }))
jest.mock('@/lib/observability/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('@/lib/observability/metrics', () => ({ counter: jest.fn(() => ({ inc: jest.fn() })) }))
jest.mock('@/lib/services/invoice-number.service', () => ({
  InvoiceNumberService: { next: jest.fn().mockResolvedValue('INV-1') },
}))

// ─── Imports under test ───────────────────────────────────────────────────
import tapLeaveHandler from '@/pages/api/checkout/tap-and-leave'
import tapLeaveStatusHandler from '@/pages/api/checkout/tap-and-leave/status/[id]'
import sessionCloseHandler from '@/pages/api/session/close'
import sessionJoinHandler from '@/pages/api/session/join'
import sessionInitializeHandler from '@/pages/api/session/initialize'
import sessionSummaryHandler from '@/pages/api/session/summary'
import sessionSlipHandler from '@/pages/api/session/slip/[sessionId]'
import sessionUpdateParticipantHandler from '@/pages/api/session/update-participant'
import sessionGenerateInviteHandler from '@/pages/api/session/generate-invite'
import waiterCallIdHandler from '@/pages/api/waiter-calls/[id]'
import marketplacePayHandler from '@/pages/api/marketplace/orders/pay'
import preOrderScheduleHandler from '@/pages/api/pre-order/schedule'

import { DiningSessionSlipService } from '@/lib/services/dining-session-slip.service'
import { InTouchService } from '@/lib/services/intouch.service'
import { TapLeaveFinalizationService } from '@/lib/services/tap-leave-finalization.service'
import { TableInviteService } from '@/lib/services/table-invite.service'

function reqRes(opts: { method?: string; body?: any; query?: any; headers?: any } = {}) {
  const req: any = {
    method: opts.method || 'GET',
    body: opts.body || {},
    query: opts.query || {},
    headers: opts.headers || {},
    cookies: {},
    socket: { remoteAddress: '10.0.0.9' },
  }
  const res: any = {
    statusCode: 200, body: null,
    status(c: number) { res.statusCode = c; return res },
    json(d: any) { res.body = d; return res },
    send(d: any) { res.body = d; return res },
    setHeader() { return res },
    end() { return res },
  }
  return { req, res }
}

const BIZ = 'biz-1'
const OTHER_BIZ = 'biz-2'
const SESSION_ID = 'sess-1'
const TABLE_ID = 'tbl-1'
const TEMP_ID = 'temp-device-uuid-1'
const PARTICIPANT_ID = 'part-1'

const tableSession = { id: SESSION_ID, businessId: BIZ, tableId: TABLE_ID, status: 'active' }
const staffSession = { user: { id: 'u-staff', email: 's@x.com', businessId: BIZ } }
const otherStaffSession = { user: { id: 'u-staff2', email: 'o@x.com', businessId: OTHER_BIZ } }

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
  mockPrisma.sessionParticipant.findFirst.mockResolvedValue(null)
  mockPrisma.seatSession.findFirst.mockResolvedValue(null)
  mockPrisma.user.findUnique.mockResolvedValue(null)
  mockGetServerSession.mockResolvedValue(null)
  mockValidateQRSignature.mockReturnValue(false)
})

// ═══════════════════════════════ P1-A ═══════════════════════════════════
describe('P1-A /api/checkout/tap-and-leave authorization', () => {
  const slip = {
    id: 'slip-1', sessionId: SESSION_ID, businessId: BIZ, status: 'active',
    runningTotalCents: 500000, slipNumber: 'SLIP-1', itemCount: 2,
    session: { table: { number: '4' } },
  }

  it('anonymous initiation without credentials → 401, no PaymentTransaction', async () => {
    const { req, res } = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788123456' } })
    await tapLeaveHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
    expect(DiningSessionSlipService.getSlipBySessionId).not.toHaveBeenCalled()
  })

  it('wrong-session tempId → 403, no provider call', async () => {
    const { req, res } = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788', tempId: 'other-temp' } })
    await tapLeaveHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
    expect(InTouchService.requestPayment).not.toHaveBeenCalled()
  })

  it('valid participant tempId → proceeds to slip/payment flow', async () => {
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })
    ;(DiningSessionSlipService.getSlipBySessionId as jest.Mock).mockResolvedValue(slip)
    ;(DiningSessionSlipService.getSlipById as jest.Mock).mockResolvedValue({ ...slip, finalBillCents: 500000 })
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pay-1' })
    ;(InTouchService.requestPayment as jest.Mock).mockResolvedValue({ responsecode: '01', transactionid: 'tx-1' })
    mockPrisma.paymentTransaction.update.mockResolvedValue({})

    const { req, res } = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788123456', tempId: TEMP_ID } })
    await tapLeaveHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledTimes(1)
  })

  it('valid seat session token → proceeds', async () => {
    mockPrisma.seatSession.findFirst.mockResolvedValue({ id: 'seat-1', participantId: PARTICIPANT_ID })
    ;(DiningSessionSlipService.getSlipBySessionId as jest.Mock).mockResolvedValue(slip)
    ;(DiningSessionSlipService.getSlipById as jest.Mock).mockResolvedValue({ ...slip, finalBillCents: 500000 })
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pay-1' })
    ;(InTouchService.requestPayment as jest.Mock).mockResolvedValue({ responsecode: '01', transactionid: 'tx-1' })

    const { req, res } = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788123456', seatSessionToken: 'seat-tok' } })
    await tapLeaveHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('staff of owning business → proceeds; staff of other business → 401/403', async () => {
    mockGetServerSession.mockResolvedValue(staffSession)
    ;(DiningSessionSlipService.getSlipBySessionId as jest.Mock).mockResolvedValue(slip)
    ;(DiningSessionSlipService.getSlipById as jest.Mock).mockResolvedValue({ ...slip, finalBillCents: 500000 })
    mockPrisma.business.findUnique.mockResolvedValue({ currency: 'RWF' })
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pay-1' })
    ;(InTouchService.requestPayment as jest.Mock).mockResolvedValue({ responsecode: '01', transactionid: 'tx-1' })

    const ok = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788123456' } })
    await tapLeaveHandler(ok.req, ok.res)
    expect(ok.res.statusCode).toBe(200)

    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue(null)
    mockPrisma.seatSession.findFirst.mockResolvedValue(null)
    mockGetServerSession.mockResolvedValue(otherStaffSession)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: OTHER_BIZ })

    const bad = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, phone: '0788123456' } })
    await tapLeaveHandler(bad.req, bad.res)
    expect([401, 403]).toContain(bad.res.statusCode)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════ P1-B ═══════════════════════════════════
describe('P1-B /api/checkout/tap-and-leave/status/[id] authorization', () => {
  const payment = {
    id: 'pay-1', businessId: BIZ, referenceId: SESSION_ID, status: 'PENDING',
    transactionId: 'req-tx-1', amountCents: 500000,
    rawRequest: { sessionId: SESSION_ID, slipId: 'slip-1' },
    rawCallback: { transactionid: 'tx-1' }, rawStatus: {},
  }

  it('anonymous status request → 401, no provider poll, no mutation', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue(payment)
    const { req, res } = reqRes({ method: 'GET', query: { id: 'pay-1' } })
    await tapLeaveStatusHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(InTouchService.getPaymentStatus).not.toHaveBeenCalled()
    expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled()
  })

  it('wrong-session tempId → 403, no mutation', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue(payment)
    const { req, res } = reqRes({ method: 'GET', query: { id: 'pay-1', tempId: 'wrong' } })
    await tapLeaveStatusHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(InTouchService.getPaymentStatus).not.toHaveBeenCalled()
  })

  it('authorized participant poll → provider called, status transition applied', async () => {
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue(payment)
    ;(InTouchService.getPaymentStatus as jest.Mock).mockResolvedValue({ responsecode: '1000' })
    ;(DiningSessionSlipService.getSlipById as jest.Mock).mockResolvedValue({ status: 'checkout_completed', slipNumber: 'S1' })
    const { req, res } = reqRes({ method: 'GET', query: { id: 'pay-1', tempId: TEMP_ID } })
    await tapLeaveStatusHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(InTouchService.getPaymentStatus).toHaveBeenCalled()
    expect(TapLeaveFinalizationService.finalize).toHaveBeenCalledWith('pay-1', 'poll')
  })

  it('payment bound to another business staff → rejected', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue({ ...payment, businessId: OTHER_BIZ })
    const { req, res } = reqRes({ method: 'GET', query: { id: 'pay-1', tempId: TEMP_ID } })
    await tapLeaveStatusHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('payment without session binding → 403', async () => {
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue({ ...payment, referenceId: null, rawRequest: {} })
    const { req, res } = reqRes({ method: 'GET', query: { id: 'pay-1', tempId: TEMP_ID } })
    await tapLeaveStatusHandler(req, res)
    expect(res.statusCode).toBe(403)
  })
})

// ═══════════════════════════════ P1-C ═══════════════════════════════════
describe('P1-C /api/session/* capability binding', () => {
  it('close: anonymous → 401; participant tempId → closes', async () => {
    const a = reqRes({ method: 'POST', body: { sessionId: SESSION_ID } })
    await sessionCloseHandler(a.req, a.res)
    expect(a.res.statusCode).toBe(401)
    expect(mockPrisma.tableSession.update).not.toHaveBeenCalled()

    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })
    mockPrisma.tableSession.update.mockResolvedValue({ ...tableSession, status: 'closed' })

    const b = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, tempId: TEMP_ID } })
    await sessionCloseHandler(b.req, b.res)
    expect(b.res.statusCode).toBe(200)
    expect(mockPrisma.tableSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'closed' }) })
    )
  })

  it('summary: no capability → 401; wrong session tempId → 403', async () => {
    const a = reqRes({ method: 'GET', query: { sessionId: SESSION_ID } })
    await sessionSummaryHandler(a.req, a.res)
    expect(a.res.statusCode).toBe(401)

    const b = reqRes({ method: 'GET', query: { sessionId: SESSION_ID, tempId: 'other' } })
    await sessionSummaryHandler(b.req, b.res)
    expect(b.res.statusCode).toBe(403)
  })

  it('slip: anonymous → 401; participant → returns slip', async () => {
    const a = reqRes({ method: 'GET', query: { sessionId: SESSION_ID } })
    await sessionSlipHandler(a.req, a.res)
    expect(a.res.statusCode).toBe(401)

    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })
    ;(DiningSessionSlipService.getSlipBySessionId as jest.Mock).mockResolvedValue({ id: 'slip-1' })

    const b = reqRes({ method: 'GET', query: { sessionId: SESSION_ID, tempId: TEMP_ID } })
    await sessionSlipHandler(b.req, b.res)
    expect(b.res.statusCode).toBe(200)
  })

  it('join: anonymous without QR signature → 401', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: TABLE_ID, number: '4', businessId: BIZ })
    const { req, res } = reqRes({ method: 'POST', body: { tableId: TABLE_ID, branchId: BIZ, tempId: TEMP_ID } })
    await sessionJoinHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(mockPrisma.tableSession.create).not.toHaveBeenCalled()
  })

  it('join: valid QR signature binding wrong business → 403', async () => {
    mockValidateQRSignature.mockReturnValue(true)
    mockPrisma.table.findUnique.mockResolvedValue({ id: TABLE_ID, number: '4', businessId: OTHER_BIZ })
    const { req, res } = reqRes({
      method: 'POST',
      body: { tableId: TABLE_ID, branchId: BIZ, tempId: TEMP_ID, version: '1', signature: 'sig' },
    })
    await sessionJoinHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('join: valid QR signature + matching business → joins/creates session', async () => {
    mockValidateQRSignature.mockReturnValue(true)
    mockPrisma.table.findUnique.mockResolvedValue({ id: TABLE_ID, number: '4', businessId: BIZ })
    mockPrisma.tableSession.findFirst.mockResolvedValue(null)
    mockPrisma.tableSession.create.mockResolvedValue({ ...tableSession, participants: [] })
    mockPrisma.sessionParticipant.findUnique.mockResolvedValue(null)
    mockPrisma.sessionParticipant.create.mockResolvedValue({ id: PARTICIPANT_ID, name: 'Guest 1' })

    const { req, res } = reqRes({
      method: 'POST',
      body: { tableId: TABLE_ID, branchId: BIZ, tempId: TEMP_ID, version: '1', signature: 'sig' },
    })
    await sessionJoinHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.sessionId).toBe(SESSION_ID)
  })

  it('join: staff of owning business without QR → allowed', async () => {
    mockGetServerSession.mockResolvedValue(staffSession)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: BIZ })
    mockPrisma.table.findUnique.mockResolvedValue({ id: TABLE_ID, number: '4', businessId: BIZ })
    mockPrisma.tableSession.findFirst.mockResolvedValue({ ...tableSession, participants: [] })
    mockPrisma.sessionParticipant.findUnique.mockResolvedValue({ id: PARTICIPANT_ID })

    const { req, res } = reqRes({ method: 'POST', body: { tableId: TABLE_ID, branchId: BIZ, tempId: TEMP_ID } })
    await sessionJoinHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('initialize: anonymous without signature → 401', async () => {
    const { req, res } = reqRes({ method: 'POST', body: { tableId: TABLE_ID, businessId: BIZ } })
    await sessionInitializeHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(mockPrisma.tableSession.create).not.toHaveBeenCalled()
  })

  it('initialize: valid signature + staff of other business → 403 via table/business mismatch', async () => {
    mockValidateQRSignature.mockReturnValue(true)
    mockPrisma.tableSession.findFirst.mockResolvedValue(null)
    mockPrisma.table.findUnique.mockResolvedValue({ number: '4', businessId: OTHER_BIZ })
    const { req, res } = reqRes({
      method: 'POST',
      body: { tableId: TABLE_ID, businessId: BIZ, version: '1', signature: 'sig' },
    })
    await sessionInitializeHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('update-participant: anonymous → 401; other participant tempId → 403; own → 200', async () => {
    const participant = { id: PARTICIPANT_ID, sessionId: SESSION_ID, tempId: TEMP_ID, name: 'A' }
    mockPrisma.sessionParticipant.findUnique.mockResolvedValue(participant)

    const a = reqRes({ method: 'POST', body: { participantId: PARTICIPANT_ID, name: 'New' } })
    await sessionUpdateParticipantHandler(a.req, a.res)
    expect(a.res.statusCode).toBe(401)

    // tempId resolves to a DIFFERENT participant → forbidden
    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findUnique.mockResolvedValue(participant)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: 'part-other' })

    const b = reqRes({ method: 'POST', body: { participantId: PARTICIPANT_ID, tempId: 'other-temp', name: 'New' } })
    await sessionUpdateParticipantHandler(b.req, b.res)
    expect(b.res.statusCode).toBe(403)

    // own participant
    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findUnique.mockResolvedValue(participant)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })
    mockPrisma.sessionParticipant.update.mockResolvedValue({ id: PARTICIPANT_ID, name: 'New' })

    const c = reqRes({ method: 'POST', body: { participantId: PARTICIPANT_ID, tempId: TEMP_ID, name: 'New' } })
    await sessionUpdateParticipantHandler(c.req, c.res)
    expect(c.res.statusCode).toBe(200)
  })

  it('generate-invite: anonymous → 401; participant minting as another → 403; own → 200', async () => {
    const a = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, inviterId: PARTICIPANT_ID } })
    await sessionGenerateInviteHandler(a.req, a.res)
    expect(a.res.statusCode).toBe(401)

    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: 'part-other' })

    const b = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, inviterId: PARTICIPANT_ID, tempId: 'x' } })
    await sessionGenerateInviteHandler(b.req, b.res)
    expect(b.res.statusCode).toBe(403)

    jest.clearAllMocks()
    mockPrisma.tableSession.findUnique.mockResolvedValue(tableSession)
    mockPrisma.sessionParticipant.findFirst.mockResolvedValue({ id: PARTICIPANT_ID })

    const c = reqRes({ method: 'POST', body: { sessionId: SESSION_ID, inviterId: PARTICIPANT_ID, tempId: TEMP_ID } })
    await sessionGenerateInviteHandler(c.req, c.res)
    expect(c.res.statusCode).toBe(200)
    expect(TableInviteService.generateInvite).toHaveBeenCalledWith({ sessionId: SESSION_ID, inviterId: PARTICIPANT_ID })
  })
})

// ═══════════════════════════════ P1-D ═══════════════════════════════════
describe('P1-D /api/waiter-calls/[id] ownership', () => {
  const call = { id: 'call-1', tableId: TABLE_ID, table: { number: '4', businessId: BIZ }, status: 'pending' }

  it('anonymous PATCH → 401', async () => {
    const { req, res } = reqRes({ method: 'PATCH', query: { id: 'call-1' }, body: { action: 'resolve' } })
    await waiterCallIdHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(mockPrisma.waiterCall.update).not.toHaveBeenCalled()
  })

  it('anonymous DELETE → 401', async () => {
    const { req, res } = reqRes({ method: 'DELETE', query: { id: 'call-1' } })
    await waiterCallIdHandler(req, res)
    expect(res.statusCode).toBe(401)
    expect(mockPrisma.waiterCall.delete).not.toHaveBeenCalled()
  })

  it('staff of other business PATCH → 403', async () => {
    mockGetServerSession.mockResolvedValue(otherStaffSession)
    mockPrisma.waiterCall.findUnique.mockResolvedValue(call)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: OTHER_BIZ })
    const { req, res } = reqRes({ method: 'PATCH', query: { id: 'call-1' }, body: { action: 'resolve' } })
    await waiterCallIdHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('staff of owning business PATCH → resolves', async () => {
    mockGetServerSession.mockResolvedValue(staffSession)
    mockPrisma.waiterCall.findUnique.mockResolvedValue(call)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: BIZ })
    mockPrisma.waiterCall.update.mockResolvedValue({ ...call, status: 'resolved' })
    const { req, res } = reqRes({ method: 'PATCH', query: { id: 'call-1' }, body: { action: 'resolve' } })
    await waiterCallIdHandler(req, res)
    expect(res.statusCode).toBe(200)
  })

  it('staff of owning business DELETE → deletes', async () => {
    mockGetServerSession.mockResolvedValue(staffSession)
    mockPrisma.waiterCall.findUnique.mockResolvedValue(call)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: BIZ })
    mockPrisma.waiterCall.delete.mockResolvedValue(call)
    const { req, res } = reqRes({ method: 'DELETE', query: { id: 'call-1' } })
    await waiterCallIdHandler(req, res)
    expect(res.statusCode).toBe(200)
  })
})

// ═══════════════════════════════ P1-E ═══════════════════════════════════
describe('P1-E /api/marketplace/orders/pay ownership', () => {
  const order = {
    id: 'mo-1', orderNumber: 'MO-1', userId: 'u-customer', businessId: BIZ,
    totalAmountCents: 100000,
    business: { id: BIZ, currency: 'RWF', taxRate: 18, phone: '0788' },
    user: { id: 'u-customer' },
  }
  const ownerSession = { user: { id: 'u-customer', email: 'c@x.com' } }
  const otherUserSession = { user: { id: 'u-other', email: 'o@x.com' } }

  it('wrong user → 403, no PaymentTransaction, no provider call', async () => {
    mockGetServerSession.mockResolvedValue(otherUserSession)
    mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: null })
    const { req, res } = reqRes({ method: 'POST', body: { orderId: 'mo-1', paymentMethod: 'MTN_MOBILE_MONEY' } })
    await marketplacePayHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
    expect(mockCreatePayment).not.toHaveBeenCalled()
  })

  it('cross-tenant staff user → 403', async () => {
    mockGetServerSession.mockResolvedValue(otherUserSession)
    mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: OTHER_BIZ })
    const { req, res } = reqRes({ method: 'POST', body: { orderId: 'mo-1', paymentMethod: 'MTN_MOBILE_MONEY' } })
    await marketplacePayHandler(req, res)
    expect(res.statusCode).toBe(403)
  })

  it('order owner → proceeds to provider initiation', async () => {
    mockGetServerSession.mockResolvedValue(ownerSession)
    mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order)
    mockPrisma.user.findUnique.mockResolvedValue({ businessId: null })
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'pt-1' })
    mockPrisma.paymentTransaction.update.mockResolvedValue({})
    mockPrisma.marketplaceOrder.update.mockResolvedValue({})
    mockCreatePayment.mockResolvedValue({ success: true, providerReference: 'ref-1', paymentUrl: 'https://pay' })

    const { req, res } = reqRes({ method: 'POST', body: { orderId: 'mo-1', paymentMethod: 'MTN_MOBILE_MONEY' } })
    await marketplacePayHandler(req, res)
    expect(res.statusCode).toBe(200)
    expect(mockCreatePayment).toHaveBeenCalled()
  })

  it('nonexistent order → 404 before provider call', async () => {
    mockGetServerSession.mockResolvedValue(ownerSession)
    mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null)
    const { req, res } = reqRes({ method: 'POST', body: { orderId: 'missing', paymentMethod: 'MTN_MOBILE_MONEY' } })
    await marketplacePayHandler(req, res)
    expect(res.statusCode).toBe(404)
    expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════ P1-F ═══════════════════════════════════
describe('P1-F /api/pre-order/schedule business context', () => {
  const items = [{ menuItemId: 'mi-1', quantity: 2 }]
  const future = new Date(Date.now() + 3600_000).toISOString()
  const menuItems = [
    { id: 'mi-1', businessId: BIZ, priceCents: 5000 },
  ]

  it('manipulated businessId rejected (items belong to another business)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u-cust', name: 'C' } })
    mockPrisma.menuItem.findMany.mockResolvedValue(menuItems)
    const { req, res } = reqRes({
      method: 'POST',
      body: { businessId: OTHER_BIZ, items, scheduledAt: future },
    })
    await preOrderScheduleHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('cross-business item combination rejected', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u-cust', name: 'C' } })
    mockPrisma.menuItem.findMany.mockResolvedValue([
      { id: 'mi-1', businessId: BIZ, priceCents: 5000 },
      { id: 'mi-2', businessId: OTHER_BIZ, priceCents: 3000 },
    ])
    const { req, res } = reqRes({
      method: 'POST',
      body: { businessId: BIZ, items: [{ menuItemId: 'mi-1', quantity: 1 }, { menuItemId: 'mi-2', quantity: 1 }], scheduledAt: future },
    })
    await preOrderScheduleHandler(req, res)
    expect(res.statusCode).toBe(400)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('staff of business A cannot schedule into business B', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u-staff', name: 'S', businessId: BIZ } })
    mockPrisma.menuItem.findMany.mockResolvedValue([{ id: 'mi-1', businessId: OTHER_BIZ, priceCents: 5000 }])
    const { req, res } = reqRes({
      method: 'POST',
      body: { businessId: OTHER_BIZ, items, scheduledAt: future },
    })
    await preOrderScheduleHandler(req, res)
    expect(res.statusCode).toBe(403)
    expect(mockPrisma.sale.create).not.toHaveBeenCalled()
  })

  it('unauthenticated → 401', async () => {
    const { req, res } = reqRes({ method: 'POST', body: { businessId: BIZ, items, scheduledAt: future } })
    await preOrderScheduleHandler(req, res)
    expect(res.statusCode).toBe(401)
  })

  it('legitimate same-business scheduling creates Sale under authoritative business', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'u-cust', name: 'C' } })
    mockPrisma.menuItem.findMany.mockResolvedValue(menuItems)
    mockPrisma.sale.create.mockResolvedValue({ id: 'sale-1', businessId: BIZ, items: [] })
    const { req, res } = reqRes({
      method: 'POST',
      body: { businessId: BIZ, items, scheduledAt: future },
    })
    await preOrderScheduleHandler(req, res)
    expect(res.statusCode).toBe(201)
    expect(mockPrisma.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ businessId: BIZ, totalAmountCents: 10000 }) })
    )
  })
})
