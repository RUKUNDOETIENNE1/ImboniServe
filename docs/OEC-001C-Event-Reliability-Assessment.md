# OEC-001C Event Reliability Assessment

## Area 4: Event Reliability

---

## 1. Event Publication

### Event Systems
The platform implements multiple independent event systems:

| System | Pattern | Location |
|--------|---------|----------|
| PluginEventBus | In-memory EventEmitter | `src/lib/die/plugins/runtime/event-bus.ts` |
| PartnershipEvent | Database append-only | `src/lib/services/partnership-event.service.ts` |
| RevenueEvent | Database append-only | `src/lib/services/revenue-event.service.ts` |
| TicketEvent | Database append-only with sequencing | `src/lib/services/ticket-event.service.ts` |
| Webhooks | HTTP callbacks | `src/pages/api/webhooks/*` |
| Real-time | Pusher pub/sub | `src/lib/realtime.ts` |

### Event Types
- **PluginEventBus**: 8 types (DOCUMENT_UPLOADED, OCR_COMPLETED, EXTRACTION_COMPLETED, etc.)
- **PartnershipEvent**: 37 types (PARTNER_CREATED, AGREEMENT_SIGNED, COMMISSION_ACCRUED, etc.)
- **RevenueEvent**: 14 types (MARKETER_CREATED, ATTRIBUTION_RECORDED, etc.)
- **TicketEvent**: 19 types (ORDER_CREATED, ITEM_ROUTED, SLA_BREACH, etc.)

---

## 2. Event Delivery Guarantees

| System | Guarantee | Idempotency | Retry | DLQ |
|--------|-----------|-------------|-------|-----|
| PluginEventBus | At-most-once | None | None | No |
| PartnershipEvent | At-least-once | None | None | No |
| RevenueEvent | At-least-once | None | None | No |
| TicketEvent | At-least-once | ✅ Strong | None | No |
| Webhooks | At-least-once | ✅ Strong | Provider | No |
| BullMQ Workers | At-least-once | ✅ Job dedup | ✅ 3x | ✅ |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| PluginEventBus delivery | ⚠️ | At-most-once, no persistence |
| Database event delivery | ✅ | At-least-once, append-only |
| TicketEvent idempotency | ✅ | Unique constraint on idempotencyKey |
| Webhook idempotency | ✅ | webhookVerified flag + status check |
| BullMQ delivery | ✅ | At-least-once with DLQ |

---

## 3. Event Ordering

| System | Ordering Mechanism |
|--------|-------------------|
| TicketEvent | ✅ Strong — sequenceNumber per saleItem |
| PartnershipEvent | Weak — timestamp only |
| RevenueEvent | Weak — timestamp only |
| PluginEventBus | None — EventEmitter registration order |
| BullMQ | FIFO per queue |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| TicketEvent ordering | ✅ | Sequence numbers |
| Other event ordering | ⚠️ | Timestamp-based only |

---

## 4. Event Failure Handling

### PluginEventBus
- Handler errors are caught and logged
- Other handlers continue executing
- No retry, no DLQ
- Events silently dropped if no subscribers

### Database Event Logs
- Write failures are logged but do not fail the operation
- No retry on write failure
- No alerting on event write failure

### BullMQ Workers
- 3 retry attempts with exponential backoff
- Failed jobs sent to DLQ
- Alert sent on permanent failure

### Webhooks
- Returns 200 for unknown/already-processed transactions
- HMAC signature validation
- Duplicate detection via webhookVerified flag

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| PluginEventBus failure handling | ⚠️ | Fire-and-forget, no retry |
| Database event failure handling | ⚠️ | Logged but not retried |
| BullMQ failure handling | ✅ | Retry + DLQ + alerting |
| Webhook failure handling | ✅ | Idempotent + signature validation |

---

## 5. Missing Subscribers

### PluginEventBus
- Events are silently dropped if no subscribers exist (`if (listeners.length === 0) return`)
- No logging of missing subscribers
- **Finding**: The `subscribe()` method exists but is never called — plugins are triggered via `runPlugins()` instead

### Database Event Logs
- Not applicable — events are stored for later query, not pushed to subscribers

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| PluginEventBus missing subscribers | ⚠️ | Silently dropped (REL-LOW-006) |
| Database events | ✅ | N/A — query-based consumption |

---

## 6. Event Store / Audit Log

### Event Stores
| Store | Purpose | Append-Only | Indexed |
|-------|---------|-------------|---------|
| PartnershipEvent | Partnership audit trail | ✅ | type+createdAt, entityType+entityId |
| RevenueEvent | Revenue audit trail | ✅ | type+createdAt, entityType+entityId |
| TicketEvent | Kitchen event log | ✅ | saleId+createdAt, saleItemId+sequence |
| AuditLog | Security audit log | ✅ | createdAt, action |
| PluginAuditEvent | Plugin lifecycle audit | ✅ | — |
| ReplayEvent | Service Replay storage | ✅ | businessId+timestamp, eventType+timestamp |
| FinancialLedgerEntry | Financial ledger | ✅ | idempotencyKey (unique) |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Event stores | ✅ | 7 append-only event stores |
| Indexing | ✅ | Well-indexed for querying |
| Event versioning | ❌ | No schema evolution strategy (REL-LOW-008) |
| Correlation IDs | ❌ | Field exists but never populated (REL-LOW-007) |

---

## Overall Event Reliability Score: 6.5/10 — Moderate

**Strengths**: TicketEvent strong idempotency and ordering, webhook idempotency, BullMQ DLQ, 7 event stores  
**Gaps**: PluginEventBus no persistence/idempotency, PartnershipEvent no idempotency, no event correlation IDs, no event versioning
