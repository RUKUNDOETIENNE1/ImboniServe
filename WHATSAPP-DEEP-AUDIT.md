# WHATSAPP DEEP AUDIT — ImboniServe

**Date:** 2026-09-21
**Repo:** C:\Dev\ImboniResto @ `main` (post `a17659b`)
**Type:** AUDIT ONLY — no code, env, migration, or deployment changes were made.
**Method:** All claims verified against actual code paths (file:line), not filenames/comments/UI labels. A prior audit doc exists at `docs/WHATSAPP-001-Forensic-Current-State-Audit.md` and is consistent with these findings.

---

## 1. IMPLEMENTATION MAP

| Feature | Frontend/UI | API route | Service | DB model | Provider | Worker/cron | Status |
|---|---|---|---|---|---|---|---|
| Staff-assisted ordering (Twilio) | none | `api/webhooks/twilio/whatsapp.ts` | `whatsapp-order.service.ts` | `Sale`, `User`, `Table`, `MenuItem` | Twilio (TwiML reply) | — | PARTIALLY BUILT |
| Customer self-service ordering | `WhatsAppBot.tsx` (dead demo) | `api/webhooks/whatsapp.ts` (Meta) | none wired | `WhatsAppMessage` (unused inbound) | Meta Cloud | — | NOT IMPLEMENTED |
| AI/voice ordering | none | `api/webhooks/twilio/voice-order.ts` | inline (Whisper+GPT-4) | `Sale`, `Customer` | Twilio + OpenAI | — | PARTIALLY BUILT / BROKEN |
| Outbound send (Meta Cloud) | — | — | `whatsapp-cloud.service.ts` `sendText`/`sendTemplate` | `WhatsAppMessage` (log only) | Meta Graph API | — | BUILT |
| Outbound send (Twilio REST) | — | — | `notification.service.ts` `sendWhatsApp` | — | Twilio REST | — | BUILT |
| Outbound send (Twilio SDK) | — | — | `whatsapp-order.service.ts` `sendMessage` | — | Twilio SDK | — | BUILT |
| Generic send wrapper | — | — | `whatsapp.service.ts` `sendMessage` | `WhatsAppMessage` | `WHATSAPP_API_URL` (generic) | — | PARTIAL (fail-open success) |
| Order-ready staff notify | — | `api/orders/[id]/status.ts` | `notifyOrderReady` | `Sale` | Twilio SDK | — | BUILT (staff only, WHATSAPP-source only) |
| Order-ready customer notify | — | `api/kitchen/order/[id]/ready.ts` | `NotificationService.sendWhatsApp` | `Sale` | Twilio REST | — | BUILT (if `customerPhone` set) |
| New-order owner alert | — | payment completion | `sendOrderNotification` | `Sale` | Twilio REST | — | BUILT |
| Smart dining slip (post-payment) | slip UI | `api/smart-dining-slips/[id].ts` | `notification.service.ts` `sendSmartDiningSlip` | `WhatsAppMessage` | Twilio REST | — | BUILT (PDF path broken) |
| Split-payment trigger | — | — | `split-payment-whatsapp.service.ts` | `SplitPaymentWhatsAppTrigger` | via slip sender | — | BROKEN (link never sent) + dead code |
| Payment confirmation text | — | — | `sendPaymentConfirmation` | — | — | — | STUBBED (builds text, never sends, no callers) |
| Campaigns | `dashboard/campaigns.tsx` | `api/campaigns.ts`, `api/campaigns/[id]/send.ts` | `lib/whatsapp/campaign-scheduler.ts` | `Promotion`, `WhatsAppMessage` | NONE (fake send) | none scheduled | STUBBED send + BROKEN tenant check |
| Reorder funnel | — | — | — | `Sale`, `Customer` | Meta Cloud | `cron.ts` setInterval daily 10:00 Kigali | PARTIAL (real send, no dedup/opt-out, needs `CRON_WORKER` host) |
| Trending post alerts | — | — | — | — | Twilio SDK | `cron.ts` | BUILT (best-effort) |
| Reservation confirmation | reservation UI | reservation create | `reservation.service.ts` `sendConfirmation` | `Reservation` | Twilio REST | — | BUILT |
| Reservation reminders | — | `api/cron/reservation-reminders.ts` | `reservation-reminder.service.ts` | `Reservation` | via notification | **not in vercel.json / CronService** | BUILT but UNSCHEDULED |
| WhatsApp settings | `dashboard/settings.tsx`, `dashboard/notifications.tsx` | `api/settings/whatsapp.ts` | — | `Business.whatsapp*` flags | — | — | BUILT (one dead toggle) |
| Opt-in/opt-out | — | — | `whatsapp.service.ts` `hasOptedIn`/`updatePreferences` | `WhatsAppMessage` hack | — | — | BROKEN (fails open, `businessId:'system'`, zero call sites) |

