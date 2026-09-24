# OEC-001C Production Resilience Assessment

## Area 9: Production Resilience

---

## 1. Temporary Service Interruptions

### Redis Interruption
- **Cache**: Graceful degradation — returns null, falls back to database
- **Rate limiting**: Falls back to in-memory
- **Queues**: Workers fail to connect, jobs remain in Redis until recovery
- **Health check**: Queue health returns unhealthy
- **Watchdog**: Queue watchdog detects and alerts

### Database Interruption
- **Health check**: /api/health/ready returns 503
- **API routes**: Fail with database errors (caught by error middleware)
- **Workers**: Fail to process jobs (caught by BullMQ retry)
- **Recovery**: Prisma handles reconnection internally

### Payment Provider Interruption
- **Behavior**: Returns error response, doesn't block core operations
- **Watchdog**: PaymentWatchdog monitors failure rates
- **Timeout**: ✅ 30s/15s (OEC-001C fix) — no more hung requests
- **Alerting**: Alerts sent when failure rate exceeds threshold

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Redis interruption | ✅ | Graceful degradation |
| DB interruption | ✅ | Health check + error middleware |
| Payment interruption | ✅ | Error response + watchdog + timeout |
| Alerting | ✅ | Watchdog services |

---

## 2. Slow External APIs

### Payment Providers (After OEC-001C)
- **InTouch**: 30s timeout — hung requests now abort with TIMEOUT error code
- **IremboPay**: 30s initiation / 15s verification — hung requests now abort
- **Behavior**: Returns structured error response, customer can retry

### Azure DI
- **Timeout**: Configurable AbortController-based timeout
- **Retry**: Exponential backoff with Retry-After header
- **Fallback**: ProviderRouter can fallback to OpenAI

### Email/SMS
- **Timeout**: ❌ No explicit timeout (uses SDK defaults)
- **Behavior**: Best-effort — failure logged, operation continues

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Payment provider slow API | ✅ | Fixed in OEC-001C |
| Azure DI slow API | ✅ | Timeout + retry + fallback |
| Email/SMS slow API | ⚠️ | No explicit timeout |
| AI (OpenAI) slow API | ⚠️ | No explicit timeout |

---

## 3. High Request Bursts

### Rate Limiting
- **Redis-based**: Distributed rate limiting with in-memory fallback
- **Default**: 100 requests per minute
- **Public endpoints**: 60/min (menu), 20/min (order confirm), 30/min (waiter calls)
- **Fail-open**: On Redis error, allows request through

### Caching
- **Cache-aside pattern**: getOrCompute with database fallback
- **TTL strategy**: 1-10 minutes depending on data type
- **Key rounding**: Reduces cache key proliferation

### Queue Concurrency
- **Extract**: 5 concurrent, 10/sec rate limit
- **Intelligence**: 3 concurrent, 5/sec rate limit

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Rate limiting | ✅ | Redis-based with fallback |
| Caching | ✅ | Reduces database load |
| Queue concurrency | ✅ | Configured per queue |
| Load balancer/auto-scaling | ⚠️ | Infrastructure-level (not in codebase) |

---

## 4. Partial Subsystem Failures

### Redis Down (DB Up)
- Cache: Falls back to database (slower but functional)
- Rate limiting: Falls back to in-memory
- Queues: Workers fail, jobs preserved in Redis
- Health: Queue health returns unhealthy

### DB Down (Redis Up)
- Health: /api/health/ready returns 503
- API: Fails with database errors
- Cache: Still serves cached data (stale but available)
- Recovery: Prisma reconnects automatically

### Payment Provider Down
- API: Returns error response
- Watchdog: Monitors and alerts on failure rate
- Timeout: 30s/15s prevents hung requests
- No fallback provider (REL-LOW-005)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Redis down resilience | ✅ | Graceful degradation |
| DB down resilience | ✅ | Health check + error handling |
| Payment down resilience | ✅ | Error response + watchdog + timeout |
| Fallback providers | ❌ | Not implemented (REL-LOW-005) |

---

## 5. Network Instability

### Client-Side
- **Network detection**: `src/lib/networkDetection.ts` — Browser Network Information API
- **Detection levels**: offline, slow, good, excellent
- **Lite mode**: Activated for slow connections
- **Offline support**: Service Worker with online/offline event listeners
- **Outbox pattern**: Queues operations when offline, syncs when restored
  - IndexedDB persistence
  - Batch sync (max 100 items)
  - Retry logic with exponential backoff

### Server-Side
- **No explicit network partition handling** (REL-LOW-011)
- Relies on fetch timeouts (payment providers) and error middleware
- Prisma handles reconnection internally

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Client-side network detection | ✅ | Excellent — Network Information API |
| Offline support | ✅ | Outbox pattern with IndexedDB |
| Server-side network handling | ⚠️ | Relies on timeouts and error middleware |

---

## Overall Production Resilience Score: 7.0/10 — Good

**Strengths**: Graceful degradation, rate limiting, caching, offline support, payment timeouts (OEC-001C fix)  
**Gaps**: No fallback payment provider, email/SMS lack timeouts, no server-side network partition handling
