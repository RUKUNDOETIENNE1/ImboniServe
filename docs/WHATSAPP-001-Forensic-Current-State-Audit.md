# WHATSAPP-001 — ImboniServe × WhatsApp Forensic Current-State & Integration Audit

**Audit Date:** 2026-09-02  
**Branch:** `main`  
**Current Commit:** `7bcd1db` (fix(scheduler): preserve Guardian 2-min cadence with Hobby-compatible vercel.json)  
**Audit Mode:** READ-ONLY — no code changes, no commits, no migrations  
**Governing Principle:** ImboniServe remains the operating system. WhatsApp becomes the human communication/attention layer on top of it.

---

## 1. Executive Summary

ImboniServe already has a substantial, partially-wired WhatsApp infrastructure. This is **not a blank canvas**. The audit reveals:

- **Five separate WhatsApp service implementations** exist, serving different purposes with different gateways.
- **Guardian already sends WhatsApp messages** when in ASSIST mode — via `NotificationService.sendWhatsApp()`.
- **Promise Engine already sends WhatsApp alerts** on WARNING and CRITICAL state transitions — to the business phone number, not a specific staff member.
- **The recipient resolution problem is largely solved** — `GuardianResponsibilityRouter` already implements role-priority routing to staff `whatsappNumber`.
- **Critical gap:** The Promise Engine's `notifyStaff()` sends to the business WhatsApp number, not to the staff member identified by the router. Guardian correctly routes to the individual. Promise Engine does not.
- **The inbound acknowledgement gap is real:** There is no mechanism for a staff member to reply "ACK" via WhatsApp and have the system record that action against a specific Guardian case. The `acknowledge.ts` API endpoint exists but requires dashboard authentication — not a WhatsApp reply identity.
- **Serve Replay does not contain Guardian events or WhatsApp notification events** — the `ReplayEventType` union does not include `GUARDIAN_*` events, only Promise Engine events.
- **Two webhook endpoints exist** — Twilio (`/api/webhooks/twilio/whatsapp`) and WhatsApp Cloud API (`/api/webhooks/whatsapp`) — serving different purposes. The Cloud API webhook currently only logs inbound messages; it does not process them.

**Certification status for WhatsApp V1:** YELLOW — the operational loop foundations exist, but four genuine gaps must be bridged before V1 can function:

1. Promise Engine staff alert must be routed to the individual (not the business number).
2. Serve Replay must be extended to record Guardian/WhatsApp events.
3. Inbound reply acknowledgement via WhatsApp must be designed and implemented.
4. The WhatsApp gateway must be unified (currently fragmented across three implementations).

---

## 2. Repository / Architecture Baseline

| Property | Value |
|---|---|
| Branch | `main` |
| HEAD commit | `7bcd1db` |
| Framework | Next.js (Pages Router) |
| Database ORM | Prisma (PostgreSQL via Supabase) |
| Real-time | Pusher (Heart Pulse) |
| Background scheduler | Railway worker (primary) + Vercel cron (fallback) |
| Distributed lock | Redis (`acquireCronLock`) |
| WhatsApp gateways | Twilio (primary operational) + Meta Cloud API (secondary) |
| Test suite | Jest — 611 tests passing |

**Repository structure (relevant directories):**

```
src/
  lib/
    guardian/                    ← Guardian system (6 files)
    promise-engine/              ← Promise Engine (3 files)
    heart-pulse/                 ← Event bus (2 files)
    service-replay/              ← Serve Replay (5 files)
    whatsapp/                    ← Campaign scheduler (1 file)
    services/
      whatsapp.service.ts        ← Marketer/affiliate WhatsApp (custom gateway)
      whatsapp-cloud.service.ts  ← Meta Cloud API gateway
      whatsapp-order.service.ts  ← Staff-assisted ordering via Twilio
      split-payment-whatsapp.service.ts ← Split bill trigger
      notification.service.ts   ← Primary operational gateway (Twilio)
      alert-delivery.service.ts ← Email + Slack only (no WhatsApp)
  pages/api/
    webhooks/
      whatsapp.ts               ← Meta Cloud API webhook (verify + log only)
      twilio/whatsapp.ts        ← Twilio inbound (staff-assisted ordering)
      twilio/voice-order.ts     ← AI voice ordering (GPT-4 + Whisper)
    guardian/
      index.ts, [caseId].ts     ← Guardian query APIs
      [caseId]/acknowledge.ts   ← In-dashboard acknowledgement
    cron/
      guardian.ts               ← Guardian evaluation + verification cron
      promise-evaluation.ts     ← Promise Engine cron
    settings/
      whatsapp.ts               ← Business WhatsApp settings API
  components/
    WhatsAppBot.tsx             ← Simulated chatbot UI (no backend)
```

---

## 3. Existing WhatsApp / Twilio Inventory

### 3.1 `NotificationService.sendWhatsApp()` — Primary Operational Gateway

**Status:** VERIFIED — production-connected