---

## 2. STAFF-ASSISTED ORDERING — PARTIALLY BUILT

**Actual flow (traced):**
`POST /api/webhooks/twilio/whatsapp` → optional signature check → `WhatsAppOrderService.processIncomingMessage(From, Body)` → regex `ORDER <TABLE> <items>` → staff lookup by `user.phone` + role → `staff.business` (tenant) → `Table` lookup scoped to business → item parse → `MenuItem` fuzzy match → `prisma.sale.create` (`orderSource:'WHATSAPP'`, `paymentMethod:'CASH'`, `PENDING`) → TwiML `<Message>` reply.

**Works:** authentication-by-phone-role, tenant isolation via staff record, table scoping, server-side prices, quantities, order notes (`NOTES:`/`[note]`/`(note)`), order number, confirmation reply, post attribution marker.

**Verified gaps:**

| Check | Finding | Evidence |
|---|---|---|
| Signature | Fail-open if `TWILIO_AUTH_TOKEN` or header missing | `twilio/whatsapp.ts:30` |
| Phone normalization | Exact match on `+250…` vs stored `0788…` — no `normalizePhone` | `whatsapp-order.service.ts:58` |
| Duplicate messages/orders | `MessageSid` never read; `WhatsAppMessage` has no sid column; unconditional `sale.create` | webhook:43; service:236; schema `WhatsAppMessage` |
| Kitchen dispatch | **Never calls `KitchenDispatchService.dispatchToKitchen`** → no Pusher event, no station routing, `kitchenDispatchStatus` stays `pending`; order only appears via kitchen list polling | service:223-268; cf. `payment-completion.service.ts:270` |
| Silent item drops | Unmatched items omitted without warning; confirmation lists only matched items | service:212-218 |
| Ambiguous matches | `contains` first-row-wins ("Primus" → 50cl vs 70cl non-deterministic) | service:201-210 |
| Tax | No VAT/subtotal — raw Σ(price×qty) | service:230-232 |
| Currency bug | `formatOrderConfirmation` reads `order.business?.currency` but `include` lacks `business` → always RWF | service:274 vs 259-262 |
| Status query | `getOrderStatus` exists but no `STATUS` command parsed — dead | service:343 |
| Cancellation | No CANCEL command | — |
| TwiML escaping | `result.reply` interpolated unescaped — `&`/`<` breaks reply XML | webhook:46-49 |
| Error path | Try/catch returns generic TwiML error — acceptable | webhook:53-63 |

**Verdict:** works to "order persists + reply sent + appears on kitchen list (poll)"; fails real-time dispatch, dedup, robustness.

---

## 3. CUSTOMER WHATSAPP ORDERING — NOT IMPLEMENTED

| Step | Status | Evidence |
|---|---|---|
| 1. Start conversation | MISSING | Meta webhook logs only (`webhooks/whatsapp.ts:42-52`) |
| 2. Be identified | MISSING | Only staff lookup exists |
| 3. Select business | MISSING | Tenant resolves from staff record only |
| 4. Browse menu | MISSING | No MENU command |
| 5. Select products | MISSING | — |
| 6. Build cart | MISSING | Single-shot ORDER only; no cart/conversation state |
| 7. Confirm order | MISSING | — |
| 8. Order number | MISSING for customers | (staff receive it) |
| 9. Status updates | MISSING | `getOrderStatus` dead code |
| 10. Payment instructions | MISSING | split-payment link built but never sent |
| 11. Confirmation | MISSING | slips exist post-payment only |

