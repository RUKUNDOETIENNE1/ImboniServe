# PR-001 Customer Configuration Record

| Field | Value |
|---|---|
| Date | 2026-08-09 |
| Customer | Customer #1 — NOT YET IDENTIFIED |
| Status | **No real Customer #1 exists in the database** |

## Current Database State

Three businesses exist in the database, all test data:

### Business 1: Nyama Cafe Kigali
| Field | Value |
|---|---|
| ID | cms6jn9q40009tkbzpcrv2pxp |
| Name | Nyama Cafe Kigali |
| Business Type | null |
| Country | RW |
| City | Kigali |
| Address | KN 4 Ave, Kigali |
| Phone | +250788123456 |
| WhatsApp | +250788123456 |
| Currency | RWF |
| Timezone | Africa/Kigali |
| Default Language | en |
| Tax Mode | EXCLUSIVE |
| Plan | cms6jn82y0001tkbzlofwbyxi |
| Approval Status | PENDING |
| Active | true |
| Tables | 0 |
| Menu Items | 4 |
| QR Codes | 0 |
| Reservations | 0 |
| Sales | 0 |
| TaxConfiguration | NONE |
| Users | jean@nyamacafe.rw (OWNER), marie@nyamacafe.rw (CASHIER), eric@nyamacafe.rw (KITCHEN_MANAGER) |

### Business 2: ICTHubs
| Field | Value |
|---|---|
| ID | cms9fdo6w0004j8xotfpca48m |
| Name | ICTHubs |
| Business Type | RESTAURANT |
| Country | RW |
| City | Kigali |
| Address | null |
| Phone | +250788917126 |
| WhatsApp | null |
| Currency | RWF |
| Timezone | Africa/Kigali |
| Default Language | en |
| Tax Mode | EXCLUSIVE |
| Plan | cms6jn4t80000tkbzuqy7v2ct |
| Approval Status | APPROVED |
| Active | true |
| Tables | 0 |
| Menu Items | 0 |
| QR Codes | 0 |
| Reservations | 0 |
| Sales | 0 |
| TaxConfiguration | NONE |
| Users | steve.aimviews@gmail.com (OWNER) |

### Business 3: GPV Test Restaurant
| Field | Value |
|---|---|
| ID | cmsk4x4c900026gygb3x5f8r6 |
| Name | GPV Test Restaurant |
| Business Type | RESTAURANT |
| Country | RW |
| City | Kigali |
| Address | null |
| Phone | 0788123456 |
| WhatsApp | null |
| Currency | RWF |
| Timezone | Africa/Kigali |
| Default Language | en |
| Tax Mode | EXCLUSIVE |
| Plan | cms6jn4t80000tkbzuqy7v2ct |
| Approval Status | APPROVED |
| Active | true |
| Tables | 1 |
| Menu Items | 1 |
| QR Codes | 0 |
| Reservations | 10 |
| Sales | 4 |
| Ledger Entries | 3 |
| Payments | 4 |
| Inventory Items | 1 |
| TaxConfiguration | VAT, rate=18, isInclusive=true, active=true |
| Users | gpv-test@imboniserve-test.com (OWNER) |

## Geography Defaults (from schema)

| Field | Default | Source |
|---|---|---|
| Country | RW | `prisma/schema.prisma` Business.country @default("RW") |
| City | Kigali | `prisma/schema.prisma` Business.city @default("Kigali") |
| Currency | RWF | `prisma/schema.prisma` Business.currency @default("RWF") |
| Timezone | Africa/Kigali | `prisma/schema.prisma` Business.timezone @default("Africa/Kigali") |
| Default Language | en | `prisma/schema.prisma` Business.defaultLanguage @default("en") |

## Country Configuration (from code)

| Country | Tax Mode (after GPV-D009 fix) | Currency | Timezone |
|---|---|---|---|
| RW (Rwanda) | INCLUSIVE | RWF | Africa/Kigali |
| UG (Uganda) | INCLUSIVE | UGX | Africa/Kampala |
| TZ (Tanzania) | INCLUSIVE | TZS | Africa/Dar_es_Salaam |

Note: Existing businesses in DB still have `taxMode: EXCLUSIVE` (set before the GPV-D009 fix). New signups will default to INCLUSIVE for RW/UG/TZ. Existing businesses can change via settings.

## Customer #1 Configuration — TO BE DETERMINED

The following must be confirmed by the founder with the real Customer #1:

| Item | Status | Required From |
|---|---|---|
| Legal/business name | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Display name | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Country | FOUNDER-ACTION-REQUIRED | Founder + Customer (defaults to RW) |
| City/location | FOUNDER-ACTION-REQUIRED | Founder + Customer (defaults to Kigali) |
| Address | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Contact information | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Business type | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Default language | FOUNDER-ACTION-REQUIRED | Founder + Customer (defaults to en) |
| Currency | FOUNDER-ACTION-REQUIRED | Founder + Customer (defaults to RWF) |
| Timezone | FOUNDER-ACTION-REQUIRED | Founder + Customer (defaults to Africa/Kigali) |
| Tax type | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Tax rate | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Tax-inclusive vs exclusive | FOUNDER-ACTION-REQUIRED | Founder + Customer |
| Service charge | FOUNDER-ACTION-REQUIRED | Founder + Customer |

## Conclusion

No real Customer #1 business record exists. All three businesses in the database are test data created during GPV verification. The founder must:
1. Identify the real Customer #1
2. Create a real business record (via signup or admin creation)
3. Configure all customer-specific settings with the customer's input
4. Confirm the tax configuration decision

**Status: 🔴 No real Customer #1 configured.**