| Property | Value |
|---|---|
| File | `src/lib/services/notification.service.ts` |
| Gateway | Twilio REST API (raw HTTP, not SDK) |
| Env vars | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` |
| Direction | Outbound only |
| Delivery tracking | None |
| Idempotency | None |
| Retries | None |
| Tenant-scoped | No — global Twilio credentials |
| Callers | Guardian (`intervene()`), PromiseEngine (`triggerIntervention()`), OTP route, Kitchen ready route |
| Business-scoped | No — any staff member's phone can be called |
| Staff-facing | Yes |
| Customer-facing | Partially — `sendSmartDiningSlip()`, `sendOrderNotification()` to `business.whatsappNumber` |
| Reusable for V1 alerts | YES — this is already the operational alert channel |
| What must change | Add delivery receipt tracking; add idempotency for alert dedup |

**Additional methods:**
- `sendOrderNotification()` — sends to `business.whatsappNumber` (not a staff member)
- `sendLowStockAlert()` — sends to `business.owner.whatsappNumber`
- `sendDailyReport()` — sends to `business.owner.whatsappNumber`
- `sendPaymentConfirmation()` — builds message text but does NOT send; returns string only
- `sendSmartDiningSlip()` — sends Smart Dining Slip™ to customer phone; has daily cap enforcement

### 3.2 `WhatsAppCloudService` — Meta Cloud API Gateway

**Status:** PRESENT BUT INCOMPLETE

| Property | Value |
|---|---|
| File | `src/lib/services/whatsapp-cloud.service.ts` |
| Gateway | Meta Graph API (`graph.facebook.com/v18.0`) |
| Env vars | `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_APP_SECRET` |
| Direction | Outbound (text + template); inbound webhook verified but not processed |
| Delivery tracking | Logs to `WhatsAppMessage` model (messageId captured) |
| Idempotency | None |
| Fallback | Falls back to `NotificationService.sendWhatsApp()` if Cloud API not configured |
| Template support | Yes (`sendTemplate()`) |
| Webhook signature verification | Yes (`verifyWebhookSignature()`) |
| Reusable for V1 | YES — extended message logging is here |
| What must change | Inbound processing (replies) not implemented |

### 3.3 `WhatsAppOrderService` — Staff-Assisted Ordering via Twilio

**Status:** VERIFIED — operational for staff-initiated orders

| Property | Value |
|---|---|
| File | `src/lib/services/whatsapp-order.service.ts` |
| Gateway | Twilio SDK (`twilio` npm package) |
| Direction | Inbound (staff sends ORDER command) + Outbound (confirmation) |
| Recipient resolution | By phone number lookup in `User` table (roles: WAITER/CASHIER/MANAGER/OWNER) |
| Order creation | Writes to `Sale` model with `orderSource: 'WHATSAPP'` |
| Notification back | `notifyOrderReady()` — sends ready notification to order's `user.phone` |
| Staff-facing | YES (inbound from staff; outbound to staff) |
| Customer-facing | No |
| Reusable for V1 alerts | Partially — `sendMessage()` helper is reusable |
| What must change | Nothing for V1 operational alerts — this handles ordering, not operational alerts |

### 3.4 `WhatsAppService` — Marketer/Affiliate Notifications

**Status:** PRESENT BUT UNUSED for operational alerts

| Property | Value |
|---|---|
| File | `src/lib/services/whatsapp.service.ts` |
| Gateway | Custom HTTP (env: `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_FROM_NUMBER`) |
| Purpose | Marketer program — payout status, commission earned, weekly summary, welcome message |
| Direction | Outbound only |
| Opt-in tracking | Yes — stored in `WhatsAppMessage` model with `type: 'PREFERENCE_UPDATE'` |
| Staff-facing | No — marketer-facing |
| Reusable for V1 | No — different gateway, different purpose |

### 3.5 `SplitPaymentWhatsAppService` — Split Bill Trigger

**Status:** PRESENT BUT INCOMPLETE — misuses `sendSmartDiningSlip()` to send a split payment link

| Property | Value |
|---|---|
| File | `src/lib/services/split-payment-whatsapp.service.ts` |
| Gateway | Delegates to `NotificationService.sendSmartDiningSlip()` |
| Purpose | Automatically sends split bill link to customer when conditions met |
| Direction | Outbound to customer |
| Idempotency | Yes — `SplitPaymentWhatsAppTrigger` model prevents duplicate sends |
| Reusable for V1 | No — customer-facing, not operational |

### 3.6 `campaign-scheduler.ts` — WhatsApp Campaign Broadcast

**Status:** PRESENT BUT INCOMPLETE — `sendWhatsAppMessage()` only writes to DB; doesn't actually call Twilio

| Property | Value |
|---|---|
| File | `src/lib/whatsapp/campaign-scheduler.ts` |
| Gateway | None — writes to `WhatsAppMessage` table only; no real send |
| Purpose | Marketing campaigns to customer segments |
| Staff-facing | No — customer marketing |
| Reusable for V1 | No |

### 3.7 `WhatsAppBot.tsx` — Simulated Chat UI Component

**Status:** PRESENT BUT UNUSED — frontend simulation only

| Property | Value |
|---|---|
| File | `src/components/WhatsAppBot.tsx` |
| Backend | None — entirely simulated with hardcoded responses |
| Connected to | Nothing |
| Reusable for V1 | No |

### 3.8 Inbound Webhook — Twilio `/api/webhooks/twilio/whatsapp`

**Status:** VERIFIED — fully operational for staff ordering

- Validates Twilio signature
- Parses form-encoded body
- Routes to `WhatsAppOrderService.processIncomingMessage()`
- Returns TwiML `<Message>` response
- Does NOT process Guardian acknowledgements or operational replies

### 3.9 Inbound Webhook — Meta Cloud `/api/webhooks/whatsapp`

**Status:** PRESENT BUT INCOMPLETE

- GET: Handles webhook verification challenge (correct)
- POST: Verifies `x-hub-signature-256` signature (correct)
- POST: Logs inbound messages and status updates — does nothing with them
- **No business logic behind inbound replies**

### 3.10 Voice Order Webhook — `/api/webhooks/twilio/voice-order`

**Status:** PRESENT BUT UNUSED for V1

- Whisper API transcription + GPT-4 intent extraction
- Customer-initiated voice ordering
- Requires `OPENAI_API_KEY`
- Outside V1 scope

### 3.11 Prisma Models

| Model | Purpose | Status |
|---|---|---|
| `WhatsAppMessage` | Log of all WhatsApp messages (business-scoped) | VERIFIED |
| `WhatsAppTemplate` | Template registry for Cloud API | VERIFIED (no templates seeded) |
| `SplitPaymentWhatsAppTrigger` | Idempotency for split bill sends | VERIFIED |

**`WhatsAppMessage` fields:** `id`, `userId?`, `fromNumber`, `toNumber`, `message`, `type`, `status`, `direction`, `command?`, `processed`, `createdAt`, `businessId`

**Notable:** No `messageId` field (Cloud API returns one; not stored in Twilio path). No `acknowledgedAt`. No `retries`. No `deliveredAt`.

### 3.12 Business-Level WhatsApp Config

| Field | Default | Purpose |
|---|---|---|
| `business.whatsappNumber` | null | Business operational WhatsApp number |
| `business.whatsappOwnerReportsEnabled` | true | Daily reports to owner |
| `business.whatsappClientSlipsEnabled` | false | Customer slip sending |
| `business.whatsappClientSlipsConsent` | false | Consent flag |
| `business.whatsappDailyCapClient` | 50 | Daily message cap for customers |
| `business.whatsappMonthlyBudgetCents` | null | Budget cap (not enforced in code) |

### 3.13 User-Level WhatsApp Config

| Field | Default | Purpose |
|---|---|---|
| `user.whatsappEnabled` | false | Whether Guardian can WhatsApp this user |
| `user.whatsappNumber` | null | User's WhatsApp number |
| `user.phone` | required unique | Fallback if no whatsappNumber |

---

## 4. Order Event Map

**Order creation path:** QR → Menu → Cart → `Sale` record created → `KitchenDispatchService.dispatchToKitchen()`

| Event | Exists? | Source | Payload | Consumers | Reusable for WhatsApp? |
|---|---|---|---|---|---|
| Order created (DB) | VERIFIED | `prisma.sale.create()` (multiple routes) | `Sale` record | All | YES — trigger point |
| ORDER_CREATED (TicketEvent) | VERIFIED | `KitchenDispatchService` | orderNumber, orderSource, itemCount | Serve Replay | YES |
| `order.created` (Pusher) | VERIFIED | `KitchenDispatchService` | orderId, orderNumber, items | Kitchen Dashboard, KDS | YES |
| PROMISE_CREATED | VERIFIED | `PromiseEngine.createOrUpdatePromise()` | promiseId, thresholds | Serve Replay (partially) | YES |
| ITEM_ROUTED | VERIFIED | `KitchenDispatchService` | stationId, itemIds | KDS | YES |
| ITEM_ACCEPTING/PREPARING/READY | VERIFIED | `/api/station/update-item-status` | itemStatus | KDS, Waiter Dashboard | Indirectly |
| KITCHEN_STATUS_CHANGED | VERIFIED | `/api/kitchen/update-status` | kitchenStatus | Kitchen Dashboard, Waiter | YES — fulfillment signal |
| ORDER_READY_FOR_PICKUP | VERIFIED | `/api/kitchen/update-status` | orderId, stationSummary | Waiter Dashboard | YES |
| Order ready WhatsApp | PARTIALLY VERIFIED | `/api/kitchen/order/[id]/ready` | order, customerPhone | Customer | Customer-facing only |
| PROMISE_WARNING | VERIFIED | `PromiseEngine.evaluateActivePromises()` | promiseId, state | Serve Replay, Dashboard | YES — V1 trigger |
| PROMISE_CRITICAL | VERIFIED | `PromiseEngine.evaluateActivePromises()` | promiseId, state | Serve Replay, Dashboard | YES — V1 trigger |
| PROMISE_FULFILLED | VERIFIED | `PromiseEngine.transitionTo()` | promiseId | Serve Replay, Dashboard | YES |
| PROMISE_FAILED | VERIFIED | `PromiseEngine.transitionTo()` | promiseId | Serve Replay, Dashboard | YES |
| PAYMENT_CONFIRMED | VERIFIED | Heart Pulse catalog (owner registered) | orderId, amount | Dashboard | No (post-serve) |
| GUARDIAN_CASE_OPENED | VERIFIED | `GuardianService.detect()` | caseId, signalType | Guardian Dashboard | YES — case alert trigger |
| GUARDIAN_NOTIFICATION_SENT | VERIFIED | `GuardianService.intervene()` | channel, success | Guardian Dashboard | YES — delivery record |
| GUARDIAN_ACKNOWLEDGED | VERIFIED | `GuardianService.acknowledgeCase()` | caseId, acknowledgedBy | Guardian Dashboard | YES — ack signal |
| GUARDIAN_CASE_RESOLVED | VERIFIED | `GuardianService.resolveCase()` | outcome | Guardian Dashboard | YES — resolution signal |

**Critical finding:** The `ORDER_CREATED` TicketEvent / Pusher event is the correct WhatsApp V1 trigger point for the New Order Alert. It is emitted by `KitchenDispatchService` which is called for every order source.

---

## 5. Promise Engine Map

**Status:** VERIFIED — fully operational

**Promise lifecycle:**
```
Sale created
    ↓