No conversation state machine, no buttons/lists, no NLP anywhere in WhatsApp paths (`ConversationHistory` model unused). `WhatsAppBot.tsx` is a zero-API demo with fabricated responses — unreferenced dead code.

---

## 4. AI WHATSAPP ORDERING — PARTIALLY BUILT / BROKEN (separate route)

AI lives only in `api/webhooks/twilio/voice-order.ts` (voice note → Whisper → GPT-4 extraction → `sale.create`). **Not wired into the main WhatsApp webhook** — only active if Twilio console points at it.

Defects found:
- **No signature validation at all** (lines 24-47) — unauthenticated order-creation endpoint.
- `language: 'auto'` invalid for Whisper (line 69) → 400s.
- `model: 'gpt-4'` + `response_format: json_object` (144-149) → unsupported on base gpt-4 → extraction broken.
- Customer lookup `phone` only, **no `businessId`** (87-89) → cross-tenant resolution; unknown customers rejected.
- AI `menuItemId`s used without businessId scoping (186-217, 240-252) → **cross-tenant line items + `priceCents||0` writes zero-price items for hallucinated IDs.**
- `MediaUrl0` fetched with Twilio Basic auth to attacker-supplied host → **SSRF + credential leak** (52-56).
- No conversation state, no dedup, no `WhatsAppMessage` logging, orderSource defaults `WAITER_POS`.

**AI-order-risk summary:** model-invented IDs can create wrong-tenant/zero-price items; there is no validation layer between AI output and `sale.create`. AI in the *actual* WhatsApp text flow: **NOT IMPLEMENTED** (regex only). Adjacent AI (brand-assistant, smart-menu-builder, DIE) is unreachable from WhatsApp.

---

## 5. PROVIDER INTEGRATION

| Endpoint/Service | Provider | Signature | Sends? | Issues |
|---|---|---|---|---|
| `webhooks/whatsapp.ts` | Meta Cloud | HMAC-SHA256 — **skipped if `WHATSAPP_APP_SECRET` unset** (31); `===` compare not timing-safe | n/a | Log-only handler; no dedup on `msg.id`; no status persistence |
| `webhooks/twilio/whatsapp.ts` | Twilio | `validateRequest` — **skipped if token or header missing** (30) | TwiML reply | No MessageSid dedup; `webhookUrl` built from `NEXTAUTH_URL` can mismatch real URL |
| `webhooks/twilio/voice-order.ts` | Twilio+OpenAI | **NONE** | SDK send (291) | SSRF on `MediaUrl0`; see §4 |
| `whatsapp-cloud.service.ts` | Meta | — | Real `fetch` to Graph API (41-57, 82-97); Twilio fallback (32-37) | No timeout/retry; logs `messageId` but never persists it |
| `notification.service.ts` | Twilio REST | — | Real POST `Messages.json` (26-42) | PDF slip sends **buffer as MediaUrl** (218-247) — Twilio needs public URL → broken |
| `whatsapp-order.service.ts` | Twilio SDK | — | `messages.create` (299) | No retry |
| `whatsapp.service.ts` | generic | — | `WHATSAPP_API_URL` fetch (23-75) | Returns `{success:true}` when unconfigured (26) |
| `campaign-scheduler.ts` | none | — | **DB insert only, `status:'SENT'`** (95-113) | Fabricated metrics |
| `split-payment-whatsapp.service.ts` | Twilio via slip | — | Sends generic slip text; **split link never transmitted** (154-172) | `consentedWhatsApp=true` hardcoded (177) bypasses consent gate; zero callers |

**Rate limiting:** none on any of the 3 webhook endpoints.

**Dependency classes:** Meta send=B; Meta webhook=B/C (stub handler); Twilio send=B (PDF path=E); Twilio order webhook=C+insecure; voice-order=E; `WhatsAppService`=B/E; campaign send=E; split-payment=E(partial).

---

## 6. CAMPAIGNS / SCHEDULER — STUBBED SEND, NO SCHEDULING

