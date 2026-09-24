# FOUNDER-GPV-001 — Guest Journey

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-GUEST-JOURNEY |
| Date | 2026-08-14 |
| Role | Guest (unauthenticated customer) |
| Source | `src/pages/order/index.tsx`, `src/pages/order/checkout.tsx`, `src/pages/order/confirmation.tsx`, `src/lib/services/qr-token.service.ts`, `src/lib/services/qr-order.service.ts` |

## Overview

The Guest is the end-customer who scans a QR code, browses the menu, places an order, and pays via Tap & Leave. The Guest does NOT have a staff account and does NOT authenticate with the dashboard.

## Guest Journey

### Phase 1: QR Scan & Token Exchange

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| G-01 | Scan QR code | Phone camera → URL | Browser opens to `/order?branchId=...&tableId=...&version=1&signature=...&mode=invenue` |
| G-02 | Token exchange | POST `/api/public/order/token` | Validates HMAC signature, checks QR mode enabled, generates accessToken (10 min expiry) |
| G-03 | Menu fetch | GET `/api/public/menu?branchId=...` | Menu items loaded with names, prices, descriptions, translations |
| G-04 | Table session join | `joinTableSession(tableId, branchId)` | Session created with participant ID, table associated |

### Phase 2: Menu Browsing

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| G-05 | Browse menu | `/order` page | Menu items displayed in categories with images, prices, descriptions |
| G-06 | View item detail | MenuItemDetailModal | Item details, ingredients, allergens, preferences |
| G-07 | Set preferences | PreferencesSettings | Dietary preferences, allergies, language selection |
| G-08 | View recommendations | UpsellRecommendations | AI-powered recommendations based on selected item |
| G-09 | Detect language | `detectUserLanguage()` | UI language auto-detected (en/rw/fr) |
| G-10 | View translations | Menu items | Item names/descriptions translated to user's language |

### Phase 3: Cart & Ordering

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| G-11 | Add item to cart | `addToCart()` | Item added to cart with quantity |
| G-12 | Adjust quantity | `incInCart()` / `decFromCart()` | Cart updated |
| G-13 | View cart total | Cart display | Total price calculated in business currency |
| G-14 | Set participant name | `setParticipantName()` | Name associated with table session |
| G-15 | Place order | POST `/api/public/order/draft` | Draft order created: saleId, orderNumber returned |
| G-16 | Order confirmation | `/order/confirmation?orderId=...` | Confirmation page with order details, ETA, payment status |

### Phase 4: Order Tracking

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| G-17 | View order status | GET `/api/public/order/status?orderId=...` (polled every 10s) | Status updates: pending → accepted → preparing → almost_ready → ready |
| G-18 | View kitchen messages | GET `/api/public/order/messages?orderId=...` (polled every 15s) | Messages from kitchen: "Please wait", "Item unavailable", "Almost ready", "Ready" |
| G-19 | Real-time updates | Pusher channel `business:${orderId}` | ORDER_PAYMENT_CONFIRMED event triggers status update |
| G-20 | Add more items | Return to menu → add to cart → new draft order | Multiple orders in one dining session (Smart Dining Slip tracks running bill) |

### Phase 5: Checkout & Payment (Tap & Leave)

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| G-21 | Navigate to checkout | `/order/checkout?sessionId=...` | Live order summary displayed with running bill, VAT, fee |
| G-22 | View live order summary | LiveOrderSummary component | All items, quantities, running subtotal, VAT, total |
| G-23 | Enter phone number | Phone input | Mobile Money number (078/079/072/073 prefix) |
| G-24 | View fee information | Fee display | Payment fee % and total to pay shown |
| G-25 | Tap & Leave | TapAndLeaveButton → POST `/api/checkout/tap-and-leave` | Payment initiated via InTouch, USSD prompt sent to phone |
| G-26 | Approve payment | USSD prompt on phone (`*182#` for MTN) | Payment approved on mobile money account |
| G-27 | Webhook callback | POST `/api/webhooks/intouch` | Payment status updated: PENDING → SUCCESS |
| G-28 | Payment completion | PaymentCompletionService | Sale → COMPLETED, PaymentTransaction → SUCCESS, FinancialLedgerEntry created |
| G-29 | Smart Dining Slip (final) | SmartDiningSlipService.generateSlip() | Final receipt generated with line items, costs, margins, VAT |
| G-30 | Redirect to receipt | `/order/receipt?sessionId=...` | ⚠️ **MISSING PAGE (FGPV-D001)** — 404 error |

### Phase 6: Remote Ordering (Pre-order/Pickup)

For remote orders (mode=preorder or mode=pickup):

| Step | Action | Route/API | Expected Result |
|---|---|---|---|
| GR-01 | Scan remote QR | URL with `mode=preorder` or `mode=pickup` | Order page loads in remote mode |
| GR-02 | Phone verification required | OTPVerification component | Phone must be verified before ordering |
| GR-03 | OTP verification | POST `/api/public/verify-phone` | OTP sent to phone, verification required |
| GR-04 | Select schedule time | Scheduled time picker | Pickup/preorder time selected |
| GR-05 | Slot capacity check | `checkSlotCapacity()` | Slot availability verified (maxRemoteOrdersPerSlot) |
| GR-06 | Deposit required | `requireDepositRemote` | Deposit percentage charged (defaultDepositPercent) |

## Guest Authentication Requirements

| Mode | Authentication Required | Identity Required |
|---|---|---|
| In-venue (dine-in) | NO | Participant name (optional) |
| Remote (preorder) | YES — OTP phone verification | Phone + customer name |
| Remote (pickup) | YES — OTP phone verification | Phone + customer name |

## Smart Dining Slip Behavior

The Smart Dining Slip is the LIVE LEDGER during dining. It is NOT the final receipt.

| Slip Status | Meaning | User-Visible Effect |
|---|---|---|
| `active` | Dining in progress | Running bill visible, can add more items |
| `checkout_initiated` | Checkout started | Bill frozen, no more items can be added |
| `bill_finalized` | Final bill locked | Amount locked for payment |
| `payment_triggered` | Payment initiated | Awaiting payment confirmation |
| `checkout_completed` | Payment successful | Session complete |
| `closed` | Session fully closed | Table released |

## Multiple Orders in One Session

The guest can place multiple orders during one dining session:
1. First order → draft order created → items added to slip
2. Return to menu → add more items → new draft order → items added to slip
3. Slip tracks running total across all orders
4. At checkout, all orders are combined into one final bill
5. One payment covers the entire session

## Known Defects Affecting Guest Journey

| ID | Severity | Impact |
|---|---|---|
| FGPV-D001 | P1 | `/order/receipt` page missing — after Tap & Leave payment, guest gets 404 instead of receipt |

## Verification Points

The founder should verify:
1. QR scan loads the order page correctly
2. Menu displays with correct items, prices, and translations
3. Cart works — add, remove, adjust quantities
4. Order submission creates a draft order and shows confirmation
5. Kitchen receives the order (appears in KDS)
6. Order status updates are visible to guest (polling or real-time)
7. Kitchen messages reach the guest
8. Multiple orders can be placed in one session
9. Checkout shows correct running bill with VAT and fee
10. Tap & Leave initiates payment (with InTouch configured)
11. Payment success updates order status
12. ⚠️ Receipt page is currently broken (FGPV-D001)
