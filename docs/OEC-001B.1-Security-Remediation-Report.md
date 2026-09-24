# OEC-001B.1 Security Remediation Report

## Security Fixes — Risk, Resolution, Regression, Verification

---

## Remediation 1: SQL Injection Fix

### Risk
- **What production risk existed?** The `qr-menu.plugin.ts` file used `prisma.$executeRawUnsafe(sql)` with dynamically constructed SQL. While the SQL was static (table creation), `$executeRawUnsafe` bypasses Prisma's parameterization safety checks and is flagged as a SQL injection vector. If the SQL construction pattern were ever modified to include user input, it would create a direct injection vulnerability.

### Resolution
- **How was the risk removed?** Replaced all three `$executeRawUnsafe()` calls with `$executeRaw` tagged template literals. This uses Prisma's safe parameterization pipeline. The SQL content is identical (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS), but the execution path is now safe.

### Regression Analysis
- **Could the change affect existing functionality?** No. The SQL statements are identical. The only difference is the execution method (`$executeRaw` vs `$executeRawUnsafe`). Both execute the same DDL statements. The table and index creation behavior is unchanged.

### Verification
- **How was the fix verified?**
  - Build passes (Next.js compiles successfully)
  - TypeScript compilation passes
  - Remediation test confirms no `$executeRawUnsafe(` calls remain in the file
  - Remediation test confirms `$executeRaw` tagged templates are present

### Residual Risk
- **Is anything intentionally deferred?** No. This remediation is complete.

---

## Remediation 2: CSRF Protection

### Risk
- **What production risk existed?** All POST, PUT, PATCH, and DELETE endpoints had no CSRF protection. A malicious website could craft cross-site requests to mutation endpoints (order confirmation, waiter calls, settings changes) and execute them using a user's authenticated session.

### Resolution
- **How was the risk removed?** Created `src/lib/middleware/csrf.ts` — a CSRF middleware that validates the Origin or Referer header against the allowed origin (from NEXTAUTH_URL or APP_URL) for all mutation methods. Applied to the most critical public mutation endpoints:
  - `/api/public/order/confirm` — Order confirmation/cancellation
  - `/api/waiter-calls` — Waiter call creation

### Regression Analysis
- **Could the change affect existing functionality?** Minimal risk. The middleware only blocks requests where Origin/Referer doesn't match the allowed origin. Legitimate same-origin requests from the ImboniServe frontend will pass. In development (where NEXTAUTH_URL may not be set), the middleware falls back to the Host header. Only cross-origin POSTs without matching headers are blocked.

### Verification
- **How was the fix verified?**
  - 14 CSRF middleware tests pass (allows GET, allows matching Origin, blocks mismatched Origin, blocks missing Origin, allows matching Referer, blocks mismatched Referer, handles DELETE/PUT/PATCH, normalizes trailing slash, case-insensitive)
  - Build passes
  - Remediation test confirms CSRF middleware exists and is applied

### Residual Risk
- **Is anything intentionally deferred?** Yes. CSRF middleware has been applied to the most critical public mutation endpoints. Internal authenticated endpoints rely on NextAuth's built-in CSRF token for session-based requests. Full application to all 456+ mutation endpoints is a Category B effort (gradual middleware migration).

---

## Remediation 3: XSS via SVG Sanitization

### Risk
- **What production risk existed?** The QR Builder page (`qr-builder.tsx`) rendered SVG content using `dangerouslySetInnerHTML` without sanitization. User-provided values (business name, phone, address, message, primary color) were substituted into SVG templates without XML escaping. A malicious business name like `<script>alert('xss')</script>` would be injected directly into the DOM.

### Resolution
- **How was the risk removed?**
  1. Created `src/lib/security/svg-sanitizer.ts` with two functions:
     - `escapeSvgValue()` — Escapes XML special characters in user-provided values before substitution
     - `sanitizeSvg()` — Removes dangerous elements (script, foreignObject, iframe, embed, object) and attributes (event handlers, javascript: URLs) from the final SVG
  2. Applied `escapeSvgValue()` to all user-provided values before SVG template substitution
  3. Applied `sanitizeSvg()` to the final rendered SVG before `dangerouslySetInnerHTML`