| Capability | State | Evidence |
|---|---|---|
| Creation | BUILT | `api/campaigns.ts:56-98` → `Promotion` row `type:'WHATSAPP_CAMPAIGN'`, tenant-scoped, `hasMarketing` gate |
| Persistence | BUILT | `Promotion.config` holds message/segment/metrics |
| Audience | PARTIAL/BROKEN | `getCustomersBySegment` (campaign-scheduler.ts:71-93) queries `Customer.orders`/`loyaltyTier` — **fields don't exist** → Prisma runtime error for ACTIVE/INACTIVE/VIP; only ALL works |
| Scheduling | NOT IMPLEMENTED | `startDate` stored but nothing fires it; no vercel cron, no CronService job, no BullMQ queue |
| Worker | none | Only DIE BullMQ workers exist |
| Actual send | **STUBBED** | `sendWhatsAppMessage` (95-113) = `whatsAppMessage.create(status:'SENT')` + `setTimeout(100)` — no provider call; `sent`/`delivered` counters fabricated |
| Retries | none | — |
| Dup prevention | none | repeated `POST send` resends; `lastSentAt` never checked |
| Opt-out | NOT RESPECTED | `hasOptedIn` never called; daily cap bypassed |
| **Tenant isolation** | **BROKEN** | `api/campaigns/[id]/send.ts` never checks `campaign.businessId === session.businessId` — cross-tenant send trigger |
| Audit trail | PARTIAL | false SENT rows + DIE shadow events |

---

## 7. RESERVATIONS + WHATSAPP — PARTIALLY BUILT

| Capability | State | Evidence |
|---|---|---|
| Confirmation on create | BUILT | `reservation.service.ts:88 → sendConfirmation(408-431) → sendWhatsApp` to `customerPhone`; non-blocking |
| 24h reminder | NOT WIRED | `sendReminders` zero callers |
| 2h reminder | BUILT, UNSCHEDULED | `reservation-reminder.service.ts` + `api/cron/reservation-reminders.ts` exist; absent from `vercel.json` and `CronService` |
| Inbound booking via WhatsApp | NOT IMPLEMENTED | webhook parses only `ORDER` syntax |
| Modification/cancellation comms | NOT IMPLEMENTED | `cancelReservation` sends nothing |
| No-show forfeit notice | NOT IMPLEMENTED | `cron.ts:640-671` forfeits silently |
| Deposit comms | NOT IMPLEMENTED | deposit initiate/callback send no WhatsApp |

---

## 8. ORDER STATUS NOTIFICATIONS — PARTIALLY BUILT

| State | WhatsApp? | Path | Sync? | Dup? | Retry? | Tenant | Opt-out |
|---|---|---|---|---|---|---|---|
| created | owner alert only | `payment-completion.service.ts:221 → sendOrderNotification` | sync | no guard | no | yes | no |
| confirmed/preparing | **none** | kitchen endpoints have no WA calls | — | — | — | — | — |
| ready (customer) | yes if `customerPhone` | `kitchen/order/[id]/ready.ts:49-56` | sync | **re-press resends** | no | yes | no |
| ready (staff) | yes, WHATSAPP-source only | `orders/[id]/status.ts:81-83 → notifyOrderReady` | sync | yes | no | yes | no |
| completed/delivered | **none** | `waiter/deliver-order.ts` | — | — | — | — | — |
| cancelled | **none** | `sales.service.ts:260` | — | — | — | — | — |

Reorder funnel (cron daily 10:00 Kigali, `whatsappClientSlipsEnabled` gate, real `sendText`) — **no dedup** (re-sends every run) and no opt-out check. Requires `CRON_WORKER=true` non-Vercel host.

---

## 9. SECURITY AUDIT