KitchenDispatchService.dispatchToKitchen()
    ↓
PromiseEngine.createOrUpdatePromise()   → ServicePromise (ON_TRACK)
    ↓ [every 2 minutes via cron]
PromiseEngine.evaluateActivePromises()
    ↓
evaluateOne() → state machine:
  ON_TRACK → WARNING (at warningAfterMinutes)
  WARNING  → CRITICAL (at breachAfterMinutes)
  CRITICAL → FAILED (at AUTO_FAIL_MINUTES=60)
  any      → FULFILLED (if kitchenStatus=ready/served OR readyAt set)
  any      → RECOVERED (if returns to fulfilled after breach)
    ↓ on state change
transitionTo() →
  TicketEvent recorded
  Heart Pulse published
  triggerIntervention() called
    ↓
triggerIntervention():
  WARNING  → notifyStaff(business.whatsappNumber, "⚠️ Order #X running late")
  CRITICAL → notifyStaff(business.whatsappNumber, "🚨 Order #X breached") + AlertDeliveryService
  FAILED   → AlertDeliveryService only
  RECOVERED → notifyStaff(business.whatsappNumber, "✅ Order #X recovered")
```

**Critical gap confirmed:** `notifyStaff()` sends to `business.whatsappNumber` or `business.phone`. It does NOT use `GuardianResponsibilityRouter`. It does NOT send to an individual staff member.

**SLA Thresholds:** Configurable via `SLAProfile` per business/station/category. Default: warning=8min, breach=15min. Auto-fail at 60min.

**What exists for V1:**
- ✅ PROMISE_WARNING event exists
- ✅ PROMISE_CRITICAL event exists
- ✅ TicketEvent record exists
- ✅ Heart Pulse event exists
- ❌ Staff-individual alert routing is missing (sends to business number)
- ❌ No acknowledgement path from WhatsApp reply

---

## 6. Guardian Map

**Status:** VERIFIED — fully operational in SHADOW and ASSIST modes

**Guardian lifecycle:**
```
PromiseEngine evaluates → PROMISE_WARNING or PROMISE_CRITICAL state
    ↓
GuardianService.evaluateActiveSignals() [every 2 min via cron]
    ↓
processSignal()
    ↓
getGuardianMode() → OFF | SHADOW | ASSIST
    (controlled by FeatureFlagService + BusinessFeatureOverride)
    ↓
detect()
  → GuardianCase created (DETECTED state)
  → Idempotency: one case per promise+signal
  → TicketEvent: GUARDIAN_CASE_OPENED
  → Heart Pulse: GUARDIAN_CASE_OPENED
    ↓
understand()
  → GuardianContextGatherer.gather()
  → Collects: orderStatus, kitchenStatus, tableNumber, topItems, stationName, elapsedMinutes
  → Stored as contextSnapshot JSON on GuardianCase
    ↓
decide()
  → GuardianDecisionPolicy.evaluate()
  → Decision levels: OBSERVE | RECOMMEND | ALERT | ESCALATE
    ↓
[SHADOW mode: INTERVENTION_PENDING — logged but not sent]
[ASSIST mode: intervene()]
    ↓
intervene()
  → Dedup: suppressed if last notified < 15min ago
  → GuardianResponsibilityRouter.route() → selects responsible person
    (Priority: KITCHEN_MANAGER > SUPERVISOR > MANAGER > ADMIN > OWNER)
    (Filters: user.isActive=true AND user.whatsappEnabled=true)
    (Fallback: OWNER if no whatsappEnabled staff)
  → formatMessage() → plaintext alert with order details
  → ALERT/RECOMMEND: NotificationService.sendWhatsApp(person.whatsappNumber || person.phone)
  → ESCALATE: AlertDeliveryService (email+Slack) + NotificationService.sendWhatsApp
  → GuardianIntervention record created (channel, recipient, messageContent, result)
  → GuardianCase updated: INTERVENED, assignedUserId, lastNotifiedAt
  → TicketEvent: GUARDIAN_NOTIFICATION_SENT
  → Heart Pulse: GUARDIAN_NOTIFICATION_SENT
    ↓
verify() [runs in same cron cycle]
  → Checks promise.state
  → FULFILLED / RECOVERED → outcome: PROTECTED_BY_GUARDIAN or RECOVERED_NATURALLY
  → FAILED → outcome: INTERVENTION_FAILED or BREACHED
  → ON_TRACK → outcome: FALSE_POSITIVE
  → recordLearning() → GuardianLearningSignal created
  → resolveCase() → TicketEvent + Heart Pulse
    ↓
acknowledgeCase() [dashboard API]
  → Requires authenticated session
  → Sets case state: VERIFYING
  → TicketEvent: GUARDIAN_ACKNOWLEDGED
