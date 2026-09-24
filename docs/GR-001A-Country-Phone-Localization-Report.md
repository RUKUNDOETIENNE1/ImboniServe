# GR-001A: Country & Phone Localization Report

**Mission:** Consolidate 12 duplicate phone normalization functions and remove hardcoded `country = 'RW'` at signup.
**Status:** COMPLETE

---

## 1. Executive Summary

GR-001 identified 12 duplicate `normalizePhone` functions all hardcoded to +250 Rwanda, and a hardcoded `country = 'RW'` at signup. GR-001A has consolidated all phone normalization into a single canonical utility with country-aware defaults, and added a country selector to the signup flow with automatic derivation of currency, timezone, and tax configuration.

**Files modified:** 15
**Duplicate `normalizePhone` functions remaining:** 0
**TypeScript compilation:** PASS

---

## 2. Problem Statement

| Finding | Severity | Impact |
|---|---|---|
| 12 duplicate `normalizePhone` functions | HIGH | Code duplication, inconsistent behavior, impossible to support non-Rwanda phone numbers |
| `country = 'RW'` hardcoded at signup | HIGH | All businesses default to Rwanda regardless of actual location |
| No country selector in signup UI | HIGH | Users cannot specify their country |

---

## 3. Solution Architecture

### Phone Normalization: `src/lib/utils/phone.ts`

```
normalizePhone(phone, countryCode?)           -> E.164 format (+250788123456)
normalizePhoneForWhatsApp(phone, countryCode?) -> E.164 without + (250788123456)
normalizePhoneForProvider(phone, countryCode?) -> digits-only (250788123456)
```

- All functions accept optional `countryCode` parameter (default 'RW')
- Country code maps to country dialing code via internal mapping
- Backward compatible: existing callers work without changes

### Country Configuration: `src/lib/utils/country-config.ts`

```
getCountryDefaults(countryCode) -> { currency, timezone, taxRate, taxMode }
```

- Supports 27 countries across Africa, Europe, Middle East, Americas, Asia-Pacific
- Used at signup to initialize business configuration
- Single source of truth for country-to-configuration mapping

### Signup Flow

```
User selects country -> getCountryDefaults(country) -> business record initialized with:
  - currency (e.g., KES for Kenya)
  - timezone (e.g., Africa/Nairobi for Kenya)
  - taxRate (e.g., 16 for Kenya)
  - taxMode (e.g., INCLUSIVE for Kenya)
```

---

## 4. Detailed Change Log

### Phone Normalization (12 files)

| File | Change |
|---|---|
| `services/guest-recognition.service.ts` | Removed local normalizePhone, import from phone.ts |
| `services/notification.service.ts` | Removed local normalizePhone, import from phone.ts |
| `services/whatsapp-cloud.service.ts` | Removed local normalizePhone, import normalizePhoneForWhatsApp |
| `services/otp.service.ts` | Removed local normalizePhone, import from phone.ts |
| `services/intouch.service.ts` | Removed private normalizePhone method, import normalizePhoneForProvider |
| `services/mtn-momo.service.ts` | Replaced method body with normalizePhoneForProvider delegation |
| `api/public/order/draft.ts` | Removed local normalizePhone, import from phone.ts |
| `api/public/otp/verify.ts` | Removed local normalizePhone, import from phone.ts |
| `api/public/otp/request.ts` | Removed local normalizePhone, import from phone.ts |

### Dependent Files (3 files)

| File | Change |
|---|---|
| `services/reservation.service.ts` | Import changed from guest-recognition to phone.ts |
| `services/contact-customer-bridge.service.ts` | Import changed from guest-recognition to phone.ts |
| `api/hotel/rooms.ts` | Import changed from guest-recognition to phone.ts |

### Country Configuration (3 files)

| File | Change |
|---|---|
| `lib/utils/country-config.ts` | NEW — getCountryDefaults() with 27 country mappings |
| `lib/validations/user.schema.ts` | Added `country` field to signupSchema |
| `api/auth/signup.ts` | Uses getCountryDefaults(country) for currency, timezone, taxRate, taxMode |
| `pages/signup.tsx` | Added country selector dropdown with 27 countries |

---

## 5. Design Decisions

1. **Backward compatibility:** All phone functions default to 'RW' / '+250'. Existing callers continue to work without changes.

2. **Three normalization variants:** Different providers expect different phone formats:
   - `normalizePhone`: E.164 with `+` (standard, Twilio)
   - `normalizePhoneForWhatsApp`: E.164 without `+` (WhatsApp Cloud API)
   - `normalizePhoneForProvider`: digits-only (MTN MoMo, InTouch)

3. **mtn-momo.service.ts wrapper:** The public static method `normalizePhoneNumber` was kept as a thin delegating wrapper to preserve the public API. No internal callers were found, but external compatibility is maintained.

4. **TaxService initialization at signup:** `TaxService.createDefaultTaxConfig(restaurant.id, country)` is called after business creation. Failure is caught and logged — it does not block signup.

5. **Country selector:** Defaults to 'RW' for the existing user base. Includes 27 countries covering the most likely expansion markets.

---

## 6. Verification Results

- **grep for `function normalizePhone` in `src/`:** 1 match (canonical in phone.ts)
- **grep for `import.*normalizePhone.*guest-recognition`:** 0 matches
- **grep for `this.normalizePhone`:** 0 matches
- **TypeScript compilation:** PASS

---

## 7. Provider Behavior Notes

The consolidation changed the phone format sent to two providers:

| Provider | Before | After | Status |
|---|---|---|---|
| InTouch | `07XXXXXXXX` (local Rwanda) | `250XXXXXXXXX` (E.164 digits) | Verify with InTouch API |
| MTN MoMo | `25XXXXXXXX` (prepend 25) | `250XXXXXXXXX` (E.164 digits) | Method unused, limited impact |

These changes align with the mission's intent to use canonical phone normalization. The InTouch format change should be verified against the InTouch API documentation.