| # | Severity | Location | Scenario | Mitigation | Recommended fix |
|---|---|---|---|---|---|
| 1 | **CRITICAL** | `voice-order.ts` | Anyone POSTs fake `From`→creates `Sale`; `MediaUrl0`→SSRF w/ Basic-auth creds leaked to attacker host; burns OpenAI quota | none | Add `validateRequest`+raw body; allowlist `api.twilio.com` for media fetch; rate-limit; scope customer+items to businessId |
| 2 | **HIGH** | `twilio/whatsapp.ts:30` | Missing `TWILIO_AUTH_TOKEN` or `x-twilio-signature` → spoofed `From` impersonates any staff phone → order injection | staff role check only | Reject when token unset or header absent (fail-closed); normalize phone |
| 3 | **HIGH** | `webhooks/whatsapp.ts:31` | `WHATSAPP_APP_SECRET` unset → signature bypass | currently log-only | Fail-closed; `timingSafeEqual` |
| 4 | **HIGH** | `campaigns/[id]/send.ts` | Cross-tenant campaign trigger (no businessId check) | `hasMarketing` feature gate only | Add tenant match check |
| 5 | MEDIUM | all 3 webhooks | No rate limiting; Twilio retries → duplicate `Sale` rows | none | Add `withRateLimit`; `messageSid` unique dedup column |
| 6 | MEDIUM | `voice-order.ts` AI path | Prompt injection via voice→GPT→`menuItemId`; wrong-tenant/zero-price items | prices server-side per ID | Re-fetch items scoped `businessId`; reject unknown IDs; require price>0 |
| 7 | MEDIUM | `whatsapp.service.ts:186-238` | Opt-out rows use `businessId:'system'` (FK risk); `hasOptedIn` fails **open** → opted-out users still messaged | none | Real opt-out model/column; fail-closed consent; STOP handler |
| 8 | MEDIUM | `split-payment-whatsapp.service.ts:177` | `consentedWhatsApp=true` hardcoded bypasses consent gate | none | Pass real consent |
| 9 | LOW | multiple | Full message bodies + phones logged (`twilio/whatsapp.ts:40`, order service:28) — PII in logs | — | Log `from` hash + body length only |
| 10 | LOW | `cloud.service.ts:137` | `===` HMAC compare (timing) | — | `crypto.timingSafeEqual` |
| 11 | LOW | `whatsapp.service.ts:26` | Silent `{success:true}` when unconfigured masks misconfig | — | Return failure or throw |

No secrets logged; `.env` handling clean.

---

## 10. DATABASE / PRISMA

| Model | Supports claimed features? | Gap |
|---|---|---|
| `WhatsAppMessage` | PARTIAL | **No `messageSid`/external-id column** → dedup impossible; status never updated by inbound callbacks; opt-out abused via `type:'PREFERENCE_UPDATE'`+`businessId:'system'` |
| `WhatsAppTemplate` | schema BUILT | No code writes/reads it — Meta-side template names only |
| `Customer` | BUILT | `@@unique([businessId,phone])` good; **no `orders`/`loyaltyTier`** → campaign segments crash |
| `ConversationHistory` | UNUSED | Nothing writes to it — no conversation state anywhere |
| `SplitPaymentWhatsAppTrigger` | BUILT | `saleId @unique` dedup works |
| `PartnerCampaign`/`PartnershipCampaign` | metadata only | **No per-recipient send records** |
| `Business.whatsapp*` flags | BUILT | `whatsappOwnerReportsEnabled` never read (dead toggle); `whatsappMonthlyBudgetCents` GET-only |
| `Sale.orderSource` | BUILT | `WHATSAPP` enum used correctly (voice-order omits it) |
| `Reservation` | adequate | fields exist; reminders unscheduled |

Schema does NOT support: inbound message dedup, true opt-out, campaign recipient tracking, conversation state.

---

## 11. ENVIRONMENT VARIABLES (names only)

| Var | Class | Notes |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | runtime-optional | Twilio paths |
| `TWILIO_AUTH_TOKEN` | runtime-optional | **also the security gate** |
| `TWILIO_WHATSAPP_NUMBER` | runtime-optional | SDK `from` |
| `TWILIO_PHONE_NUMBER` | runtime-optional | fallback `from` |
| `WHATSAPP_CLOUD_TOKEN` | runtime-optional (Meta) | **absent from `.env.example`** |
| `WHATSAPP_PHONE_NUMBER_ID` | runtime-optional (Meta) | **absent from `.env.example`** |
| `WHATSAPP_API_VERSION` | optional (default v18.0) | **absent from `.env.example`** |
| `WHATSAPP_VERIFY_TOKEN` | runtime (Meta GET verify) | in `.env.example` |
| `WHATSAPP_APP_SECRET` | runtime (Meta signature) | enforcement depends on it being set |
| `WHATSAPP_API_URL` / `WHATSAPP_API_KEY` / `WHATSAPP_FROM_NUMBER` | runtime (generic svc) | **not in `.env.example`, not in env-validator** |
| `OPENAI_API_KEY` | optional | voice-order breaks without it |
| `NEXTAUTH_URL` | required | signature URL base |
| `NEXT_PUBLIC_APP_URL` | optional | split-payment; inconsistent vs `APP_URL` in notification.service |
| `APP_URL` | optional | QR/daily report link base — **inconsistent** |
| `CRON_WORKER` | runtime | gates all `cron.ts` intervals incl. reorder funnel |

