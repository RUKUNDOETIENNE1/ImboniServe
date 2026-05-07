# Master Upgrade Analysis - Imboni Serve
**Date:** March 15, 2026  
**Purpose:** Analyze existing features vs Master Upgrade requirements and implementation plan

---

## Executive Summary

### Current State Assessment
Imboni Serve has a **solid foundation** with many core features already implemented. The platform is production-ready for single-venue, single-currency operations with basic QR ordering.

### Gap Analysis
**Missing Critical Features:**
1. ❌ Multi-outlet venue mode (restaurants, bars, pools, room service in one venue)
2. ❌ Multi-currency support (currently RWF-only)
3. ❌ Flexible VAT/Tax engine (currently hardcoded 18% Rwanda VAT)
4. ❌ Multi-language UI (partial - only EN/RW for receipts)
5. ❌ Customer-driven restaurant referrals via Smart Dining Slip
6. ❌ Restaurant referral leaderboard
7. ❌ Seat-level tracking (only table-level exists)

**Existing Features to Upgrade:**
1. ✅ Table management (exists, needs seat context)
2. ✅ Room management (exists via hotel mode, needs venue integration)
3. ✅ QR code generation (exists, needs per-seat capability)
4. ✅ Order session tracking (exists, needs enhancement)
5. ✅ Smart Dining Slip (exists, needs customer referral feature)
6. ✅ Restaurant referral (affiliate system exists, needs B2B enhancement)

---

## Feature-by-Feature Analysis

### 1. Table / Room / Seat Context Management

**Current State:**
- ✅ Table model exists with `number`, `capacity`, `status`, `businessId`, `assignedWaiterId`
- ✅ Table API endpoints: GET/POST `/api/tables`, PUT/DELETE `/api/tables/[id]`
- ✅ Table service with order tracking
- ✅ Room model exists with `roomNumber`, `floor`, `status`, `guestName`, `guestPhone`
- ✅ Room API: GET/POST `/api/hotel/rooms`
- ❌ No seat-level tracking within tables
- ❌ No unified context model for table/room/seat

**Required Upgrades:**
- Add `Seat` model linked to `Table`
- Add seat-level QR codes
- Unified context tracking: `OrderContext` model
- Session persistence across multiple orders at same location

**Implementation Priority:** HIGH

---

### 2. Venue Mode (Multi-Outlet)

**Current State:**
- ✅ Branch model exists (multi-branch support for chains)
- ✅ Hotel mode exists (room service)
- ❌ No multi-outlet within single venue
- ❌ No outlet-specific menus
- ❌ No cross-outlet ordering

**Required Upgrades:**
- Add `Outlet` model: type (RESTAURANT, BAR, POOL_BAR, CAFE, ROOM_SERVICE, LOUNGE)
- Link outlets to venues (Business)
- Outlet-specific menus and QR codes
- Cross-outlet order aggregation
- Venue-wide reporting

**Implementation Priority:** HIGH

---

### 3. Instant Order Confidence

**Current State:**
- ✅ Order status tracking: PENDING, ACTIVE, COMPLETED
- ✅ Kitchen display system (KDS) with Pusher real-time
- ✅ Payment status tracking
- ❌ No customer confirmation step before kitchen
- ❌ No live order preview for customers
- ❌ No post-order feedback

**Required Upgrades:**
- Add customer confirmation step in QR flow
- Live order preview API
- Post-order feedback collection
- Enhanced kitchen notifications for special instructions

**Implementation Priority:** HIGH

---

### 4. Smart Dining Slip - Customer Referral

**Current State:**
- ✅ Smart Dining Slip fully implemented
- ✅ WhatsApp delivery
- ✅ PDF generation with templates
- ❌ No customer referral feature
- ❌ No "invite restaurant" CTA

**Required Upgrades:**
- Add customer referral tracking
- Generate unique referral links for customers
- Track restaurant signups via customer referrals
- Reward mechanism (dining credits)

**Implementation Priority:** MEDIUM

---

### 5. Restaurant Referral Engine

**Current State:**
- ✅ Affiliate system exists
- ✅ Referral tracking via `referredByAffiliateId`
- ✅ Commission calculation
- ❌ No leaderboard
- ❌ No B2B-specific referral flow

**Required Upgrades:**
- Restaurant-to-restaurant referral links
- Leaderboard API and UI
- Enhanced rewards (free months, premium features)
- Referral analytics dashboard

**Implementation Priority:** MEDIUM

---

### 6. Multi-Currency Support

**Current State:**
- ❌ All prices in RWF (cents)
- ❌ No currency field in Business model
- ❌ No currency conversion
- ❌ Hardcoded `formatRWF` utility

**Required Upgrades:**
- Add `currency` field to Business model (ISO 4217 codes)
- Add `Currency` enum: RWF, USD, EUR, GBP, KES, UGX, TZS, etc.
- Currency-aware price storage (keep cents, add currency code)
- Currency formatting utility
- Optional tourist currency preview
- Multi-currency payment gateway support

**Implementation Priority:** HIGH

---

### 7. Flexible VAT / Tax Engine