```

**What already exists that V1 can use:**
- ✅ `GuardianResponsibilityRouter` — individual staff recipient resolution is implemented
- ✅ `user.whatsappEnabled` + `user.whatsappNumber` — staff WhatsApp opt-in model exists
- ✅ `GuardianIntervention` model — delivery record per intervention
- ✅ `GuardianCase.assignedUserId` — who was alerted is recorded
- ✅ `GuardianCase.lastNotifiedAt` + 15min dedup window
- ✅ `acknowledgeCase()` API — dashboard acknowledgement exists
- ✅ `formatMessage()` — operational alert message format exists

**What does NOT exist:**
- ❌ Inbound WhatsApp reply processing that identifies the replier and routes to `acknowledgeCase()`
- ❌ WhatsApp-originated acknowledgement — currently requires dashboard login
- ❌ Resolution communication back to staff via WhatsApp (case resolved message)

---

## 7. Notification / Attention Architecture

**Status:** PARTIALLY VERIFIED — there is no generic communication engine; there are multiple specialized services

### Existing components:

| Component | What it does | Staff/Customer | Channel |
|---|---|---|---|
| `NotificationService` | Twilio WhatsApp sends (operational) | Both | WhatsApp |
| `AlertDeliveryService` | Email + Slack for engineering/ops | Internal | Email, Slack |
| `WhatsAppCloudService` | Meta API send + log | Both | WhatsApp |
| `WhatsAppOrderService` | Inbound staff ordering + confirmations | Staff | WhatsApp |
| `WhatsAppService` | Marketer payouts/commissions | Marketer | WhatsApp |
| `PartnershipNotificationService` | Partnership events | Partners | Unknown |
| `RevenueAlertService` | Revenue alerts | Internal | Unknown |
| `OperationalAlertEngineService` | Operational watchdog alerts | Internal | Via AlertDelivery |

### Key finding:

There is no generic `CommunicationEngine` abstraction. The pieces exist but are scattered. The current architecture is:

```
Event → [Direct service call] → [Channel-specific service] → [Gateway]
```

There is no centralized: priority assignment, recipient resolution, message generation, delivery tracking, or retry logic.

**Answer to the Communication Engine Question:**  
A full Communication Engine abstraction is NOT needed for V1. The existing `NotificationService.sendWhatsApp()` + Guardian's existing recipient resolution machinery can deliver V1 without a new platform abstraction. A lightweight `WhatsAppOperationalService` adapter would suffice.

---

## 8. Staff / User / Role / Recipient Architecture

**Status:** VERIFIED

### User model fields relevant to WhatsApp:

| Field | Type | Default | Notes |
|---|---|---|---|
| `phone` | String (unique, required) | — | Fallback for WhatsApp |
| `whatsappEnabled` | Boolean | false | Must be true for Guardian routing |
| `whatsappNumber` | String? | null | Preferred WhatsApp number |
| `isActive` | Boolean | true | Must be true for routing |
| `businessId` | String? | null | Business assignment |
| `primaryBranchId` | String? | null | Branch assignment (not used in routing) |
| `roles` | UserRole[] | [OWNER] | Role-based routing |

### UserRole enum:

```
OWNER | CASHIER | KITCHEN_MANAGER | ADMIN | SUPPLIER | SUPERVISOR | MANAGER | FRONT_DESK | WAITER
```

### Guardian routing priority:

```
KITCHEN_MANAGER → SUPERVISOR → MANAGER → ADMIN → OWNER
(filters: isActive=true AND whatsappEnabled=true)
(fallback: OWNER regardless of whatsappEnabled)
```

### Critical finding:

The `whatsappEnabled` flag defaults to `false`. **For Guardian WhatsApp to work, staff members must explicitly have `whatsappEnabled=true` set**. There is no UI visible in the codebase to set this — it would require direct DB update or an admin settings page that was not found. This is a setup prerequisite for V1.

### Branch/area awareness:

- `Branch` model exists — `Business → Branch → Outlet → Table`
- `ServiceArea` model exists — `Business → Branch → ServiceArea` (name, areaType)
- Guardian routing is **business-scoped only** — no branch/area scoping
- `primaryBranchId` on User is set but not used in Guardian routing

---

## 9. Business / Location Architecture

**Status:** VERIFIED

### Current hierarchy:

```
Business
  ├── Branch (optional grouping)
  │     └── Outlet (named location)
  │           └── Table
  │                 ├── Seat (with QR)
  │                 └── TableSession
  │                       ├── SessionParticipant
  │                       └── SeatSession
  └── ServiceArea (type: TABLE, ROOM, etc.)
```

### Strategic hierarchy (documented intent):

```
Business → Area → Table → Seat → Dining Session → Order → Incident / Promise / Request
```

**Gap:** The "Area" concept in the strategic hierarchy corresponds to `ServiceArea` in the schema. However, `ServiceArea` has no tables linked to it directly — tables link to `Outlet`, not `ServiceArea`. The hierarchy is partially built.

**For WhatsApp V1:** Scoping is at `Business` level. No branch or area scoping is needed for V1 — Guardian already works at business scope.

---

## 10. Seat Management Audit

**Status:** PARTIALLY VERIFIED — model exists and is integrated into Sale; QR-per-seat works; but UI completeness is unknown

### What exists:

| Component | Status |
|---|---|
| `Seat` Prisma model | VERIFIED — in `schema.prisma` (line 1706) |
| `SeatSession` model | VERIFIED |
| `Sale.seatId` relation | VERIFIED |
| `Seat.qrCode` unique field | VERIFIED |
| `seat-placement.service.ts` | VERIFIED (file exists) |
| `seat-detection.service.ts` | VERIFIED (file exists) |
| `seat-qr.service.ts` | VERIFIED (file exists) |
| `StaffTip → Seat` relation | VERIFIED |

### WhatsApp V1 dependency:

**WhatsApp V1 does NOT depend on Seat Management.** The V1 operational loop is:

```
Order → Promise Engine → Guardian → Staff WhatsApp Alert → Acknowledgement
```

None of these stages require seat-level scoping. Orders have `tableId` which is sufficient. Seat Management can be safely deferred to post-V1.

---

## 11. Serve Replay Audit

**Status:** PARTIALLY VERIFIED — strong foundation but missing Guardian and WhatsApp events

### What Serve Replay consumes:

Serve Replay reads from `TicketEvent` records and maps them to `ReplayEvent` objects via `service-replay/transformer.ts`.

### Supported `ReplayEventType` values (from `types.ts`):

The union includes: ORDER_*, ITEM_*, KITCHEN_*, WAITER_*, PAYMENT_*, SETTLEMENT_*, TABLE_*, RESERVATION_*, SLA_*, PROMISE_*

**Missing from `ReplayEventType`:**
- `GUARDIAN_CASE_OPENED`
- `GUARDIAN_NOTIFICATION_SENT`
- `GUARDIAN_ACKNOWLEDGED`
- `GUARDIAN_BREACH_DETECTED`
- `GUARDIAN_CASE_RESOLVED`
- Any WhatsApp send/receive event type

### Critical finding:

TicketEvent records for `GUARDIAN_*` events **are written** by `GuardianService` and `TicketEventService`. But the Serve Replay transformer does not know how to handle them — they are not in the `ReplayEventType` union and would be filtered out or cause type errors.

**Answer:** The Serve Replay infrastructure is sound. Adding Guardian events to the replay requires:
1. Adding `GUARDIAN_*` entries to `ReplayEventType`
2. Adding `EVENT_TYPE_METADATA` entries for them
3. Updating the transformer to map TicketEvent `GUARDIAN_*` → ReplayEvent

This is small, well-defined work. No schema migration required.

---

## 12. Security / Authorization Audit

**Status:** VERIFIED (existing) / UNKNOWN (WhatsApp reply identity)

### Existing security:

| Mechanism | Status |
|---|---|
| Twilio webhook signature (`x-twilio-signature`) | VERIFIED — validated in `/api/webhooks/twilio/whatsapp` |
| Meta Cloud webhook signature (`x-hub-signature-256`) | VERIFIED — validated in `/api/webhooks/whatsapp` |
| Guardian API session auth | VERIFIED — `resolveBusinessContext()` required |
| Acknowledge API | VERIFIED — session required, businessId validated |
| WhatsApp settings API | VERIFIED — role check (OWNER required for write) |
| Tenant isolation | VERIFIED — all queries scoped by `businessId` |

### Future requirement — WhatsApp reply identity:

**Problem:** If a staff member replies "ACK" to a Guardian WhatsApp alert, how does the system know:
1. Which staff member this is? (phone → User lookup)
2. Which Guardian case to acknowledge? (no case reference in text reply)
3. Which business this belongs to? (staff phone → user.businessId)

**Existing evidence that resolves parts 1 and 3:**
- `WhatsAppOrderService.processIncomingMessage()` already does staff lookup by phone: `prisma.user.findFirst({ where: { phone: from.replace('whatsapp:', '') } })`
- This resolves: "who is this?" and "which business?"

**Unsolved (part 2):** Identifying which case to acknowledge. Options:
- Include case ID in the alert message (e.g., "ACK #abc123" reply format)
- Acknowledge the most recent open case assigned to the staff member
- Use conversation threading (complex)

**The existing architecture provides:** staff identity resolution by phone. A new mechanism is needed for case correlation.

---

## 13. Scheduler / Worker Audit

**Status:** VERIFIED

### Promise Engine evaluation:
- **Primary:** Railway worker (every 2 minutes, in-process scheduler)
- **Fallback:** Vercel cron (daily at midnight — effectively useless as a fallback)
- **Lock:** Redis `acquireCronLock('promise-evaluation', 60s)`
- **Endpoint:** `GET /api/cron/promise-evaluation` (Bearer CRON_SECRET)

### Guardian evaluation:
- **Primary:** Railway worker (every 2 minutes, in-process scheduler)
- **Fallback:** Vercel cron (daily at 1am — effectively useless)
- **Lock:** Redis `acquireCronLock('guardian-evaluation', 120s)`
- **Endpoint:** `GET /api/cron/guardian` (Bearer CRON_SECRET)

### WhatsApp delivery implications for V1:

| Requirement | Current capability | Gap |
|---|---|---|
| Immediate synchronous sending | YES — `NotificationService.sendWhatsApp()` is synchronous | None |
| Queued delivery | No queue — direct HTTP call | Risk: fails silently |
| Retries | None | Missing — alerts can be lost if Twilio is unreachable |
| Delayed delivery (escalation) | Not implemented | Nice-to-have |
| Delivery reconciliation | None | Missing |
| Dedup | Guardian: 15min window | Sufficient for V1 |

**Recommendation for V1:** Accept synchronous delivery with no retry. Log `result: 'FAILED'` in `GuardianIntervention`. Add monitoring. Full retry queue is post-V1.

---

## 14. Payment / Customer Experience Boundary

**Status:** VERIFIED

### What stays OUTSIDE WhatsApp V1:

| Feature | Reason |
|---|---|
| Smart Dining Slip™ delivery to customer | Already implemented; customer-facing; not operational |
| Split payment WhatsApp trigger | Customer-facing; already implemented |
| `sendPaymentConfirmation()` | Customer-facing; currently not even wired |
| Voice ordering (GPT-4 + Whisper) | Customer-facing AI; not operational comms |
| Campaign broadcasts | Marketing; not operational |
| Daily/weekly reports to owner | Management reporting; not operational alert |
| OTP via WhatsApp | Already implemented; auth, not operational |
| Tap & Leave™ checkout WhatsApp | Customer checkout; not operational alert |

### V1 boundary is strict:

WhatsApp V1 = operational alerts from Guardian/Promise Engine to staff only. No customer-facing WhatsApp in V1.

---

## 15. Current Architecture Diagram

```
Customer
   ↓ (QR scan / menu / cart)