---

## 12. TEST COVERAGE

**Meaningful WhatsApp coverage: ZERO.** All hits are incidental `sendWhatsApp: jest.fn()` mocks or `whatsappNumber` fixtures (guardian/pay/promise/reservation suites) or `channel:'whatsapp'` strings in marketing component tests. No tests exist for: inbound webhooks, signature validation, ORDER parsing, staff auth, dedup, campaign scheduler, opt-out, voice/AI path, tenant isolation, notification triggers.

---

## 13. FIRST-CUSTOMER READINESS MATRIX

| AREA | CURRENT STATE | EVIDENCE | BLOCKER | NEXT ACTION |
|---|---|---|---|---|
| Staff-assisted ordering | Partially working | §2 trace | No kitchen dispatch; fail-open sig; phone-match fragility; no dedup | Dispatch call + fail-closed sig + normalize + dedup |
| Customer ordering | Not implemented | §3 | No inbound handler/state machine | Greenfield or descope |
| AI ordering | Broken | §4 | No sig, invalid Whisper/GPT params, unscoped IDs | Secure + fix params + scope; or disable route |
| Inbound webhook (Twilio) | Working w/ caveats | §5 | Signature bypass | Fail-closed |
| Inbound webhook (Meta) | Log-only stub | §5 | No processing | Implement or descope |
| Outbound messaging | 4 parallel paths, 3 real | §5 | Fragmentation; PDF broken; fake-success wrapper | Consolidate on Cloud→Twilio fallback |
| Order confirmations | Staff TwiML + customer ready-msg | §8 | No dedup/opt-out | Add guards |
| Order status | Only READY states | §8 | No confirmed/preparing/completed/cancelled msgs | Extend triggers |
| Reservations | Confirmation only | §7 | Reminders unscheduled | Add cron entry |
| Campaigns | Stubbed send, no schedule, broken tenant check | §6 | Fake send + cross-tenant send.ts | Real send + tenant check + cron |
| Scheduling | None for campaigns/reservation reminders | §6/§7 | No cron entries | vercel.json or CronService |
| Security | Multiple fail-open paths | §9 | Signature bypasses, no rate limits | Fail-closed + rate-limit + dedup |
| Tenant isolation | OK in staff path; broken in campaign send + voice-order | §9 | campaign send.ts; voice-order scoping | Tenant checks |
| Logging | PII (phones+bodies) logged | §9 | privacy | Reduce to ids/lengths |
| Retries | None anywhere | §5/§6/§8 | — | Queue or retry wrapper |
| Testing | Zero WhatsApp tests | §12 | — | See backlog |

---

## 14. IMPLEMENTATION BACKLOG

### A. CAN BE COMPLETED NOW (no credentials needed)

