# GR-001 — Internationalization & Localization Report

**Phase:** GR-001 — Global Readiness & Localization Certification
**Date:** 2026-08-07
**Status:** Complete

---

## Executive Summary

**Risk Level:** MEDIUM for international expansion; LOW for Rwanda operations.

The platform has translation infrastructure (i18n with en, fr, rw) and a MenuItemTranslation model for multilingual menus. However, most service-layer strings (WhatsApp notifications, email templates, AI responses) are hardcoded in English and not translatable.

---

## 1. UI Translation Infrastructure (✅ Good)

### 1.1 Next.js i18n Configuration
```javascript
// next.config.js lines 77-81
i18n: {
  locales: ['en', 'fr', 'rw'],
  defaultLocale: 'en',
  localeDetection: false,
}
```
3 locales supported: English (default), French, Kinyarwanda.

### 1.2 Translation Files
- `src/locales/en.json` — English translations
- `src/locales/fr.json` — French translations
- `src/locales/rw.json` — Kinyarwanda translations
- `public/locales/en.json` — Duplicate
- `public/locales/fr.json` — Duplicate
- `public/locales/rw.json` — Duplicate
- `src/locales/VERIFIED_KINYARWANDA_TERMBASE.json` — Kinyarwanda termbase

**Issue:** Duplicate locale files between `src/locales` and `public/locales` should be consolidated.

### 1.3 User Language Preference
```prisma
// prisma/schema.prisma line 74
locale String @default("en")

// prisma/schema.prisma line 142 (Business)
defaultLanguage String @default("en")
```
Both User and Business models have language preference fields.

### 1.4 Menu Item Translations
```prisma
// prisma/schema.prisma lines 1738-1750
model MenuItemTranslation {
  id          String   @id @default(cuid())
  menuItemId  String
  locale      String
  name        String
  description String?
  menuItem    MenuItem @relation(...)
  @@unique([menuItemId, locale])
}
```
Menu items support multilingual translations. This is excellent for hospitality businesses serving international guests.

### 1.5 Menu Translation Usage
```typescript
// src/pages/order/index.tsx lines 452-461
function getLocalizedName(item: MenuItem): string {
  if (!item.translations || item.translations.length === 0) return item.name;
  const translation = item.translations.find(t => t.locale === userLanguage);
  return translation?.name || item.name;
}
```
Menu display correctly uses user's language preference to show translated menu items.

---

## 2. Service-Layer Localization (❌ Architecture Risk)

### 2.1 WhatsApp Notifications (❌ Hardcoded English)
```typescript
// src/lib/services/notification.service.ts
const message = `🍽️ NEW ORDER #${order.orderNumber}\n\nItems:\n${itemsList}\n\nTotal: ${formatCurrency(...)}\n\nBusiness: ${order.business.name}`
const message = `⚠️ LOW STOCK ALERT\n\n${restaurant.name}\n\n${itemsList}\n\nAction required: Reorder supplies`
const message = `📊 DAILY REPORT - ${restaurant.name}\n\n💰 Sales: ${formatCurrency(...)}`
const message = `Thank you for dining with ${restaurantName}. Here is your Smart Dining Slip™.`
```
All WhatsApp notification templates are hardcoded in English. No translation support.

### 2.2 Email Templates (❌ Hardcoded English)
```typescript
// src/lib/services/email.service.ts
// Order confirmation, OTP, security alerts, invoices — all in English
```
Email templates are hardcoded in English with inline HTML. No template system or translation support.

### 2.3 AI Responses (❌ English Only)
```typescript
// src/lib/services/smart-menu-builder.service.ts
// OpenAI API calls with English prompts

// src/lib/services/site-builder.service.ts
// OpenAI API calls for content generation — English only
```
AI services use English prompts and generate English content. No language parameter detected.

### 2.4 Commission Invoice (⚠️ Partial)
```typescript
// src/lib/services/commission.service.ts lines 162-206
export function generateCommissionInvoiceText(
  invoice: CommissionInvoice,
  sellerName: string,
  language: 'en' | 'rw' = 'en'
): string {
  lines.push(language === 'en' ? 'IMBONI SERVE - COMMISSION INVOICE' : 'IMBONI SERVE - INYEMEZABUGUZI YA KOMISIYO');
}
```
Commission invoices support English and Kinyarwanda — a positive exception. But this is a manual if/else approach, not a translation system.

### 2.5 Executive Insights (❌ English Only)
```typescript
// src/lib/intelligence/ — AI-generated executive insights
// All insights generated in English
```
Executive dashboard insights are generated in English only.

---

## 3. UI String Localization (⚠️ Mixed)

### 3.1 Using useTranslation (✅ Good)
```typescript
// src/pages/dashboard/tables.tsx
const { t } = useTranslation();
// Uses t('tables.title') etc.
```
Some pages properly use the translation function.

### 3.2 Hardcoded English Strings (❌ Widespread)
```typescript
// src/pages/dashboard/close-day.tsx lines 83, 86
showToast('success', 'Day closed successfully. Z-Report finalized.')
showToast('error', e.message || 'Failed to close day')
```
Many UI strings are hardcoded in English, especially in:
- Toast notifications
- Error messages
- Button labels
- Form validation messages

### 3.3 Kinyarwanda Termbase (✅ Good)
```json
// src/locales/VERIFIED_KINYARWANDA_TERMBASE.json
```
A verified Kinyarwanda translation termbase exists with common terms and feature descriptions. This appears to be a reference/quality control file, not used at runtime.

---

## 4. Date and Number Formatting (⚠️ Mixed)

### 4.1 Date Formatting
```typescript
// ❌ Hardcoded locale
new Date(dateStr).toLocaleDateString('en-US', { ... })

