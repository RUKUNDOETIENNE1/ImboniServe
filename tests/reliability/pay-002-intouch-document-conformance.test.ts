/**
 * PAY-002 — InTouch Document-to-Code Forensic Conformance Tests
 *
 * Source of truth: http_intouchpay_api_v1.2.pdf (15 pages), supplied by the
 * founder and forensically reviewed in PAY-002.
 *
 * These tests verify the LEGACY `InTouchService` (src/lib/services/intouch.service.ts)
 * because forensic discovery established that this is the code path actually used
 * by the primary customer-facing payment flow (Tap & Leave checkout, status polling,
 * and cron/reconciler fallback) — NOT the newer `InTouchProvider` abstraction, which
 * is only wired into marketplace and subscription billing.
 *
 * Each test cites the specific document section it verifies.
 */

import crypto from 'crypto'

describe('PAY-002: RequestPayment — Document Section 2 Conformance', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    jest.resetModules()
    process.env.INTOUCH_USERNAME = 'bob'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_PARTNER_PASSWORD = 'secretpass'
    delete process.env.INTOUCH_PASSWORD
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  // Document Section 1.2: "Parameters are submitted to the intouchpay url as
  // http-form post." The RequestPayment example (2.3) uses requests.post(url,
  // data=data), which is form-encoding in the Python `requests` library.
  it('sends RequestPayment as application/x-www-form-urlencoded (doc section 1.2 + 2.3)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')

    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 'Pending',
        requesttransactionid: 'RT-001',
        success: true,
        responsecode: '1000',
        transactionid: 1425,
        message: 'Transaction Pending',
      }),
    })
    global.fetch = mockFetch as any

    await InTouchService.requestPayment({
      amount: 100,
      mobilePhoneNo: '250785971082',
      requestTransactionId: 'RT-001',
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/requestpayment/')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    // Body must be a URL-encoded string, not a JSON string
    expect(typeof options.body).toBe('string')
    expect(() => JSON.parse(options.body)).toThrow()
    expect(options.body).toContain('username=bob')
    expect(options.body).toContain('accountno=123456')
    expect(options.body).toContain('requesttransactionid=RT-001')
  })

  // Document Section 2.5: accountno is Mandatory ("Yes") in the parameter table,
  // even though the illustrative Python example in 2.3 omits it. The parameter
  // table is treated as authoritative over the (incomplete) example.
  it('includes accountno even though the document example omits it (doc 2.3 vs 2.5 table)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'Pending', success: true, responsecode: '1000' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.requestPayment({
      amount: 100,
      mobilePhoneNo: '250785971082',
      requestTransactionId: 'RT-002',
    })

    const body: string = mockFetch.mock.calls[0][1].body
    const params = new URLSearchParams(body)
    expect(params.get('accountno')).toBe('123456')
  })

  // Document Section 2.4: password = SHA256(username + accountno + partnerpassword
  // + timestamp), hexdigest. Verified with a deterministic timestamp.
  it('generates the request password as SHA256(username+accountno+partnerpassword+timestamp) hexdigest (doc 2.4)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'Pending', success: true, responsecode: '1000' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.requestPayment({
      amount: 100,
      mobilePhoneNo: '250785971082',
      requestTransactionId: 'RT-003',
    })

    const body: string = mockFetch.mock.calls[0][1].body
    const params = new URLSearchParams(body)
    const timestamp = params.get('timestamp')!
    const actualPassword = params.get('password')!

    // Recompute independently using the documented formula
    const expected = crypto
      .createHash('sha256')
      .update('bob' + '123456' + 'secretpass' + timestamp)
      .digest('hex')

    expect(actualPassword).toBe(expected)
    // SHA256 hexdigest must always be 64 lowercase hex characters.
    // Note: the document's own illustrative example password
    // ('d3cfd05492a2376003f5af9e2e6643b67') is only 33 characters and is
    // therefore NOT a valid SHA256 hexdigest — it is an illustrative
    // placeholder, not a verifiable test vector. See
    // PAY-002-RequestPayment-Audit.md Section 3.
    expect(actualPassword).toMatch(/^[a-f0-9]{64}$/)
  })

  // Document Section 2.5: timestamp format is "yyyymmddhhmmss", UTC preferred.
  it('generates timestamp in yyyymmddhhmmss UTC format (doc 2.5)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'Pending', success: true, responsecode: '1000' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.requestPayment({
      amount: 100,
      mobilePhoneNo: '250785971082',
      requestTransactionId: 'RT-004',
    })

    const body: string = mockFetch.mock.calls[0][1].body
    const params = new URLSearchParams(body)
    const timestamp = params.get('timestamp')!
    expect(timestamp).toMatch(/^\d{14}$/)

    // Cross-check against UTC "now" (allow small execution skew)
    const now = new Date()
    const expectedPrefix = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
    expect(timestamp.startsWith(expectedPrefix)).toBe(true)
  })
})