| Feature | State | Files | Why incomplete | Approach | Complexity |
|---|---|---|---|---|---|
| Kitchen dispatch for WhatsApp orders | missing call | `whatsapp-order.service.ts:263` | dispatchToKitchen never invoked | Call it post-create like `order/confirm.ts:124` | Small |
| Twilio webhook fail-closed | fail-open | `twilio/whatsapp.ts:30` | conditional check | Require token+header or reject | Small |
| Meta webhook fail-closed + timingSafeEqual | fail-open | `webhooks/whatsapp.ts:31`, `cloud.service.ts:137` | conditional check | Same | Small |
| Voice-order signature + businessId scoping + valid Whisper/GPT params | broken | `voice-order.ts` | no sig; `'auto'`; gpt-4 JSON mode; unscoped queries | Add validateRequest; omit language; gpt-4o; scope all lookups to resolved business | Medium |
| MessageSid dedup + inbound `WhatsAppMessage` persistence | absent | webhook + schema | no column | Add `messageSid String? @unique` migration + store/check | Small-Medium |
| Phone normalization for staff match | bug | `whatsapp-order.service.ts:58` | exact string match | Reuse `normalizePhone` | Small |
| Report unmatched items in reply | silent drop | service:212-218 | — | List dropped names in reply | Small |
| Currency include fix | bug | service:259-262 | missing `business` in include | Add include | Small |
| TwiML escaping | bug | webhook:46-49 | unescaped interpolation | Escape XML entities | Small |
| Campaign send: real provider + tenant check + dedup + opt-out | stub/broken | `campaign-scheduler.ts`, `send.ts` | DB-only send; no businessId check | Route via `WhatsAppCloudService.sendText`; check tenant; honor `hasOptedIn`; `lastSentAt` guard | Medium |
| Campaign segment filters | broken | `campaign-scheduler.ts:76-82` | nonexistent Customer fields | Implement segments via `Sale` aggregation | Medium |
| Real opt-out model + fail-closed `hasOptedIn` + STOP handler | broken | `whatsapp.service.ts` | 'system' hack, fails open | Column/model + webhook STOP branch | Medium |
| Campaign + reservation-reminder scheduling | unscheduled | `vercel.json`, `cron.ts` | no trigger | Add cron entries (scheduled campaigns at `startDate`; `/api/cron/reservation-reminders`) | Small |
| Order-status notifications for all states + dedup | partial | kitchen/waiter status endpoints | only READY wired | Hook transition events; dedup key per (order,status) | Medium |
| Split-payment link actually sent | broken | `split-payment-whatsapp.service.ts:154-172` | message built, generic slip sent | Send link via `sendWhatsApp`; honor consent | Small |
| `whatsappOwnerReportsEnabled` honored | dead toggle | `notification.service.ts:104-126` | never read | Gate `sendDailyReport` | Small |
| `sendPaymentConfirmation` — wire or remove | dead | `notification.service.ts:128-157` | never sends, no callers | Send via provider or delete | Small |
| PDF slip media | broken | `notification.service.ts:218-247` | buffer as MediaUrl | Host PDF publicly (Supabase storage) → pass URL | Medium |
| WhatsApp webhook rate limiting | absent | 3 webhook files | — | Apply `withRateLimit` | Small |
| PII log reduction | absent | webhook:40, service:28 | full body logged | Log hash/length | Small |
| Webhook + ordering + campaign tests | absent | tests/ | zero coverage | Jest suites mirroring existing patterns | Medium |
| `.env.example` additions | missing | `.env.example` | 6 vars undocumented | Add placeholder names | Small |
| `WhatsAppBot.tsx` | dead demo | component | fabricated, unreferenced | Delete or wire to real API | Small |

### B. NEEDS PROVIDER CONFIGURATION (code ready/prepared)

| Feature | State | Files | Blocker | Complexity |
|---|---|---|---|---|
| Meta Cloud outbound (sendText/sendTemplate) | code complete | `whatsapp-cloud.service.ts` | `WHATSAPP_CLOUD_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | — |
| Meta webhook verification | code complete | `webhooks/whatsapp.ts` | `WHATSAPP_VERIFY_TOKEN` + `WHATSAPP_APP_SECRET` + Meta app config | — |
| Twilio outbound + inbound webhook | code complete | order service, webhook | `TWILIO_*` + Twilio sandbox/number + webhook URL config | — |
| Meta-approved message templates (out-of-window sends) | `sendTemplate` exists | cloud.service.ts:76 | Template approval in Meta Business Manager | — |
| Voice-order media fetch | code exists | `voice-order.ts` | Twilio media auth + OpenAI key | — |

### C. BLOCKED

| Feature | Why blocked |
|---|---|
| End-to-end live test of inbound→order→kitchen→notify | Requires live Twilio/Meta number + webhook config |
| Meta production sending (non-sandbox) | Requires approved Meta Business app + templates |
| Delivery/read status tracking | Requires webhook subscription config on provider side + `messageSid` storage first |
| WhatsApp customer self-service launch | Requires inbound handler build (A) + provider config (B) |

---

## 15. FINAL REPORT

### 15.1 Architecture map

```
INBOUND
  Meta Cloud  → /api/webhooks/whatsapp        → verify(sig?) → LOG ONLY (stub)
  Twilio      → /api/webhooks/twilio/whatsapp → validateRequest? → WhatsAppOrderService
                                                  → regex ORDER → Sale.create → TwiML reply
  Twilio      → /api/webhooks/twilio/voice-order → (NO SIG) → Whisper→GPT-4 → Sale.create
