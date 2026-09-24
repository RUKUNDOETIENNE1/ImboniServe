# GPV-001: Controlled Customer #1 Test Business Onboarding

**Phase:** GPV-001 — Guided Platform Verification
**Date:** 2026-08-08
**Status:** PASS — Signup, MFA, and Dashboard all verified (after GPV-D001 remediation)

---

## Test Setup

| Field | Value |
|---|---|
| Test user name | GPV Test Manager |
| Test user email | gpv-test@imboniserve-test.com |
| Test user phone | 0788123456 |
| Test business name | GPV Test Restaurant |
| Country | RW (Rwanda) |
| Business type | RESTAURANT |
| Plan | STARTER |
| Endpoint | `POST /api/auth/signup` |

---

## Step 1: Signup — PASS

**Request:**
```json
{
  "name": "GPV Test Manager",
  "email": "gpv-test@imboniserve-test.com",
  "password": "GPV-Test-2026!",
  "phone": "0788123456",
  "businessName": "GPV Test Restaurant",
  "city": "Kigali",
  "country": "RW",
  "businessType": "RESTAURANT",
  "planCode": "STARTER"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "cmsk4x2p900006gygp5iknc6b",
    "name": "GPV Test Manager",
    "email": "gpv-test@imboniserve-test.com"
  },
  "restaurant": {
    "id": "cmsk4x4c900026gygb3x5f8r6",
    "name": "GPV Test Restaurant"
  },
  "isFoundingMember": true,
  "attribution": null,
  "trialDays": 14
}
```

### Business Configuration Verification (GR-001A)

| Field | Expected (from country config) | Actual | Result |
|---|---|---|---|
| country | RW (user-selected) | RW | PASS |
| currency | RWF (from `getCountryDefaults('RW')`) | RWF | PASS |
| timezone | Africa/Kigali (from country config) | Africa/Kigali | PASS |
| taxRate | 18 (from country config) | 18 | PASS |
| taxMode | EXCLUSIVE (from country config) | EXCLUSIVE | PASS |
| businessType | RESTAURANT (user-selected) | RESTAURANT | PASS |
| planId | STARTER plan | Starter plan (cms6jn4t80000tkbzuqy7v2ct) | PASS |
| approvalStatus | APPROVED (auto-approved) | APPROVED | PASS |
| isFoundingMember | true (founding period) | true | PASS |
| trialStartDate | Now | 2026-08-08T08:51:42.434Z | PASS |
| trialEndDate | +14 days | 2026-08-22T08:51:42.434Z | PASS |
| isActive | true | true | PASS |

### User Configuration Verification

| Field | Expected | Actual | Result |
|---|---|---|---|
| name | GPV Test Manager | GPV Test Manager | PASS |
| email | gpv-test@imboniserve-test.com | gpv-test@imboniserve-test.com | PASS |
| roles | [OWNER] | [OWNER] | PASS |
| businessId | Linked to business | cmsk4x4c900026gygb3x5f8r6 | PASS |

### Plan Verification

| Field | Expected | Actual | Result |
|---|---|---|---|
| name | Starter | Starter | PASS |
| code | STARTER | STARTER | PASS |
| priceCents | 1,000,000 (10,000 RWF) | 1000000 | PASS |
| currency | RWF | RWF | PASS |

### GR-001A Verification Result

**PASS** — All geographic configuration was correctly derived from the selected country code (`RW`). No hardcoded assumptions were used. The `getCountryDefaults()` function correctly populated:
- Currency: RWF
- Timezone: Africa/Kigali
- Tax rate: 18
- Tax mode: EXCLUSIVE

### Partnership Event

Server log confirmed:
```
ℹ️ [08:51:45] Partnership event emitted
ℹ️ [08:51:45] [biz:x5f8r6] Attribution recorded
```

---

## Step 2: Pre-Login (MFA Step 1) — PASS (after GPV-D001 remediation)

**Initially FAILED** with 500 Internal Server Error due to GPV-D001 (Prisma schema drift — `pendingToken` field missing from schema). After remediation (adding `pendingToken String? @unique` to `UserLoginOtp` model, regenerating Prisma client, restarting server), the endpoint now works correctly.

**Request:**
```json
{
  "email": "gpv-test@imboniserve-test.com",
  "password": "GPV-Test-2026!",
  "debugRequestId": "GPV-MFA-TEST"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "otpRequired": true,
  "maskedEmail": "gp***@imboniserve-test.com",
  "channel": "email",
  "message": "A 6-digit code was sent to gp***@imboniserve-test.com.",
  "pendingToken": "c7997ae5aa5d60023140f26533c20ed82a31d9ee8238159832f65b9326b19332"
}
```

---

## Step 3: Verify OTP (MFA Step 2) — PASS

**Request:** `POST /api/auth/verify-mfa-otp` with OTP `571482`

**Response:** `200 OK`
```json
{
  "success": true,
  "confirmToken": "24f8b32fb3d349db8379869dfcbfcca281beed2ddfad69f6186c17664256acca",
  "email": "gpv-test@imboniserve-test.com"
}
```

---

## Step 4: NextAuth Session Creation — PASS

**Request:** `POST /api/auth/callback/mfa-confirm` with confirmToken

**Response:** `200 OK` — `{"url":"http://localhost:3000/dashboard"}`

**Session:**
```json
{
  "user": {
    "name": "GPV Test Manager",
    "email": "gpv-test@imboniserve-test.com",
    "id": "cmsk4x2p900006gygp5iknc6b",
    "roles": ["OWNER"],
    "role": "OWNER",
    "businessId": "cmsk4x4c900026gygb3x5f8r6",
    "planCode": "STARTER",
    "trialEndDate": "2026-08-22T08:51:42.434Z"
  }
}
```

---

## Step 5: Dashboard Access — PASS

**Request:** `GET /dashboard` → `200 OK` (not redirected to login)

**Dashboard Stats API:** `GET /api/dashboard/stats` → `200 OK`
```json
{
  "todaySales": {"revenue": 0, "count": 0, "change": "0%"},
  "staff": {"total": 1, "active": 1},
  "inventory": {"lowStockCount": 0},
  "tables": []
}
```

**Dashboard Sales Chart API:** `GET /api/dashboard/sales-chart` → `200 OK` (24-hour data, all zeros — expected for new business)

---

## Step 6: Resend OTP — PASS

**Request:** `POST /api/auth/resend-otp` with pendingToken

**Response:** `200 OK` — New OTP sent, new pendingToken returned. Confirms `pendingToken` field works for both writes and reads.

---

## Summary

| Step | Status | Notes |
|---|---|---|
| Signup | PASS | Business created with correct GR-001A config |
| Business config (GR-001A) | PASS | All geographic config derived from country code |
| Pre-login (MFA step 1) | PASS | Fixed after GPV-D001 remediation |
| Verify OTP (MFA step 2) | PASS | OTP verified, confirmToken issued |
| Session creation | PASS | NextAuth mfa-confirm provider works |
| Dashboard access | PASS | Authenticated access works |
| Dashboard stats API | PASS | Returns correct data |
| Dashboard sales chart API | PASS | Returns correct data |
| Resend OTP | PASS | pendingToken read/write works |

**All onboarding steps PASS.** GPV-001 can proceed to workflow verification phases (5-24).