describe('PAY-002: RequestDeposit — Document Section 3 Conformance', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.INTOUCH_USERNAME = 'bob'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_PARTNER_PASSWORD = 'secretpass'
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
  })

  // Document Section 3.3: requests.post(url, data=data) — form-encoded, same as
  // RequestPayment.
  it('sends RequestDeposit as application/x-www-form-urlencoded (doc section 3.3)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ requesttransactionid: '1201', success: true, responsecode: '2001' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.requestDeposit({
      amount: 100,
      mobilePhoneNo: '250785971082',
      requestTransactionId: 'RT-DEP-001',
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/requestdeposit/')
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(() => JSON.parse(options.body)).toThrow()
  })
})

describe('PAY-002: GetTransactionStatus — Document Section 4 Conformance', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.INTOUCH_USERNAME = 'bob'
    process.env.INTOUCH_ACCOUNT_NO = '123456'
    process.env.INTOUCH_PARTNER_PASSWORD = 'secretpass'
    process.env.INTOUCH_API_URL = 'https://www.intouchpay.co.rw/api'
  })

  // Document Section 4.2: "The URI is provided by Intouchpay in the following
  // format: http://IP:Port/api/gettransactionstatus/". PAY-001 code inspection
  // (pre-document) referenced a `/paymentstatus/` endpoint that does not exist
  // anywhere in the supplied document. This is corrected in PAY-002.
  it('calls the documented /gettransactionstatus/ endpoint, not /paymentstatus/ (doc 4.2)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, responsecode: '1000', status: 'Pending', message: 'Pending' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.getPaymentStatus('RT-001')

    const url = mockFetch.mock.calls[0][0]
    expect(url).toContain('/gettransactionstatus/')
    expect(url).not.toContain('/paymentstatus/')
  })

  // Document Section 4.5: both `requesttransactionid` and `transactionid` are
  // Mandatory ("Yes"). Omitting either is a documented protocol violation.
  it('includes both requesttransactionid and transactionid when the provider transactionid is known (doc 4.5)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, responsecode: '1000', status: 'Pending', message: 'Pending' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.getPaymentStatus('RT-001', '1425')

    const body = mockFetch.mock.calls[0][1].body
    const parsed = JSON.parse(body)
    expect(parsed.requesttransactionid).toBe('RT-001')
    expect(parsed.transactionid).toBe('1425')
  })

  // Document Section 4.3 example uses `requests.post(url, json=data)` — JSON
  // encoding — which directly contradicts the blanket statement in 1.2 ("http-form
  // post"). Because the GetTransactionStatus-specific example is more directly
  // relevant than the generic statement, JSON encoding is retained for this
  // endpoint. This is flagged PROVIDER-CONFIRMATION-REQUIRED in
  // PAY-002-RequestPayment-Audit.md — not silently resolved.
  it('sends GetTransactionStatus as JSON, matching the doc 4.3 example (flagged ambiguous vs section 1.2)', async () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, responsecode: '1000', status: 'Pending', message: 'Pending' }),
    })
    global.fetch = mockFetch as any

    await InTouchService.getPaymentStatus('RT-001', '1425')

    const options = mockFetch.mock.calls[0][1]
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(() => JSON.parse(options.body)).not.toThrow()
  })
})

describe('PAY-002: Response Code Semantics — Document Sections 2.9 / 3.7 / 4.7', () => {
  it('treats "01" as payment success (doc 4.7: "Transaction Successful for Payment Transaction")', () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    expect(InTouchService.isSuccess('01')).toBe(true)
  })

  it('does NOT treat "2001" as a customer-payment success (doc 4.7: "...for Deposit Transaction")', () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    expect(InTouchService.isSuccess('2001')).toBe(false)
  })

  it('does NOT treat "1110" as success (doc 3.7: "Duplicate Remit ID" — a RequestDeposit failure code)', () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    expect(InTouchService.isSuccess('1110')).toBe(false)
  })

  it('treats "1000" as pending for both RequestPayment (doc 2.9) and GetTransactionStatus (doc 4.7)', () => {
    const { InTouchService } = require('@/lib/services/intouch.service')
    expect(InTouchService.isPending('1000')).toBe(true)
  })
})
