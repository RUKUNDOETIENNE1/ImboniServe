/**
 * PAY-003 — Callback URL Consistency Across Payment Paths
 *
 * Forensic finding (PAY-003 re-check): `INTOUCH_CALLBACK_URL` is only
 * respected by two of the five InTouch payment initiation paths:
 *   ✅ src/pages/api/checkout/tap-and-leave.ts  (fixed in PAY-002)
 *   ✅ src/lib/payments/providers/intouch.provider.ts  (always respected)
 *   ❌ src/pages/api/payments/intouch/initiate.ts  (hardcoded NEXTAUTH_URL)
 *   ❌ src/pages/api/reservations/[id]/deposit/initiate.ts  (hardcoded NEXTAUTH_URL, x2)
 *   ❌ src/pages/api/reservations/[id]/cancel.ts  (hardcoded NEXTAUTH_URL, x2)
 *
 * During sandbox testing behind an ngrok tunnel, the founder sets
 * INTOUCH_CALLBACK_URL to the tunnel URL. The three non-conforming paths
 * will silently send InTouch a callback URL derived from NEXTAUTH_URL
 * (typically http://localhost:3000), which is unreachable from the public
 * internet — the webhook will never arrive for those flows.
 *
 * This test documents the INCONSISTENCY so it is tracked. It does NOT fix
 * the non-conforming paths — that is a founder decision (PAY-003 is
 * documentation/certification prep, not a code-change mission). The test
 * asserts the CURRENT (partially broken) state so any future change is
 * detected.
 */

import * as fs from 'fs'
import * as path from 'path'

describe('PAY-003: INTOUCH_CALLBACK_URL consistency across payment paths', () => {
  const srcRoot = path.resolve(__dirname, '../../src')

  function readFile(rel: string): string {
    return fs.readFileSync(path.join(srcRoot, rel), 'utf-8')
  }

  // Paths that SHOULD respect INTOUCH_CALLBACK_URL (and do).
  it('tap-and-leave.ts respects INTOUCH_CALLBACK_URL with NEXTAUTH_URL fallback', () => {
    const src = readFile('pages/api/checkout/tap-and-leave.ts')
    expect(src).toMatch(/INTOUCH_CALLBACK_URL\s*\|\|\s*.*NEXTAUTH_URL/)
  })

  it('intouch.provider.ts respects INTOUCH_CALLBACK_URL with APP_URL fallback', () => {
    const src = readFile('lib/payments/providers/intouch.provider.ts')
    expect(src).toMatch(/INTOUCH_CALLBACK_URL\s*\|\|\s*.*APP_URL/)
  })

  // Paths that do NOT respect INTOUCH_CALLBACK_URL (documented defect).
  // These assertions describe the current broken state — when fixed, the
  // test must be updated to assert conformance.
  it('payments/intouch/initiate.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)', () => {
    const src = readFile('pages/api/payments/intouch/initiate.ts')
    expect(src).not.toMatch(/INTOUCH_CALLBACK_URL/)
    // Confirms it hardcodes NEXTAUTH_URL only
    expect(src).toMatch(/NEXTAUTH_URL.*\/api\/webhooks\/intouch/)
  })

  it('reservations/[id]/deposit/initiate.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)', () => {
    const src = readFile('pages/api/reservations/[id]/deposit/initiate.ts')
    expect(src).not.toMatch(/INTOUCH_CALLBACK_URL/)
    expect(src).toMatch(/NEXTAUTH_URL.*\/api\/webhooks\/intouch/)
  })

  it('reservations/[id]/cancel.ts does NOT reference INTOUCH_CALLBACK_URL (DEFECT — tracked)', () => {
    const src = readFile('pages/api/reservations/[id]/cancel.ts')
    expect(src).not.toMatch(/INTOUCH_CALLBACK_URL/)
    expect(src).toMatch(/NEXTAUTH_URL.*\/api\/webhooks\/intouch/)
  })
})

/**
 * PAY-003 — Refund Success Code Defect (P0, carried from PAY-002)
 *
 * src/pages/api/payments/refunds.ts line 97 compares the InTouch deposit
 * response to '200' instead of the documented '2001' ("Transaction
 * Successful for Deposit Transaction", doc Section 4.7). This means
 * successful refunds will be incorrectly treated as failed.
 *
 * This was identified in PAY-002 but explicitly left unfixed (out of
 * scope). This test documents the current (broken) state so the defect
 * is tracked and any future fix is detected.
 */
describe('PAY-003: refund success code defect (P0 — documented, not yet fixed)', () => {
  const srcRoot = path.resolve(__dirname, '../../src')

  it('refunds.ts currently compares deposit success to "200" instead of documented "2001"', () => {
    const src = fs.readFileSync(
      path.join(srcRoot, 'pages/api/payments/refunds.ts'),
      'utf-8'
    )
    // Documents the current broken state
    expect(src).toMatch(/responsecode\s*===\s*'200'/)
    // Confirms the documented correct code is NOT yet used
    expect(src).not.toMatch(/responsecode\s*===\s*'2001'/)
  })
})
