# PAY-002 — RequestPayment Audit

| Field | Value |
|---|---|
| Document ID | PAY-002-REQUESTPAYMENT-AUDIT |
| Date | 2026-08-14 |
| Scope | `src/lib/services/intouch.service.ts` (legacy — used by Tap & Leave) and `src/lib/payments/providers/intouch.provider.ts` (modern — used by marketplace/subscriptions) |

## 1. Method-by-Method Verification

| Item | Document Requirement | InTouchProvider (modern) | InTouchService (legacy, post-fix) | Classification |
|---|---|---|---|---|
| Endpoint | `/api/requestpayment/` (2.2) | ✅ | ✅ | CONFORMS |
| HTTP method | POST (implicit from `requests.post`) | ✅ | ✅ | CONFORMS |
| Encoding | http-form POST (1.2, 2.3 example) | ✅ `application/x-www-form-urlencoded` via `URLSearchParams` | ✅ Fixed to `application/x-www-form-urlencoded` via `URLSearchParams` (was `application/json`) | FIXED (P1 → CONFORMS) |
| `username` | Mandatory | ✅ from `INTOUCH_USERNAME` | ✅ from `INTOUCH_USERNAME` | CONFORMS |
| `accountno` | Mandatory (table 2.5); **absent from the illustrative example (2.3)** | ✅ sent | ✅ sent | CONFORMS — table treated as authoritative over incomplete example |
| `timestamp` | `yyyymmddhhmmss`, UTC preferred | ✅ `getUTCFullYear/Month/Date/Hours/Minutes/Seconds`, zero-padded | ✅ identical implementation | CONFORMS |
| `amount` | string/Float/Integer | ✅ number, form-encoded (coerced to string by `URLSearchParams`) | ✅ `.toString()` explicitly | CONFORMS |
| `mobilephoneno` / `mobilephone` | Ambiguous — table (2.5) says `mobilephoneno`; example (2.3) says `mobilephone` | Uses `mobilephone` (matches example) | Uses `mobilephoneno` (matches table) | **PROVIDER-CONFIRMATION-REQUIRED** — the two implementations disagree with each other because the document disagrees with itself. Neither has been sandbox-verified. |
| Phone format | No `+`, no spaces, country code prefix (e.g. `250785971082` from example) | ✅ strips `+` and spaces | ✅ `normalizePhoneForProvider()` strips all non-digits | CONFORMS |
| `requesttransactionid` | Mandatory, unique | ✅ `IMBONI-{orderId}-{timestamp}` | ✅ `IMBONI_{timestamp}_{random}` (Tap & Leave: `InTouchService.generateRequestTransactionId()`) | CONFORMS (uniqueness); character set (hyphens/underscores) not tested against provider — see Section 4 |
| `password` | SHA256(username+accountno+partnerpassword+timestamp) hexdigest | ✅ | ✅ | CONFORMS — see Section 3 for deterministic verification |
| `callbackurl` | Optional | ✅ prefers `INTOUCH_CALLBACK_URL`, falls back to `${APP_URL}/api/webhooks/intouch` | ✅ (as passed by caller) — **caller now fixed to prefer `INTOUCH_CALLBACK_URL`** (see PAY-002-Sandbox-Readiness-Report.md) | CONFORMS (post-fix) |
| Response parsing | JSON body, HTTP 200 | ✅ | ✅ | CONFORMS |
| Pending handling | `status: "Pending"`, `responsecode: "1000"` on acceptance | ✅ treated as in-flight | ✅ `isPending()` checks `'1000'` | CONFORMS |
| Success handling | Terminal success only via webhook/poll, not the initial response | ✅ | ✅ | CONFORMS |
| Failure handling | Non-pending, non-'01' response is a failure | ✅ | ✅ | CONFORMS |
| Timeout | Document: 60s default provider response window | ✅ `fetchWithTimeout(..., 30_000)` — stricter than the document's stated 60s window, fails safe | ⚠️ No explicit timeout wrapper on `fetch()` — relies on platform/Node default (effectively unbounded) | **P2 — legacy service lacks an explicit request timeout; recommend adding one in a follow-up (not blocking sandbox test since InTouch's own SLA is 60s, but a hung TCP connection could stall the Tap & Leave request indefinitely)** |