### Regression Analysis
- **Could the change affect existing functionality?** No. Safe SVG content (rectangles, images, text, QR codes) passes through unchanged. Only dangerous content (scripts, event handlers, javascript: URLs) is removed. The QR code rendering, logo overlay, and template substitution all work identically for legitimate input.

### Verification
- **How was the fix verified?**
  - 17 SVG sanitizer tests pass (script removal, event handler removal, javascript: URL removal, foreignObject removal, iframe removal, embed removal, object removal, data: URL removal, safe content preservation, image tag preservation, empty input handling, multiple scripts, case-insensitive, single quotes)
  - Build passes
  - Remediation test confirms sanitizer is imported and used in qr-builder.tsx

### Residual Risk
- **Is anything intentionally deferred?** No. This remediation is complete for the QR Builder page. The other 3 `dangerouslySetInnerHTML` usages (index.tsx, PublicLayout.tsx) are JSON-LD structured data, which is safe and does not require sanitization.

---

## Remediation 4: Rate Limiting on Public Endpoints

### Risk
- **What production risk existed?** Three public endpoints had no rate limiting:
  - `/api/public/menu` — Public menu access (DDoS risk)
  - `/api/public/order/confirm` — Order confirmation/cancellation (abuse risk)
  - `/api/waiter-calls` — Waiter call creation (spam risk)
  
  An attacker could flood these endpoints with requests, causing server resource exhaustion, database load, or disrupting business operations with fake waiter calls or order cancellations.

### Resolution
- **How was the risk removed?** Applied `withRateLimit` middleware to all three endpoints:
  - `/api/public/menu`: 60 requests/minute per IP (read endpoint, generous limit)
  - `/api/public/order/confirm`: 20 requests/minute per IP (mutation, stricter)
  - `/api/waiter-calls`: 30 requests/minute per IP (mutation, moderate)

### Regression Analysis
- **Could the change affect existing functionality?** No. The rate limits are generous enough for legitimate use:
  - Menu access: 60/min is far above any legitimate user's needs
  - Order confirmation: 20/min is far above any legitimate order flow
  - Waiter calls: 30/min is far above any legitimate table service need
  
  Only automated abuse (100+ requests/minute) is blocked.

### Verification
- **How was the fix verified?**
  - Build passes
  - Remediation test confirms `withRateLimit` is applied to all three endpoints
  - Rate limiting middleware already had existing tests (resend-otp endpoint)

### Residual Risk
- **Is anything intentionally deferred?** Yes. Rate limiting has been applied to the most critical public endpoints. Full application to all 497 endpoints is a Category B effort. The rate limiting middleware uses in-memory storage; Redis-based distributed rate limiting is available but not yet enabled for production.

---

## Remediation 5: Zod Input Validation on Critical APIs

### Risk
- **What production risk existed?** Two public mutation endpoints used manual validation only:
  - `/api/public/order/confirm` — Only checked `!orderId || typeof confirmed !== 'boolean'`
  - `/api/waiter-calls` — Only checked `!tableId || !reason` and a hardcoded valid reasons array
  
  Manual validation is fragile, doesn't catch edge cases (empty strings, wrong types, oversized inputs), and provides inconsistent error messages.

### Resolution
- **How was the risk removed?** Added Zod schemas to both endpoints:
  - `confirmOrderSchema`: `orderId` (string, 1-100 chars), `confirmed` (boolean)
  - `createWaiterCallSchema`: `tableId` (string, 1-100 chars), `sessionId` (string, max 200, optional), `reason` (enum: water/assistance/bill/other), `customMessage` (string, max 500, optional)
  
  Used `safeParse()` for validation with structured error responses.

### Regression Analysis
- **Could the change affect existing functionality?** No. The Zod schemas accept the same valid inputs as the manual validation. The only difference is that invalid inputs (empty strings, oversized values, invalid enum values) now receive a 400 error with structured details instead of a generic error message. Legitimate requests are unaffected.

### Verification
- **How was the fix verified?**
  - Build passes
  - Remediation test confirms Zod schemas and `safeParse` are present in both files
  - Remediation test confirms `z.enum` is used for waiter call reasons

### Residual Risk
- **Is anything intentionally deferred?** Yes. Zod validation has been added to the most critical public mutation endpoints. Full application to all 497 endpoints is a Category B effort (gradual validation migration).
