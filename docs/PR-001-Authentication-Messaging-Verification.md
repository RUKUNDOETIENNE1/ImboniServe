# PR-001 Authentication & Messaging Verification

| Field | Value |
|---|---|
| Date | 2026-08-09 |
| Scope | Code path verification + config presence check from dev workstation |

## Authentication Architecture

The platform uses a custom MFA flow built on NextAuth:

```
Login (email + password)
  → pre-login.ts (password validation)
  → OTP generation (otp.service.ts)
  → OTP delivery (email.service.ts + whatsapp.service.ts)
  → verify-mfa-otp.ts (OTP verification)
  → [...nextauth].ts (session creation)
  → Authenticated dashboard
```

### Code Paths Verified

| File | Size | Status |
|---|---|---|
| src/pages/api/auth/pre-login.ts | 5419 bytes | VERIFIED (exists) |
| src/pages/api/auth/verify-mfa-otp.ts | 3380 bytes | VERIFIED (exists) |
| src/pages/api/auth/[...nextauth].ts | — | VERIFIED (exists) |
| src/pages/api/auth/signup.ts | — | VERIFIED (exists) |
| src/pages/api/auth/resend-otp.ts | — | VERIFIED (exists) |
| src/pages/api/auth/forgot-password.ts | — | VERIFIED (exists) |
| src/pages/api/auth/reset-password.ts | — | VERIFIED (exists) |
| src/pages/api/auth/security-events.ts | — | VERIFIED (exists) |
| src/pages/api/auth/sessions.ts | — | VERIFIED (exists) |
| src/lib/services/otp.service.ts | 4315 bytes | VERIFIED (exists) |
| src/lib/services/email.service.ts | 20352 bytes | VERIFIED (exists) |
| src/lib/services/whatsapp.service.ts | 7758 bytes | VERIFIED (exists) |

## Email OTP

| Item | Status | Evidence |
|---|---|---|
| SMTP host | CONFIGURED | smtp.gmail.com |
| SMTP port | CONFIGURED | 465 |
| SMTP user | CONFIGURED | Set (redacted) |
| SMTP password | CONFIGURED | Set (redacted) |
| SMTP_SECURE | NOT CONFIGURED | Not set in .env. Template requires "true" for production. |
| SMTP_FROM | CONFIGURED | "Imboni Serve <steve.aimviews@gmail.com>" |
| OTP delivery (email) | CONFIGURED-BUT-NOT-VERIFIED | GPV e2e tests retrieved OTP from DB (not via email). Production email delivery not verified. |
| OTP verification | VERIFIED (dev e2e) | GPV e2e tests verified OTP verification works via DB-retrieved OTP. |
| OTP expiration | VERIFIED (dev e2e) | GPV e2e tests confirmed OTP expiration (15-minute window). |
| Rate limiting | VERIFIED (code) | Rate limiting middleware exists (withRateLimit). |

### Email OTP Issues

1. **SMTP_SECURE not set** — The .env.production.template requires `SMTP_SECURE="true"` for production. Current .env does not set this. Gmail SMTP on port 465 requires SSL/TLS (secure=true).

2. **Sender identity** — `SMTP_FROM` uses `steve.aimviews@gmail.com`, a personal Gmail address. Production should use a branded domain email (e.g., `noreply@imboniserve.com`).

3. **Gmail limitations** — Gmail SMTP has sending limits (~500/day for consumer accounts). Production should use a dedicated email service (SendGrid, AWS SES, Postmark).

## WhatsApp OTP

| Item | Status | Evidence |
|---|---|---|
| Twilio account | CONFIGURED | TWILIO_ACCOUNT_SID set |
| Twilio auth token | CONFIGURED | TWILIO_AUTH_TOKEN set |
| WhatsApp number | CONFIGURED | TWILIO_WHATSAPP_NUMBER set (52 chars, redacted) |
| Phone number | CONFIGURED | TWILIO_PHONE_NUMBER set (51 chars, redacted) |
| WhatsApp OTP delivery | BLOCKED | GPV e2e tests show Twilio error 63007: "could not find a Channel with the specified From address" |
| WhatsApp OTP verification | VERIFIED (code) | Code path exists. Verification logic works (same as email OTP). |

### WhatsApp OTP Issues

1. **Twilio error 63007** — "Twilio could not find a Channel with the specified From address." This means the WhatsApp Business channel is not properly configured in Twilio. The Twilio WhatsApp Business API requires:
   - A registered WhatsApp Business number
   - Approved WhatsApp template messages
   - The sender must be a configured WhatsApp channel

2. **Fallback behavior** — The system falls back to email-only OTP delivery when WhatsApp fails. This was observed in GPV e2e: WhatsApp delivery fails, email delivery succeeds (or DB retrieval used).

## MFA Cycle

| Step | Status | Evidence |
|---|---|---|
| Login (email + password) | VERIFIED (dev e2e) | GPV e2e tests performed login via pre-login endpoint |
| MFA challenge | VERIFIED (dev e2e) | System generates OTP and returns challenge |
| OTP delivery (email) | CONFIGURED-BUT-NOT-VERIFIED | Email delivery not verified end-to-end (DB retrieval used in tests) |
| OTP delivery (WhatsApp) | BLOCKED | Twilio error 63007 |
| OTP verification | VERIFIED (dev e2e) | GPV e2e tests verified OTP via verify-mfa-otp endpoint |
| Session creation | VERIFIED (dev e2e) | GPV e2e tests confirmed authenticated session |
| Authenticated dashboard | VERIFIED (dev e2e) | GPV e2e tests accessed dashboard endpoints |

### Production MFA Cycle

**NOT VERIFIED.** The full MFA cycle has only been verified in the development environment using DB-retrieved OTPs. Production verification requires:
1. Real email delivery confirmation
2. WhatsApp channel fix (Twilio error 63007)
3. End-to-end test from production domain

## Security Concerns

| Item | Status | Evidence |
|---|---|---|
| ALLOW_LEGACY_CREDENTIALS | MISCONFIGURED | Set to `true` in .env. Template explicitly states: "Do NOT enable in production." |
| NEXTAUTH_URL | MISCONFIGURED | Set to http://localhost:3000 (not production domain) |
| NEXTAUTH_SECRET | CONFIGURED | Set (redacted, appears to be a proper secret) |

## Conclusion

The authentication code paths are complete and verified in development. However:
1. **WhatsApp OTP is broken** (Twilio error 63007) — critical blocker for WhatsApp MFA
2. **Email OTP delivery is not verified** end-to-end (only DB retrieval tested)
3. **SMTP_SECURE is not set** — may cause email delivery issues in production
4. **ALLOW_LEGACY_CREDENTIALS=true** — security risk, must be false in production
5. **Production MFA cycle is NOT verified** — cannot verify without production environment

**Status: 🔴 Authentication NOT VERIFIED for production. WhatsApp OTP BLOCKED.**