OUTBOUND (4 parallel paths)
  WhatsAppCloudService.sendText/sendTemplate → Meta Graph API → fallback Twilio
  NotificationService.sendWhatsApp/sendSmartDiningSlip → Twilio REST
  WhatsAppOrderService.sendMessage → Twilio SDK (notifyOrderReady, trending alerts)
  WhatsAppService.sendMessage → generic WHATSAPP_API_URL (fail-open success)
  campaign-scheduler.sendWhatsAppMessage → DB ROW ONLY (fake)
CRON (setInterval, CRON_WORKER host)
  reorder funnel (daily 10:00 Kigali, Cloud send, gated whatsappClientSlipsEnabled)
  trending alerts (Twilio SDK)
  reservation reminders → endpoint exists, never scheduled
STATE
  Sale.orderSource=WHATSAPP; WhatsAppMessage (outbound log only);
  no conversation state, no dedup key, no real opt-out
```

### 15.2 Genuinely working today (with credentials)
- Twilio staff `ORDER` command → Sale created → TwiML confirmation → appears on kitchen list (polling) → `notifyOrderReady` on READY → real sends via Meta Cloud + Twilio REST/SDK + reorder funnel + reservation confirmation + owner order alert.

### 15.3 Partially implemented
- Staff ordering (dispatch/dedup/normalization gaps), Meta webhook (verify yes, process no), order-status notifications (READY only), reservations (confirmation only), settings (one dead toggle), slip PDF, opt-out machinery.

### 15.4 Stubbed
- Campaign send (DB row + fabricated metrics), `sendPaymentConfirmation` (builds text only), Meta inbound processing, `WhatsAppBot.tsx` (dead demo).

### 15.5 Broken
- Voice-order endpoint (no auth, invalid params, unscoped IDs, SSRF), campaign send tenant check + segment filters, split-payment link delivery, opt-out (`system` hack, fails open), PDF MediaUrl path, confirmation currency (RWF always).

### 15.6 Completable without credentials
Everything in backlog §14.A — ~20 items, mostly Small.

### 15.7 Requires provider configuration
Backlog §14.B — Meta token/number/templates, Twilio number + webhook wiring.

### 15.8 Security findings (top)
1. voice-order.ts unauthenticated order creation + SSRF cred leak — CRITICAL
2. Twilio/Meta signature checks fail-open — HIGH
3. Campaign send cross-tenant — HIGH
4. No dedup/rate-limit → duplicate orders — MEDIUM
5. AI output unscoped (wrong-tenant/0-price items) — MEDIUM
6. Opt-out fails open — MEDIUM
7. PII in logs — LOW

### 15.9 Testing gaps
Zero WhatsApp tests. Priority: webhook signature tests, ORDER parser unit tests, dedup, tenant isolation, campaign send, opt-out, status-notification triggers.

### 15.10 Recommended implementation sequence
1. **Security first**: fail-closed signatures (both webhooks), secure or disable voice-order, campaign tenant check, rate limiting.
2. **Correctness**: kitchen dispatch call, phone normalization, MessageSid dedup, unmatched-item reporting, currency include, TwiML escaping.
3. **Truth**: real campaign sends (or remove), fix split-payment link, honor consent/opt-out + `whatsappOwnerReportsEnabled`.
4. **Scheduling**: campaign scheduler + reservation-reminder cron entries.
5. **Schema** (next migration cycle): `WhatsAppMessage.messageSid @unique`, real opt-out store, campaign recipient records, conversation state (if customer ordering is pursued).
6. **Tests**: webhook/parser/tenant/dedup/campaign suites.
7. **Decide**: customer self-service + AI ordering are greenfield features — build only if in the first-customer package; otherwise remove/disable exposed routes.
```
