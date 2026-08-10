# OEC-001C Cache Reliability Assessment

## Area 3: Cache Reliability

---

## 1. Redis Usage

### Cache Service (`src/lib/services/cache.service.ts`)
- **Provider**: Upstash Redis (TLS enabled)
- **Connection**: Custom retry strategy (exponential backoff, max 2s delay, 3 retries)
- **Lazy connect**: Does not crash on startup if Redis unavailable
- **Fallback**: Defaults to `redis://localhost:6379` if REDIS_URL not set

### What is Cached
| Data | TTL | Rationale |
|------|-----|-----------|
| Financial Health (MRR, ARR, GMV, NRR) | 5 min | Executive view, not real-time |
| Revenue Intelligence | 10 min | Composition changes slowly |
| Subscription Intelligence | 5 min | Moderate urgency |
| Operations Intelligence | 2 min | Operational data |
| Financial Priorities | 1 min | Most dynamic |
| CFO Insight Strip | 1 min | Executive summary |
| Phase 1.2D Intelligence | 1 min | Real-time insights |

### What is NOT Cached (correctly)
- Alert states (real-time required)
- Reconciliation exceptions (operational)
- Payment failures (operational)
- Watchdog health status (real-time)

### Additional Cache
- **DIE Plugin Cache**: In-memory `Map` with TTL, namespace-based keys (`src/lib/die/plugins/runtime/cache.ts`)

---

## 2. Cache Invalidation

### TTL-Based Expiry
- All cached data has explicit TTL (1-10 minutes)
- Time-based keys are rounded to nearest minute or 2-minute interval
- Reduces cache key proliferation, improves hit rate

### Explicit Invalidation
- `invalidateDashboardCaches()` method exists (pattern: `cfo:*`)
- **Documented usage**: "Use sparingly - only on critical financial events"
- **Current usage**: ⚠️ Method exists but is not currently invoked (REL-MED-009)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| TTL-based expiry | ✅ | All cached data has TTL |
| Explicit invalidation | ⚠️ | Method exists but unused |
| Key rounding strategy | ✅ | Reduces key proliferation |

---

## 3. Cache Misses

### Behavior on Cache Miss
- `CacheService.get()` returns `null` on cache miss
- `CacheService.get()` returns `null` on Redis unavailability (graceful degradation)
- `getOrCompute()` always falls back to database computation
- Cache write is fire-and-forget (doesn't block response)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Cache miss fallback | ✅ | Always computes from database |
| Redis unavailability fallback | ✅ | Returns null, falls back to DB |
| Cache write failure | ✅ | Fire-and-forget, logged |

---

## 4. Cache Fallback (Redis Down)

### Graceful Degradation
| Operation | Redis Down Behavior |
|-----------|---------------------|
| Cache GET | Returns null (cache miss) |
| Cache SET | Logs error, doesn't throw |
| Cache DEL | Logs error, doesn't throw |
| Cache EXISTS | Returns false |
| getOrCompute | Computes from database |

### Platform Behavior When Redis is Down
- **Does NOT fail** — all cache operations return safe defaults
- **Degrades gracefully** — dashboard load time increases from <1s to full query time
- **No crash** — lazyConnect prevents startup failure

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Graceful degradation | ✅ | Excellent — all operations return safe defaults |
| No startup failure | ✅ | lazyConnect prevents crash |
| Performance impact | ✅ | Acceptable — slower but functional |

---

## 5. TTL Strategy

### TTL Appropriateness
- **1-2 min TTLs**: For dynamic data (financial priorities, operations intelligence) — ensures freshness
- **5 min TTLs**: For moderate data (financial health, subscription intelligence) — balances freshness and load
- **10 min TTLs**: For slow-changing data (revenue intelligence) — reduces database load

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| TTL appropriateness | ✅ | Well-calibrated for use case |
| TTL differentiation | ✅ | Different TTLs per data type |
| No caching of real-time data | ✅ | Correct decision |

---

## 6. Cache Consistency

### Potential Stale Data
- Data can be stale up to TTL duration (1-10 minutes)
- **Acceptable** for executive dashboards (not real-time)
- No cache invalidation on database updates (relies on TTL)

### Cache Stampede Risk
- Multiple concurrent cache misses will all compute from database
- No single-flight or lock mechanism
- **Risk**: Thundering herd on cache expiry (REL-HIGH-005)
- **Impact**: Temporary database load spike

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Stale data risk | ✅ | Acceptable for dashboards |
| Cache stampede protection | ⚠️ | Not implemented (REL-HIGH-005) |
| Write consistency | ✅ | Cache-aside pattern is eventually consistent |

---

## Overall Cache Reliability Score: 8.5/10 — Strong

**Strengths**: Graceful degradation, appropriate TTLs, DB fallback, no real-time data cached  
**Gaps**: No cache stampede protection, explicit invalidation unused