Order Created (Sale record)
   ↓
KitchenDispatchService.dispatchToKitchen()
   ├── Pusher → Kitchen Dashboard / KDS          [WORKS TODAY]
   ├── TicketEvent: ORDER_CREATED                [WORKS TODAY]
   └── PromiseEngine.createOrUpdatePromise()     [WORKS TODAY]
            ↓ [every 2 min]
   PromiseEngine.evaluateActivePromises()        [WORKS TODAY]
            ↓ (on WARNING/CRITICAL)
   triggerIntervention()
     → NotificationService.sendWhatsApp(
           business.whatsappNumber,              [WORKS - wrong target]
           "⚠️ Order #X running late"
         )
     → AlertDeliveryService (CRITICAL only)      [WORKS TODAY]
            ↓ [every 2 min]
   GuardianService.evaluateActiveSignals()       [WORKS TODAY]
            ↓
   GuardianCase.detect() → understand() → decide()
            ↓ [ASSIST mode only]
   GuardianService.intervene()
     → GuardianResponsibilityRouter.route()      [WORKS TODAY]
          (finds staff by role + whatsappEnabled)
     → NotificationService.sendWhatsApp(
           staff.whatsappNumber,                 [WORKS TODAY]
           guardianMessage
         )
     → GuardianIntervention record created       [WORKS TODAY]
            ↓
   ★ Staff receives WhatsApp alert               [WORKS TODAY - in ASSIST mode]
            ↓
   Staff acts on order
            ↓
   Promise fulfilled (kitchenStatus → ready)    [WORKS TODAY]
            ↓
   GuardianService.verify() → PROTECTED_BY_GUARDIAN [WORKS TODAY]
            ↓
   GuardianService.acknowledgeCase()            [WORKS - dashboard only]
            ↓
   Serve Replay                                 [PARTIALLY WORKS]
     TicketEvent: GUARDIAN_* written             [WORKS]
     ReplayEventType: GUARDIAN_* not mapped      [MISSING]

──────────────────────────────────────
WHERE WHATSAPP V1 FITS:

Customer → Order → KitchenDispatch
                        ↓
               ★ NEW: WhatsApp "New Order Alert"   [MISSING]
                  to duty manager/owner
                        ↓
               PromiseEngine WARNING
                        ↓
               ★ FIX: Route to staff individual    [FIX NEEDED]
                  (not business.whatsappNumber)
                        ↓
               Guardian ASSIST mode alert          [WORKS]
                        ↓
               ★ NEW: WhatsApp reply "ACK"         [MISSING]
                  routes to acknowledgeCase()
                        ↓
               Order fulfilled / recovered
                        ↓
               ★ NEW: WhatsApp "Resolved" message  [MISSING]
                  to staff who was alerted
                        ↓
               ★ FIX: Serve Replay records it      [FIX NEEDED]
