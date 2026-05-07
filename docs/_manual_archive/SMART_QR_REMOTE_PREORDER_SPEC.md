# Smart QR + Remote Pre‑Order Implementation Spec (No Code)

Goal: Add in‑venue Smart QR ordering and remote pre‑orders with payment gating and fraud controls, fully non‑disruptive to existing Serve workflows.

---

## 1) Non‑Disruption Guardrails
- Public order flows live under a separate, minimal surface (public pages + /api/public/*).
- Waiter/POS flows remain unchanged.
- Orders only reach kitchen after webhook‑confirmed payment.
- Feature‑flags per branch for opt‑in rollout.

---

## 2) Threat Model → Mitigations
- QR tampering/replay → Long‑lived HMAC in QR; short‑lived access token (JWT) issued on first hit; jti replay protection; branch/table match enforced.
- Client price tampering → Server authoritative pricing from SKU IDs; signed payable amount; client totals ignored.
- Unpaid orders hitting kitchen → Webhook‑gated release (PAID only); TTL autocancel for drafts.
- Remote griefing/no‑shows → Optional deposit or full prepay; slot caps; per‑phone/IP rate limits; outstanding draft caps.
- Cross‑branch/order spoofing → Token branch/table must match server state; reject mismatches.
- Refund/chargeback risk → Clear refund cutoffs; deposit policy; full audit trail (phone, consent, timestamps, slip).

---

## 3) Minimal Data Model Deltas
- Sale.orderSource: enum { WAITER_POS, QR_IN_VENUE, QR_REMOTE }
- Sale.scheduledAt?: DateTime (for pre‑orders)
- Sale.depositCents?: Int (optional, default 0)
- Sale.customerPhone?: String (or link to Customer on payment)
- Virtual table approach: one reserved Table per branch named "REMOTE" (no schema change) OR Table.isVirtual?: Boolean (optional if preferred).

---

## 4) Configuration & Flags
- ENV: IMBONI_QR_SECRET (HMAC for signed QR)
- Branch feature flags:
  - enableQRInVenue: boolean
  - enableQRRemote: boolean
  - requireDepositRemote: boolean (with per‑branch default deposit percent)
- Limits (defaults; per‑branch tunable):
  - Max outstanding unpaid drafts per phone: 2
  - IP/phone rate limit: 30 requests / 10 min
  - Draft TTL: 10 minutes
  - Scheduled window: 10 min preparation buffer

---

## 5) URLs & Tokening (No Code)
- In‑venue QR URL: /order?b={branchId}&t={tableId}&v=1&sig={hmac}
  - sig = HMAC‑SHA256(secret, `${b}|${t}|${v}`)
  - On first load, server exchanges sig → short‑lived accessToken (JWT) with claims: { branchId, tableId, source: 'QR_IN_VENUE', jti, iat, exp(+10m) }
- Remote URL: /order?b={branchId}&mode=pickup|preorder
  - Access requires short‑lived token minted on first load; may require phone verification for remote.

---

## 6) Public Order APIs (Contracts)
- GET /api/public/menu?branchId=...  → public menu data (read‑only)
- POST /api/public/order/draft
  - Input: { accessToken, items: [{ skuId, qty, note? }], mode: 'immediate'|'preorder', scheduledAt?, phone?, source }
  - Server behavior: validate token/branch/table; rebuild prices; compute VAT + platformFee; create draft Sale + PaymentTransaction (status NEW); return paymentLinkUrl/idempotency key and authoritative totals.
- GET /api/public/order/status?id=... → { status: NEW|PAID|EXPIRED|FAILED, eta?, scheduledAt? }
- Webhook (reuse existing IremboPay webhook): On PAID, atomically: mark PaymentTransaction=PAID, finalize Sale, place in kitchen queue.

Notes:
- All amounts rounded to nearest RWF.
- All totals are server‑calculated.

---

## 7) Payments & Fee Governance (5% - APPROVED)
**Scope:** Applies only to digital/QR payments (cash payments remain no-fee).

**Calculation:**
- Fee calculated server-side on order subtotal (before VAT on items).
- Fee includes transaction gateway costs (not disclosed to customer).
- Store as `PaymentTransaction.platformFeeCents`.

**Display (Smart Dining Slip™):**
- Subtotal
- Platform Fee (5%)
- Total to Pay

**VAT Treatment:** ❌ Not applicable - do not apply VAT to the 5% fee.
- Platform fee treated as transaction convenience cost (similar to MTN/Airtel mobile money charges).
- No VAT breakdown shown to customers.
- Simplifies customer experience and maintains transparency.

**Implementation:**
- Server-side calculation only (prevent client manipulation).
- Persist `platformFeeCents` for accounting/audit.
- Pre-checkout notice + line item in checkout summary.
- Smart Dining Slip shows clear total including fee (no gateway breakdown).

---

## 8) Kitchen Dashboard Behavior
- Group by: Immediate (green) vs Scheduled (blue).
- Show ETA and scheduledAt.
- Auto‑expire scheduled on no‑show policy (configurable) and notify staff.

---

## 9) Notifications (Existing Service Reuse)
- Customer (WhatsApp): order confirmation + ETA; ready‑for‑pickup; delay updates.
- Kitchen/Staff: new order alert; scheduled‑approaching.

---

## 10) Refunds & Cancellations (Policy - APPROVED)
**Deposit for Remote Pre-Orders:**
- Default: **50% deposit** required to confirm remote pre-orders.
- Remaining 50% collected in-venue or before pickup (branch preference).
- Full prepay option available for high-risk or premium customers.
- Deposit enforcement prevents ghost orders and kitchen waste.

**Refund Windows:**
- **Before prep starts:** Full refund of deposit.
- **After prep starts:** Deposit forfeiture (non-refundable).
- Optional branch override for special events/VIP customers.
- System uses clear timestamps to trigger refund eligibility.

**Audit Trail:**
- Record all state changes (draft → paid → prep started → completed/cancelled).
- Track refund requests, approvals, and amounts.

---

## 11) Security & Validation
- Token checks: branchId/tableId/source in token must match request; exp and jti enforced; jti one‑time use per order creation.
- CSRF cookie for public pages; basic bot throttles; per‑phone/IP limits.
- Cross‑branch prevention: PaymentTransaction.businessId must match token.branchId’s business.
- Idempotent webhooks and payment confirmation.

---

## 12) Observability & KPIs
- Draft→Paid conversion rate
- Expired drafts % and mean time to pay
- Scheduled orders no‑show %
- Chargeback/Refund rate and causes
- Average prep lead time vs scheduled time
- Fee acceptance rate; effective take‑rate after gateway + fee

---

## 13) Rollout Plan (Feature‑Flagged)
1) Pilot in 1–2 branches: enableQRInVenue + enableQRRemote; start with full prepay, no deposit.
2) Observe KPIs for 2 weeks; tune limits and policies.
3) Introduce deposits (if needed) and capacity capping in peak slots.
4) Gradual region‑wide enablement with training.

---

## 14) Acceptance Criteria
- No unpaid order can reach kitchen; webhooks are the single source of truth.
- 5% fee applied, stored, displayed, and tax‑treated consistently on all QR/digital payments.
- Tokening prevents cross‑branch or table spoofing; replay attempts rejected.
- Public flow runs without affecting POS/Waiter UX.
- Dashboards can filter by orderSource and show immediate vs scheduled.

---

## 15) OTP / Phone Verification (APPROVED)
**Vendor:**
- Use existing mobile money/OTP integration (MTN Rwanda, Airtel Rwanda).
- Fallback: Twilio if multi-network needed.

**Rate Limiting:**
- Max **5 OTP requests per hour** per phone number (prevents abuse).
- OTP required for first-time remote pre-orders or unverified phone numbers.
- Optional: Skip OTP if phone already verified in previous order.

**Implementation:**
- Store phone verification status in Customer or User record.
- Log all OTP attempts with timestamps and IP for fraud detection.

---

## 16) Slot Capacity Defaults per Branch (APPROVED)
**Capacity Management:**
- Each branch defines **max simultaneous remote pre-orders per time slot**.
- Default: **10 orders per 30-minute interval** (adjustable per branch based on kitchen capacity).
- Prevents remote overbooking and kitchen overload.

**Enforcement:**
- If slot full → customer offered next available slot or pickup time.
- System tracks scheduled orders per slot in real-time.
- Admin dashboard shows slot utilization and capacity warnings.

**Configuration:**
- Branch-level settings: `maxRemoteOrdersPerSlot`, `slotDurationMinutes`.
- Peak hours can have different caps (e.g., lunch rush: 15/slot, off-peak: 10/slot).