// ✅ Locale-aware
const locale = language === 'rw' ? 'rw-RW' : 'en-RW'
```
Most date formatting uses hardcoded en-US instead of user's locale.

### 4.2 Number Formatting
```typescript
// ❌ Hardcoded locale
convertedAmount.toLocaleString('en-US', { ... })

// ❌ Browser locale
(amount / 100).toLocaleString()
```
Number formatting uses hardcoded en-US or browser locale, not user's preferred locale.

---

## 5. Hospitality Domain Neutrality (⚠️ Mixed)

### 5.1 Business Types Supported (✅ Good)
```prisma
// prisma/schema.prisma lines 2337-2347
enum OutletType {
  RESTAURANT
  BAR
  POOL_BAR
  CAFE
  ROOM_SERVICE
  LOUNGE
  SPA
  TERRACE
  BEACH_BAR
}

// prisma/schema.prisma lines 3075-3083
enum OrganizationType {
  RESTAURANT
  HOTEL
  SUPPLIER
  DISTRIBUTOR
  MANUFACTURER
  SERVICE_PROVIDER
  OTHER
}
```
9 outlet types and 7 organization types — good variety for hospitality domain.

### 5.2 Business Type Field (⚠️ Free Text)
```prisma
// prisma/schema.prisma line 143
businessType String?
```
`businessType` is a free text string, not an enum. This allows any value but lacks validation and consistency.

### 5.3 Restaurant Terminology in Code (❌ Architecture Risk)
```typescript
// src/lib/services/notification.service.ts
const restaurant = await prisma.business.findUnique(...)
const message = `⚠️ LOW STOCK ALERT\n\n${restaurant.name}`

// src/lib/services/revenue-notification.service.ts line 57
<p>Your marketer account has been created! You can now start referring restaurants and earning commissions.</p>
```
Variable names use "restaurant" instead of "business" in service logic. Notification messages reference "restaurants" specifically.

### 5.4 Kitchen Dispatch Mandatory (❌ Architecture Risk)
```typescript
// src/lib/services/kitchen-dispatch.service.ts
/**
 * MANDATORY kitchen order dispatch system
 * CRITICAL RULE: Every order MUST be dispatched to kitchen
 * This is NOT optional - it's a core requirement
 */
```
Kitchen dispatch is mandatory for all orders. This assumes all businesses have a kitchen, which may not apply to all hospitality types (e.g., bars, spas, retail).

### 5.5 Site Builder Templates (⚠️ Restaurant-Focused)
```typescript
// src/lib/services/site-builder.service.ts
{
  id: 'restaurant-casual',
  name: 'Casual Dining',
  description: 'Warm, inviting design for family restaurants',
  category: 'Restaurant',
}
```
Site builder templates are restaurant-focused. No hotel, cafe, or bar templates.

### 5.6 Business Model Table Name (⚠️ Rwanda/Restaurant Legacy)
```prisma
// prisma/schema.prisma line 288
@@map("Restaurant")
```
The Business model is mapped to the "Restaurant" table in the database. This is a legacy naming that doesn't reflect the platform's broader hospitality scope.

---

## 6. Architecture Classification

| Finding | Classification |
|---------|---------------|
| i18n with 3 locales | Already Global |
| Translation files (en, fr, rw) | Already Global |
| MenuItemTranslation model | Already Global |
| User locale field | Already Global |
| Business defaultLanguage field | Already Global |
| OutletType enum (9 types) | Already Global |
| OrganizationType enum (7 types) | Already Global |
| Kinyarwanda termbase | Already Global |
| Commission invoice en/rw | Configurable |
| Business type free text | Configurable |
| WhatsApp templates hardcoded English | Rwanda-Specific Assumption |
| Email templates hardcoded English | Rwanda-Specific Assumption |
| AI responses English only | Rwanda-Specific Assumption |
| UI strings hardcoded English | Rwanda-Specific Assumption |
| Date formatting hardcoded locale | Rwanda-Specific Assumption |
| "restaurant" in variable names | Rwanda-Specific Assumption |
| Kitchen dispatch mandatory | Immediate Architecture Risk |
| Site builder restaurant-only templates | Rwanda-Specific Assumption |
| Duplicate locale files | Future Evolution |
| Business model mapped to "Restaurant" table | Future Evolution |

---

## 7. Recommendations

### Immediate Actions (Before International Expansion)
1. Extract WhatsApp notification templates into translatable template files
2. Extract email templates into translatable template files
3. Add language parameter to OpenAI API calls for AI content generation
4. Replace "restaurant" variable names with "business" in service logic
5. Make kitchen dispatch conditional based on business type

### Before International Expansion
6. Audit all UI strings for hardcoded English — replace with `t()` translation function
7. Use user's `locale` field for all date/time formatting
8. Add hotel, cafe, and bar templates to site builder
9. Consolidate duplicate locale files
10. Add more locale support (e.g., ar for Arabic, sw for Swahili)

### Post-Growth Evolution
11. Rename Business model table from "Restaurant" to "Business" (requires migration)
12. Convert businessType from free text to enum
13. Implement RTL (right-to-left) support for Arabic
14. Add locale-aware number formatting based on user's locale
15. Implement AI insight translation — generate insights in user's preferred language