## 2. Verified Fix: HTTP-Form Encoding

**Before (legacy service):**
```ts
const response = await fetch(`${this.API_URL}/requestpayment/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
```

**After:**
```ts
const response = await fetch(`${this.API_URL}/requestpayment/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(payload as Record<string, string>).toString(),
})
```

This is a direct, unambiguous conformance fix to Section 1.2's explicit statement ("Parameters are submitted to the intouchpay url as http-form post"), corroborated by the Section 2.3 example. Verified by test: `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "sends RequestPayment as application/x-www-form-urlencoded."

## 3. Password Generation — Deterministic Verification

Test vector used (arbitrary, deterministic):
- `username = "bob"`, `accountno = "123456"`, `partnerpassword = "secretpass"`, `timestamp = <captured at call time>`

The test independently recomputes `SHA256(username + accountno + partnerpassword + timestamp)` using Node's `crypto` module and asserts byte-for-byte equality with the value the service places in the `password` field. This is verified in `tests/reliability/pay-002-intouch-document-conformance.test.ts` → "generates the request password as SHA256(...) hexdigest."

**Important limitation:** the document's own illustrative password value (`'d3cfd05492a2376003f5af9e2e6643b67'`, 33 characters) is not a valid SHA256 hexdigest (which must be 64 hex characters), so it cannot serve as an official test vector to confirm the *provider's* implementation matches ours byte-for-byte. Our test proves **internal consistency with the documented formula**, not **agreement with InTouch's server-side computation**. That agreement can only be established by the sandbox test itself (a successful RequestPayment response, rather than an authentication-error response code like `0005` "Invalid Password").

**Concatenation order verified:** `username + accountno + partnerpassword + timestamp` (in that exact order, no separators). Confirmed identical in both `InTouchService.generatePassword()` and `InTouchProvider.generatePassword()`.

**Timestamp source:** `Date` object, UTC getters (`getUTCFullYear()` etc.) — not local time. This matches "preferably in UTC" (2.5).

**Timestamp precision:** to-the-second (`yyyymmddhhmmss`), matching the documented format exactly.

## 4. Open Items Requiring Provider Confirmation

| # | Item | Why It Matters | Resolution Path |
|---|---|---|---|
| 1 | `mobilephone` vs `mobilephoneno` field name | If wrong, InTouch may reject the request with a "missing mobile number" style error, or silently ignore the field and fail to route the USSD prompt | The sandbox test itself will reveal this: a `1200` "Invalid Number" or similar response combined with a valid-looking phone number is a strong signal the field name is wrong for that flow. Ask InTouch support to confirm the authoritative field name in a support ticket (see PAY-002-InTouch-Provider-Questions.md). |
| 2 | `requesttransactionid` allowed character set / max length | Our IDs use hyphens and underscores (`IMBONI-...`, `IMBONI_...`); the document's own examples use bare numeric strings (`'34555'`, `'4522233'`) | Ask InTouch; if the sandbox call fails with an unexpected validation code, retry with a purely numeric ID as a diagnostic step |
| 3 | Explicit request timeout in legacy service | An unbounded `fetch()` could hang the Tap & Leave HTTP request if InTouch's network path stalls | Recommend adding a `fetchWithTimeout` wrapper (already exists and is used by `InTouchProvider`) in a follow-up change; not blocking for the sandbox test itself since InTouch's documented SLA is 60s |

## 5. Certification

RequestPayment, as implemented by the code path the founder will actually exercise (`InTouchService` via Tap & Leave), now conforms to every unambiguous, unconditional statement in the document (encoding, mandatory fields, password formula, timestamp format, phone format, pending/success/failure state handling). The one remaining ambiguity (phone field name) is a genuine document self-contradiction, not a code defect, and is correctly flagged rather than guessed at.