```

---

## 16. Reuse Matrix

| Existing Component | Reuse As-Is | Extend | New Adapter | New Component | Do Not Touch |
|---|---|---|---|---|---|
| `NotificationService.sendWhatsApp()` | ✅ | — | — | — | — |
| `WhatsAppCloudService.sendText()` | — | ✅ (add delivery tracking) | — | — | — |
| `GuardianResponsibilityRouter` | ✅ | — | — | — | — |
| `GuardianService.intervene()` | ✅ | — | — | — | — |
| `GuardianService.acknowledgeCase()` | ✅ | ✅ (allow WhatsApp identity) | — | — | — |
| `GuardianService.formatMessage()` | — | ✅ (add case ID for ACK) | — | — | — |
| Promise Engine `triggerIntervention()` | — | ✅ (route to individual) | — | — | — |
| `WhatsAppMessage` model | ✅ | — | — | — | — |
| `user.whatsappEnabled` + `user.whatsappNumber` | ✅ | — | — | — | — |
| Heart Pulse event catalog | ✅ | ✅ (add WHATSAPP_ALERT_SENT) | — | — | — |
| `TicketEvent` + `TicketEventService` | ✅ | — | — | — | — |
| Serve Replay transformer | — | ✅ (add GUARDIAN_* types) | — | — | — |
| `KitchenDispatchService` | ✅ | — | — | — | — |
| Twilio inbound webhook | — | ✅ (add ACK processing) | — | — | — |
| `WhatsAppOrderService.processIncomingMessage()` | — | — | ✅ (extract staff-by-phone) | — | — |
| `AlertDeliveryService` | ✅ | — | — | — | — |
| `SplitPaymentWhatsAppService` | — | — | — | — | ✅ (leave alone) |
| `WhatsAppService` (marketer) | — | — | — | — | ✅ (leave alone) |
| Campaign scheduler | — | — | — | — | ✅ (leave alone) |
| Voice order webhook | — | — | — | — | ✅ (leave alone) |
| Seat Management | — | — | — | — | ✅ (defer entirely) |
| `WhatsAppBot.tsx` | — | — | — | — | ✅ (ignore) |

---

## 17. V1 Gap Analysis

### V1 Requirement A — New Order Alert

| Property | Status | Evidence |
|---|---|---|
| Trigger event | `order.created` Pusher event + `ORDER_CREATED` TicketEvent | VERIFIED |
| Recipient | No "duty staff" concept for new order alerts | MISSING |
| Message data | `KitchenDispatchService` has: orderNumber, tableNumber, items, orderSource | VERIFIED |
| Delivery mechanism | `NotificationService.sendWhatsApp()` | VERIFIED |
| Missing pieces | (1) Who receives new order alerts? Guardian routes by whatsappEnabled role. (2) A call to sendWhatsApp at dispatch time — not currently done |

**Assessment:** The event exists; the send mechanism exists; the recipient query exists. What is missing is wiring them together at the dispatch point.

### V1 Requirement B — Guardian Alert

| Property | Status | Evidence |
|---|---|---|
| Trigger event | `GUARDIAN_NOTIFICATION_SENT` — exists | VERIFIED |
| Recipient resolution | `GuardianResponsibilityRouter` — exists | VERIFIED |
| Existing notification | `NotificationService.sendWhatsApp()` — sent in ASSIST mode | VERIFIED |
| WhatsApp bridge | Already exists and operational | VERIFIED |
| Missing pieces | (1) `whatsappEnabled` must be set on staff — no UI exists. (2) Guardian must be in ASSIST mode per business. (3) Message does not include a case reference for ACK reply |

**Assessment:** This is the most complete V1 requirement. Guardian alert via WhatsApp **already works** if the feature flag is ASSIST and staff has `whatsappEnabled=true`. The only gap is the ACK reply path.

### V1 Requirement C — Promise Alert

| Property | Status | Evidence |
|---|---|---|
| Trigger event | `PROMISE_WARNING` / `PROMISE_CRITICAL` — exists | VERIFIED |
| Existing notification | `notifyStaff(business.whatsappNumber)` — sends to wrong target | PARTIALLY VERIFIED |
| Recipient resolution | Uses business number, NOT individual staff | BROKEN |
| Missing pieces | (1) `notifyStaff()` must be changed to route to the responsible individual (2) Idempotency missing (same 15min dedup doesn't apply here) |

**Assessment:** The alarm fires but hits the wrong phone. This is a small fix: replace `business.whatsappNumber` with a `GuardianResponsibilityRouter.route()` call (already exists) inside `notifyStaff()`.

### V1 Requirement D — Acknowledgement

| Property | Status | Evidence |
|---|---|---|
| Dashboard ACK | `POST /api/guardian/[caseId]/acknowledge` — exists | VERIFIED |
| WhatsApp reply ACK | Not implemented | MISSING |
| Staff identity resolution from phone | Pattern exists in `WhatsAppOrderService` | PARTIALLY VERIFIED |
| Case ID resolution from reply | No mechanism exists | MISSING |

**Assessment:** Dashboard ACK works. WhatsApp ACK requires: (1) include case reference in alert message, (2) parse "ACK #caseref" in inbound webhook, (3) call `acknowledgeCase()`.

### V1 Requirement E — Resolution

| Property | Status | Evidence |
|---|---|---|
| Resolution detection | `GuardianService.verify()` — exists | VERIFIED |
| Resolution message to staff | Not implemented | MISSING |
| Existing resolution record | `GuardianCase.resolvedAt`, `outcome`, `verificationNotes` | VERIFIED |

**Assessment:** The system knows when a case is resolved. It does not send a WhatsApp "all clear" to the staff member. This is a new capability — add a send in `resolveCase()`.

### V1 Requirement F — Serve Replay

| Property | Status | Evidence |
|---|---|---|
| TicketEvent records for Guardian | Written correctly | VERIFIED |
| Serve Replay transformer handles GUARDIAN_* | Not implemented | MISSING |
| WhatsApp send events in TicketEvent | Not written | MISSING |

**Assessment:** Two steps: (1) add GUARDIAN_* to `ReplayEventType`; (2) optionally add a WHATSAPP_SENT TicketEvent type.

---

## 18. Communication Engine Assessment

| Stage | Existing Capability | Location | Status | Gap |
|---|---|---|---|---|
| Event | Heart Pulse event catalog (33 event types) | `event-catalog.ts` | VERIFIED | No WhatsApp-specific event type |
| Priority | Guardian decision levels (OBSERVE/RECOMMEND/ALERT/ESCALATE) | `decision-policy.ts` | VERIFIED | None for V1 |
| Recipient Resolution | `GuardianResponsibilityRouter` | `responsibility-router.ts` | VERIFIED | No branch/area scoping |
| Message Generation | `GuardianService.formatMessage()` | `guardian.service.ts` | VERIFIED | No case ID in message |
| Gateway | `NotificationService.sendWhatsApp()` | `notification.service.ts` | VERIFIED | No delivery tracking |
| Delivery | Synchronous HTTP to Twilio | `notification.service.ts` | VERIFIED | No retry, no receipt |
| Human Response | Dashboard `acknowledgeCase()` API | `acknowledge.ts` | VERIFIED | No WhatsApp reply path |
| Outcome | `GuardianService.verify()` + `resolveCase()` | `guardian.service.ts` | VERIFIED | No "resolved" message sent |

**Conclusion:** 6 of 8 Communication Engine stages already exist. The two gaps are: Human Response (WhatsApp reply routing) and Outcome (resolved notification). A new abstraction is NOT needed — these are targeted additions to existing code.

---

## 19. End-to-End Simulation

Using today's actual architecture:

| Step | Status | Evidence |
|---|---|---|
| 1. Customer scans QR | WORKS TODAY | QR routes to menu |
| 2. Customer orders | WORKS TODAY | `Sale` created via menu API |
| 3. Order enters ImboniServe | WORKS TODAY | `KitchenDispatchService` called |
| 4. Staff sees the order on dashboard | WORKS TODAY | Pusher `order.created` → KDS |
| 5. Deliberate delay — order stagnates | WORKS TODAY | No kitchen status update |
| 6. Promise Engine detects risk | WORKS TODAY | Cron evaluates every 2min; transitions to WARNING |
| 7. Guardian evaluates situation | WORKS TODAY | Cron picks up WARNING signal |
| 8. Appropriate staff member should be alerted | PARTIALLY WORKS | Guardian routes to individual by whatsappEnabled role — but requires ASSIST mode AND whatsappEnabled=true on staff |
| 8a. WhatsApp delivers the alert | WORKS IF CONFIGURED | `NotificationService.sendWhatsApp()` called; Twilio sends |
| 9. Staff acknowledges | PARTIALLY WORKS | Dashboard ACK works; WhatsApp reply ACK MISSING |
| 10. Staff intervenes — resolves order | WORKS TODAY | Kitchen updates status |
| 11. System observes outcome | WORKS TODAY | Promise transitions to FULFILLED; Guardian verifies |
| 12. Promise fulfilled / recovered | WORKS TODAY | `GuardianService.verify()` → PROTECTED_BY_GUARDIAN |
| 13. WhatsApp communicates resolution | MISSING | No "resolved" message sent |
| 14. Serve Replay contains operational story | PARTIALLY WORKS | TicketEvents written; GUARDIAN_* not in ReplayEventType |

**Summary:**
- WORKS TODAY: 8/14 steps
- PARTIALLY WORKS: 3/14 steps  
- MISSING: 3/14 steps (WhatsApp ACK, resolved message, Serve Replay Guardian events)

---

## 20. Customer #1 Assessment

**Question:** What is the minimum WhatsApp capability that materially improves Customer #1's operational experience without creating deployment risk?

**Current deployment situation:** Vercel (Hobby plan) + Railway worker for scheduling. The Railway worker is the critical dependency for 2-minute Guardian/Promise Engine evaluation.

**What genuinely helps Customer #1 immediately:**
1. Guardian ASSIST mode enabled for their business
2. `whatsappEnabled=true` set on at least one staff member with `whatsappNumber`
3. Twilio credentials configured (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`)