**Current State:**
- ❌ Hardcoded 18% VAT (Rwanda)
- ❌ No tax configuration per business
- ❌ No support for multiple taxes

**Required Upgrades:**
- Add `TaxConfiguration` model
- Support multiple tax types: VAT, service charge, tourism levy
- Country-based auto-configuration
- Business-level overrides
- Tax calculation service

**Implementation Priority:** HIGH

---

### 8. Multi-Language UI

**Current State:**
- ✅ Partial: EN/RW for EBM receipts
- ✅ Partial: EN/RW for Smart Dining Slips
- ✅ Translation hook exists: `useTranslation`
- ❌ No full i18n framework
- ❌ Limited language support

**Required Upgrades:**
- Implement full i18n (next-i18next or similar)
- Support: EN, FR, PT, AR, ES, RW, SW
- Language switcher in all UIs
- Locale-aware date/time (already done via formatDateTimeRW)
- Translation files for all UI strings

**Implementation Priority:** MEDIUM

---

### 9. Advanced Features (Optional)

**Current State:**
- ✅ AI Business Summary (OpenAI integration)
- ✅ Smart Reorder (AI-lite)
- ✅ Cost Anomaly Detection (AI-lite)
- ❌ No AI Waiter / Menu Recommendations
- ❌ No cross-venue promotions
- ✅ Payment gateway integrations (IremboPay)

**Required Upgrades:**
- AI menu recommendations
- Upselling engine
- Cross-venue promotions
- Additional payment gateways (Stripe, Flutterwave)

**Implementation Priority:** LOW

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Multi-Currency Support
2. Flexible VAT/Tax Engine
3. Seat Context Management
4. Order Confirmation Step

### Phase 2: Venue Expansion (Week 3-4)
5. Venue Mode (Multi-Outlet)
6. Outlet-specific menus
7. Cross-outlet ordering

### Phase 3: Growth Features (Week 5-6)
8. Customer Referral in Smart Dining Slip
9. Restaurant Referral Leaderboard
10. Multi-Language UI

### Phase 4: Polish (Week 7-8)
11. AI Waiter Recommendations
12. Cross-Venue Promotions
13. Additional Payment Gateways

---

## Database Schema Changes Required

### New Models
```prisma
model Currency {
  code        String   @id // ISO 4217
  name        String
  symbol      String
  decimals    Int      @default(2)
}

model Outlet {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  name        String
  type        OutletType
  menuId      String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum OutletType {
  RESTAURANT
  BAR
  POOL_BAR
  CAFE
  ROOM_SERVICE
  LOUNGE
  SPA
}

model Seat {
  id          String   @id @default(uuid())
  tableId     String
  table       Table    @relation(fields: [tableId], references: [id])
  seatNumber  Int
  qrCode      String?  @unique
  createdAt   DateTime @default(now())
}

model TaxConfiguration {
  id          String   @id @default(uuid())
  businessId  String
  business    Business @relation(fields: [businessId], references: [id])
  taxType     TaxType
  rate        Float
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

enum TaxType {
  VAT
  SERVICE_CHARGE
  TOURISM_LEVY
  SALES_TAX
}

model CustomerReferral {
  id              String   @id @default(uuid())
  referrerPhone   String
  referrerName    String?
  referralCode    String   @unique
  restaurantId    String?
  restaurant      Business? @relation(fields: [restaurantId], references: [id])
  status          ReferralStatus
  rewardCents     Int      @default(0)
  createdAt       DateTime @default(now())
}

enum ReferralStatus {
  PENDING
  CONVERTED
  REWARDED
}
```

### Model Updates
```prisma
model Business {
  // Add
  currency        String   @default("RWF")
  defaultLanguage String   @default("en")
  outlets         Outlet[]
  taxConfigs      TaxConfiguration[]
}

model Table {
  // Add
  seats           Seat[]
  outletId        String?
  outlet          Outlet?  @relation(fields: [outletId], references: [id])
}

model SmartDiningSlip {
  // Add
  customerReferralCode String?
}
```

---

## Risk Assessment

### Low Risk
- Multi-currency (additive, no breaking changes)
- Seat tracking (extends existing table model)
- Customer referrals (extends Smart Dining Slip)

### Medium Risk
- Tax engine (replaces hardcoded VAT)
- Multi-language (requires UI refactoring)
- Outlet mode (new ordering paradigm)

### High Risk
- None identified (all changes are additive or opt-in)

---

## Success Metrics

1. **Table/Seat Context:** Orders per table/session +30%
2. **Venue Mode:** Multi-outlet venues onboarded (target: 10)
3. **Multi-Currency:** International signups (target: 5 countries)
4. **Customer Referrals:** Restaurant signups via customers (target: 20%)
5. **Restaurant Referrals:** Active referrers (target: 30% of restaurants)

---

## Next Steps

1. ✅ Complete this analysis
2. Update Prisma schema with new models
3. Run `prisma db push` to apply changes
4. Implement multi-currency support
5. Implement flexible tax engine
6. Implement seat context management
7. Implement venue mode
8. Implement customer referrals
9. Implement multi-language UI
10. Test and deploy

---

**Status:** Analysis Complete - Ready for Implementation