**With only these three prerequisites, the following already works:**
- Guardian alerts to identified staff member when orders run late (ALERT/ESCALATE levels)
- Guardian 15-minute dedup to avoid spam
- GuardianCase, GuardianIntervention, GuardianLearningSignal all recorded

**What doesn't work yet but matters for Customer #1:**
- New Order Alert (no wiring at dispatch time — useful for managers who aren't watching the dashboard)
- Promise Engine sending to individual vs business number (important — manager gets alerted, not the business WhatsApp)
- WhatsApp ACK reply (useful but not critical — they can use dashboard)
- "Resolved" notification (nice to have)

**Recommendation:**

WhatsApp should be **pilot-only before Customer #1**, with a specific configuration:
- Guardian in ASSIST mode ✓ (already can be done via feature flag)
- At minimum one `whatsappEnabled` staff member ✓ (DB update, no migration)
- Fix `notifyStaff()` in Promise Engine to route to individual ✓ (small code change)
- Include case ID in Guardian message for future ACK ✓ (small message format change)
- Do NOT require inbound ACK from WhatsApp for Customer #1 — dashboard works

This gives Customer #1 real operational WhatsApp alerting with no deployment risk, using the infrastructure already built.

---

## 21. What NOT to Build (V1)

| Feature | Why exclude |
|---|---|
| Customer WhatsApp ordering (AI/NLP) | Already partially exists in `voice-order.ts`; out of V1 operational scope |
| AI customer assistant | Out of V1 scope |
| Full WhatsApp CRM | Not V1 |
| Marketing broadcasts | Campaign scheduler exists; leave it alone |
| Loyalty messaging | Not V1 |
| Reservations via WhatsApp | Not V1 |
| Supplier communication | Not V1 |
| Daily management briefing | `sendDailyReport()` exists; leave it alone |
| Benchmarking | Not V1 |
| New seat architecture | Seat model exists; WhatsApp V1 does not depend on it |
| New dashboard for WhatsApp | Guardian dashboard already surfaces what's needed |
| Generic Communication Engine platform | Unnecessary — targeted additions to existing services suffice |
| Full message delivery retry system | Post-V1 |
| WhatsApp message template management UI | Post-V1 |
| Multi-location WhatsApp routing | Post-V1 |
| Customer opt-in management | Already partially exists; out of V1 scope |

---

## 22. Recommended V1 Architecture

The smallest correct WhatsApp V1 for ImboniServe operational communication:

```
═══════════════════════════════════════════════════════
COMPONENT            WHAT TO DO             WHO/WHAT
═══════════════════════════════════════════════════════
KitchenDispatchService  Add: call router to   New wiring (15 LOC)
                        find duty manager;
                        send New Order Alert

Promise Engine          Fix: notifyStaff()    Fix (10 LOC)
triggerIntervention()   → route to individual
                        via existing Router

Guardian formatMessage  Extend: add case ref   Fix (5 LOC)
                        "Reply ACK-{caseId}"

Guardian resolveCase    Add: send "resolved"   New (10 LOC)
                        WhatsApp to assignedUser

Twilio inbound webhook  Extend: parse "ACK-X"  Extend (30 LOC)
                        → call acknowledgeCase()

Serve Replay types      Extend: add GUARDIAN_*  Extend (50 LOC)
                        to ReplayEventType

WhatsApp message log    Extend: log all        Extend (10 LOC)
                        operational sends to
                        WhatsAppMessage model

No new models           ✅
No new Prisma migrations ✅
No new cron jobs        ✅
No new API routes       ✅ (ACK goes through existing webhook)
No new dashboard        ✅
═══════════════════════════════════════════════════════
```

**Gateway decision:** Use `NotificationService.sendWhatsApp()` (Twilio) as the single V1 gateway. Do not introduce the Cloud API for V1 operational alerts — the existing Twilio path is production-proven.

---

## 23. Recommended Implementation Sequence

1. **Prerequisite verification** — confirm Railway worker is running at 2min cadence; confirm Twilio credentials configured; set `whatsappEnabled=true` + `whatsappNumber` on at least one staff member; set Guardian feature flag to ASSIST for the pilot business.

2. **Fix Promise Engine staff routing** — replace `notifyStaff(business.whatsappNumber)` with `GuardianResponsibilityRouter.route()` → `NotificationService.sendWhatsApp(person.whatsappNumber)`.

3. **Add case reference to Guardian message** — append "Reply ACK-{caseId:8chars}" to `formatMessage()` output.

4. **Add resolved notification** — in `resolveCase()`, if `assignedUserId` exists, send "✅ Resolved" WhatsApp to that user.

5. **Wire New Order Alert at dispatch** — in `KitchenDispatchService.dispatchToKitchen()`, after successful dispatch, call `GuardianResponsibilityRouter.route()` and send a brief "New Order" WhatsApp.

6. **Extend Twilio inbound webhook for ACK** — in `/api/webhooks/twilio/whatsapp`, parse "ACK-{caseId}" pattern; look up staff by phone; call `GuardianService.acknowledgeCase()`.

7. **Extend Serve Replay types** — add `GUARDIAN_*` events to `ReplayEventType` and `EVENT_TYPE_METADATA`.

8. **Log all V1 operational sends to `WhatsAppMessage`** — ensure every operational alert is recorded with `businessId`, `recipient`, `direction: 'OUTBOUND'`, `type: 'OPERATIONAL_ALERT'`.

9. **End-to-end simulation** — manually trigger a late order; verify alert arrives; test ACK reply; verify Serve Replay shows the story.

10. **Founder verification** — walk through the full loop with a real order at Customer #1's location.

11. **Shadow mode first** — enable Guardian SHADOW for a week; confirm case detection works before switching to ASSIST.

12. **ASSIST mode + full V1** — enable ASSIST; deploy full V1 additions.

---

## 24. Risk Register

| Risk | Severity | Likelihood | Notes |
|---|---|---|---|
| `whatsappEnabled` flag not set on staff | HIGH | HIGH | No UI exists; requires manual DB update; V1 silently fails routing |
| Railway worker not running → 2min cron fails | HIGH | MEDIUM | Guardian/PromiseEngine depends on it; Vercel fallback is daily not 2min |
| Twilio not configured → silent success | MEDIUM | MEDIUM | `NotificationService` returns `{success: true}` if not configured |
| Guardian in SHADOW mode (not ASSIST) → no sends | HIGH | HIGH | Default is SHADOW; must explicitly enable ASSIST per business |
| Duplicate alerts if lock fails | MEDIUM | LOW | 15min dedup window covers most cases |
| No message delivery receipt | MEDIUM | MEDIUM | Twilio failures logged as FAILED in GuardianIntervention but no retry |
| Tenant isolation breach | LOW | LOW | All queries scoped by businessId; router scoped by businessId |
| WhatsApp reply identity collision | MEDIUM | LOW | Staff phone must be unique in User table (enforced by schema) |
| Case ID brute-force via ACK | LOW | LOW | 8-char caseId is not secret; only affects their own cases |
| Scope creep — V1 expands to customer platform | HIGH | MEDIUM | Strong governance required; V1 is operational staff alerts only |
| Supabase migration dependency | LOW | LOW | No new models required for V1 |
| Guardian message length | LOW | LOW | WhatsApp allows 4096 chars; current messages are ~200 chars |
| `customer.businessId` null issue in voice-order route | LOW | LOW | Out of V1 scope; known schema quirk |

---

## 25. Open Questions

| # | Question | Owner | Blocking V1? |
|---|---|---|---|
| Q1 | Is Railway worker currently running in production? | Founder | YES |
| Q2 | Is a Twilio account provisioned with a WhatsApp-enabled number? | Founder | YES |
| Q3 | Which staff member(s) should receive operational alerts at Customer #1? | Founder | YES |
| Q4 | Should `whatsappEnabled` have a UI in the staff management page? | Founder | No (can do DB directly for V1) |
| Q5 | Should the New Order Alert go to: (a) the same Guardian-routed person, or (b) a separate "duty manager" concept? | Founder | No (same router works for V1) |
| Q6 | Is the ACK reply path required before Customer #1, or can dashboard ACK suffice? | Founder | No — dashboard ACK exists |
| Q7 | Should Guardian ASSIST mode be enabled globally or per-business? | Founder | Yes — must be decided before deployment |
| Q8 | Is the VERCEL-002C Guardian scheduler currently deployed and verified running? | Founder | YES — blocks everything |
| Q9 | Is the Meta Cloud API (`WHATSAPP_CLOUD_TOKEN`) a preferred alternative to Twilio for production? | Founder | No — V1 uses Twilio |
| Q10 | Should resolved/recovery notifications be sent proactively to staff, or pulled on-demand? | Founder | No (proactive is better UX but not critical) |

---

## 26. Final Decision Summary

**Here is the exact current state of ImboniServe, here is the evidence, here is what WhatsApp should reuse, here are the genuine gaps, and here is the smallest implementation we should undertake once Deployment Reality is certified.**

### A. What we already have (strongest reusable foundations)

1. **`NotificationService.sendWhatsApp()`** — operational Twilio WhatsApp send, proven in production (used by OTP, kitchen ready, Guardian)
2. **`GuardianResponsibilityRouter`** — role-priority staff recipient resolution already implemented and working
3. **`GuardianService.intervene()`** — the full ALERT → WHATSAPP pathway is already wired; works in ASSIST mode
4. **`GuardianCase` + `GuardianIntervention` models** — case lifecycle, delivery tracking, acknowledgement all modeled
5. **`user.whatsappEnabled` + `user.whatsappNumber`** — per-staff WhatsApp opt-in already in schema
6. **Heart Pulse event catalog** — 33 event types covering the entire operational lifecycle
7. **`TicketEventService`** — append-only event log that backs Serve Replay
8. **Twilio inbound webhook** — existing staff phone identity resolution pattern

### B. What we thought we had but do not actually have

1. **A working New Order Alert** — there is no WhatsApp notification at order creation time; Pusher only goes to dashboard
2. **Promise Engine routing to individual staff** — `notifyStaff()` sends to the business phone number, not a person
3. **Inbound WhatsApp ACK** — the acknowledge API exists but is dashboard-only; no reply parsing
4. **Guardian events in Serve Replay** — TicketEvents are written but the Serve Replay transformer ignores them
5. **Any UI to set `whatsappEnabled`** — the field exists but no staff management UI surfaces it

### C. What is incomplete

1. `WhatsAppCloudService` — inbound webhook logs messages but processes nothing
2. `WhatsAppBot.tsx` — entirely simulated; no backend
3. Campaign scheduler — writes to DB only; no real Twilio send
4. `sendPaymentConfirmation()` — builds message but never sends it
5. Serve Replay — missing GUARDIAN_* event type support

### D. What should be reused

`NotificationService.sendWhatsApp()`, `GuardianResponsibilityRouter`, `GuardianService.acknowledgeCase()`, `KitchenDispatchService` (hook into it), `TicketEventService`, `WhatsAppMessage` model, `user.whatsappEnabled/whatsappNumber`, Heart Pulse `GUARDIAN_*` events

### E. What should be extended

`GuardianService.formatMessage()` (add case ref), `GuardianService.resolveCase()` (add resolved send), `PromiseEngine.notifyStaff()` (route to individual), Twilio inbound webhook (add ACK parsing), Serve Replay types (add GUARDIAN_* entries)

### F. What genuinely needs to be new

1. New Order Alert wiring in `KitchenDispatchService` (small)
2. ACK reply parser in Twilio webhook (small)
3. A `WHATSAPP_OPERATIONAL_ALERT` TicketEvent type (schema enum addition — migration required)

### G. What must wait (post-V1)

Customer WhatsApp ordering, AI assistant, campaign management UI, message delivery retry queue, template management, multi-branch routing, WhatsApp opt-in UI, voice ordering, resolved notification history UI, benchmarking

### H. Recommended WhatsApp V1 Architecture

```
KitchenDispatch → [NEW] New Order Alert → GuardianRouter → NotificationService.sendWhatsApp
                                                 ↑
PromiseEngine WARNING/CRITICAL → [FIX] Route to individual (not business) → NotificationService.sendWhatsApp
                                                 ↑
GuardianService ASSIST → [WORKS] Alert to routed staff → NotificationService.sendWhatsApp
                                                 ↓
                          GuardianIntervention record [WORKS]
                                                 ↓
Staff replies "ACK-{caseId}" → [NEW] Twilio webhook parser → acknowledgeCase() [WORKS]
                                                 ↓
Order fulfilled → GuardianService.verify() [WORKS] → [NEW] "Resolved" send to assignedUser
                                                 ↓
                          Serve Replay [FIX: add GUARDIAN_* types]
```

### I. Recommended implementation sequence

See Section 23 above (12 steps, ordered by dependency).

### J. Risk register

See Section 24 above. The three highest risks are: `whatsappEnabled` flag not set, Railway worker not confirmed running, Guardian not in ASSIST mode.

---

*Audit complete. No code was modified. No commits were made. No migrations were run.*  
*Evidence: all findings based on direct file inspection of commit `7bcd1db` on branch `main`.*
