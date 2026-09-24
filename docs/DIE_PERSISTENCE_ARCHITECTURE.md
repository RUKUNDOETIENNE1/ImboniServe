# DIE Persistence Architecture

**Date:** 2026-06-19  
**Platform Version:** v1.6 Enterprise Persistence Layer  
**Architecture Status:** 📐 **DESIGN COMPLETE**  
**Implementation Status:** ⏳ **PENDING**

---

## Executive Summary

This document defines the persistence architecture for DIE v1.6, transforming the platform from ephemeral to durable enterprise operations. The design maintains backward compatibility, preserves performance, and enables future autonomous capabilities.

### Design Principles

1. **Backward Compatibility** — No breaking changes to existing APIs
2. **Performance First** — Memory-speed reads, async writes
3. **Business Isolation** — Multi-tenant safety at every layer
4. **Graceful Degradation** — System operates if database unavailable
5. **Future-Proof** — Foundation for predictive analytics

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIE v1.6 PERSISTENCE LAYER                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Application  │  │   Governance   │  │  Control Plane │    │
│  │     Layer      │  │     Engine     │  │                │    │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘    │
│           │                   │                    │            │
│           ▼                   ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              REPOSITORY ABSTRACTION LAYER                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │  │
│  │  │   Governance   │  │     Audit      │  │  Snapshot  │ │  │
│  │  │   Repository   │  │   Repository   │  │ Repository │ │  │
│  │  └────────┬───────┘  └────────┬───────┘  └──────┬─────┘ │  │
│  └───────────┼──────────────────┼──────────────────┼───────┘  │
│              │                  │                  │           │
│              ▼                  ▼                  ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  DUAL-STORAGE STRATEGY                   │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐       │  │
│  │  │   MEMORY (Fast)     │  │   DATABASE (Durable) │       │  │
│  │  │  • Current state    │  │  • Historical state  │       │  │
│  │  │  • Hot cache        │  │  • Audit trail       │       │  │
│  │  │  • <1ms reads       │  │  • Snapshots         │       │  │
│  │  └─────────────────────┘  └─────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Source of Truth Strategy

### Truth Hierarchy

```
Level 1: DATABASE (Prisma PostgreSQL)
├─ Governance state (current + historical)
├─ Audit trail (immutable log)
├─ Control plane snapshots (time-series)
└─ Alert history (compliance)

Level 2: MEMORY CACHE (globalThis)
├─ Current governance state (hot)
├─ Recent audit events (last 100)
└─ Latest snapshot (5min TTL)

Level 3: COMPUTED (On-Demand)
├─ Health scores
├─ Ecosystem metrics
└─ Trend analysis
```

### Source of Truth Rules

| Data Type | Source of Truth | Cache | Computed |
|-----------|----------------|-------|----------|
| **Current Plugin State** | Database | Memory | No |
| **Historical State** | Database | No | No |
| **Audit Events** | Database | Memory (recent) | No |
| **Snapshots** | Database | Memory (latest) | No |
| **Health Scores** | No | No | Yes (from state) |
| **Trend Analysis** | No | No | Yes (from snapshots) |

**Critical Rule:** Database is always the source of truth. Memory is a performance cache.

---

## 2. Repository Pattern

### Interface-Based Design

```typescript
// Core abstraction
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>
  findAll(filter?: Filter): Promise<T[]>
  create(data: CreateData<T>): Promise<T>
  update(id: ID, data: UpdateData<T>): Promise<T>
  delete(id: ID): Promise<void>
}

// Governance-specific
interface GovernanceRepository extends Repository<GovernancePluginState, string> {
  findByPlugin(pluginId: string, businessId: string | null): Promise<GovernancePluginState | null>
  findByBusiness(businessId: string): Promise<GovernancePluginState[]>
  upsertState(pluginId: string, businessId: string | null, state: GovernanceLifecycleState): Promise<GovernancePluginState>
}

// Audit-specific
interface AuditRepository {
  append(event: AuditEventInput): Promise<AuditEvent>
  findByPlugin(pluginId: string, businessId: string | null, limit?: number): Promise<AuditEvent[]>
  findByBusiness(businessId: string, limit?: number): Promise<AuditEvent[]>
  findRecent(limit: number): Promise<AuditEvent[]>
}

// Snapshot-specific
interface SnapshotRepository {
  create(snapshot: SnapshotInput): Promise<Snapshot>
  findLatest(): Promise<Snapshot | null>
  findByDateRange(start: Date, end: Date): Promise<Snapshot[]>
  findRecent(limit: number): Promise<Snapshot[]>
}
```

### Implementation Strategy

```
Repository Interface (contracts)
  ↓
├─ MemoryRepository (v1.5 compatibility)
│  └─ Uses globalThis storage
│
└─ DatabaseRepository (v1.6 new)
   └─ Uses Prisma client
```

**Key Benefit:** Swap implementations without changing business logic.

---

## 3. Data Flow Model

### Write Path (Dual-Write Pattern)

```
┌─────────────────────────────────────────────────────────┐
│                    WRITE PATH                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Plugin Lifecycle Event (install/enable/disable)        │
│    ↓                                                     │
│  Governance Engine                                       │
│    ├─ Validate event                                    │
│    ├─ Detect anomalies                                  │
│    └─ Record event                                      │
│         ↓                                                │
│  Repository Layer                                        │
│    ├─ Write to MEMORY (sync, <1ms)                      │
│    │   └─ Update in-memory state                        │
│    │                                                     │
│    └─ Write to DATABASE (async, fire-and-forget)        │
│        ├─ Upsert governance state                       │
│        ├─ Append audit event                            │
│        └─ Handle errors gracefully                      │
│                                                          │
│  ✅ Event processing complete                           │
│  ⚠️  Database write may still be in progress            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Performance Guarantee:**
- Synchronous memory write: <1ms
- Async database write: non-blocking
- Total event processing: <5ms

**Error Handling:**
- Memory write failure: CRITICAL (throw error)
- Database write failure: LOG (continue operation)
- Retry logic: 3 attempts with exponential backoff

---

### Read Path (Cache-First Pattern)

```
┌─────────────────────────────────────────────────────────┐
│                     READ PATH                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Control Plane Query (get current state)                │
│    ↓                                                     │
│  Repository Layer                                        │
│    ├─ Check MEMORY cache                                │
│    │   ├─ HIT → return immediately (<1ms)               │
│    │   └─ MISS → fallback to database                   │
│    │                                                     │
│    └─ Query DATABASE (if cache miss)                    │
│        ├─ Fetch from Prisma (<50ms)                     │
│        ├─ Populate memory cache                         │
│        └─ Return result                                 │
│                                                          │
│  ✅ Query complete                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Performance Guarantee:**
- Cache hit: <1ms (99% of reads)
- Cache miss: <50ms (1% of reads)
- Average read latency: <2ms

**Cache Strategy:**
- Current state: Always cached
- Recent audit events: Last 100 cached
- Snapshots: Latest cached (5min TTL)
- Historical data: Never cached (query on-demand)

---

### Historical Query Path (Database-Only)

```
┌─────────────────────────────────────────────────────────┐
│                  HISTORICAL QUERY PATH                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Dashboard Query (get 30-day trend)                     │
│    ↓                                                     │
│  Repository Layer                                        │
│    └─ Query DATABASE directly                           │
│        ├─ Date range filter                             │
│        ├─ Business scope filter                         │
│        ├─ Pagination (limit/offset)                     │
│        └─ Return results (<200ms)                       │
│                                                          │
│  ✅ Historical data returned                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Performance Guarantee:**
- 30-day query: <200ms
- 90-day query: <500ms
- 1-year query: <1s

**Optimization:**
- Indexed by timestamp
- Indexed by businessId
- Composite indexes for common queries

---

## 4. Consistency Model

### Eventual Consistency Guarantees

```
┌─────────────────────────────────────────────────────────┐
│                 CONSISTENCY MODEL                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  T=0: Event occurs                                      │
│    ↓                                                     │
│  T+1ms: Memory updated (CONSISTENT)                     │
│    ↓                                                     │
│  T+5ms: Database write initiated                        │
│    ↓                                                     │
│  T+50ms: Database write complete (EVENTUALLY CONSISTENT)│
│                                                          │
│  Consistency Window: ~50ms                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Consistency Rules

| Operation | Memory | Database | Consistency |
|-----------|--------|----------|-------------|
| **Write** | Immediate | Async | Eventual (50ms) |
| **Read (current)** | Immediate | Fallback | Strong |
| **Read (historical)** | N/A | Immediate | Strong |
| **Startup** | Load from DB | Source of truth | Strong |

### Conflict Resolution

**Scenario:** Memory and database diverge due to write failure

**Resolution Strategy:**
1. On startup: Load from database (source of truth)
2. During operation: Memory is authoritative
3. On write failure: Log error, retry 3x
4. On persistent failure: Alert operator

**Reconciliation:**
- Periodic sync job (every 5 minutes)
- Compare memory vs database
- Log discrepancies
- Alert if divergence detected

---

## 5. Cache Strategy

### Cache Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE HIERARCHY                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  L1: IN-MEMORY (Hot Data)                               │
│  ├─ Current governance state (all plugins)              │
│  ├─ Recent audit events (last 100)                      │
│  ├─ Latest snapshot (5min TTL)                          │
│  └─ Size: ~1 MB                                         │
│                                                          │
│  L2: DATABASE (Warm Data)                               │
│  ├─ Historical governance state (30 days)               │
│  ├─ Audit trail (90 days)                               │
│  ├─ Snapshots (30 days)                                 │
│  └─ Size: ~25 MB/month                                  │
│                                                          │
│  L3: ARCHIVE (Cold Data)                                │
│  ├─ Audit trail (>90 days)                              │
│  ├─ Snapshots (>30 days)                                │
│  └─ Size: ~200 MB/year                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation Rules

| Event | Invalidate | Reason |
|-------|------------|--------|
| **Plugin state change** | Current state cache | Stale data |
| **Audit event** | Recent events cache | New event added |
| **Snapshot generated** | Latest snapshot cache | New snapshot |
| **Server restart** | All caches | Fresh start |
| **Manual flush** | All caches | Admin action |

### Cache Warming Strategy

**On Startup:**
1. Load all current governance states from database
2. Populate memory cache
3. Load last 100 audit events
4. Load latest snapshot
5. **Total time:** <500ms

**During Operation:**
- Cache populated on-demand
- No pre-warming required
- Natural cache warmth from queries

---

## 6. Failure Recovery Strategy

### Failure Scenarios

#### Scenario 1: Database Unavailable

**Detection:**
- Database connection timeout
- Prisma client error

**Response:**
1. Log critical error
2. Continue operating with memory-only mode
3. Queue writes for retry
4. Alert operator

**Recovery:**
1. Database comes back online
2. Flush queued writes
3. Reconcile memory vs database
4. Resume normal operation

**Impact:**
- ✅ System continues operating
- ⚠️ New data not persisted
- ⚠️ Historical queries fail

---

#### Scenario 2: Memory Corruption

**Detection:**
- Invalid state detected
- Consistency check failure

**Response:**
1. Log critical error
2. Reload from database
3. Rebuild memory cache
4. Resume operation

**Recovery:**
- Automatic (self-healing)
- Downtime: <1 second

**Impact:**
- ⚠️ Brief service interruption
- ✅ Data integrity maintained

---

#### Scenario 3: Write Failure

**Detection:**
- Database write error
- Retry exhausted

**Response:**
1. Log error with full context
2. Continue operation (memory updated)
3. Alert operator
4. Manual reconciliation required

**Recovery:**
- Manual intervention
- Reconciliation script

**Impact:**
- ✅ System continues operating
- ⚠️ Data loss for failed write
- ⚠️ Manual fix required

---

#### Scenario 4: Server Restart

**Detection:**
- Process termination

**Response:**
1. Graceful shutdown (flush pending writes)
2. On startup: Load from database
3. Rebuild memory cache
4. Resume operation

**Recovery:**
- Automatic
- Downtime: Normal restart time

**Impact:**
- ✅ No data loss
- ✅ Full state recovery

---

## 7. Multi-Tenant Safety

### Business Isolation Architecture

```
┌─────────────────────────────────────────────────────────┐
│              MULTI-TENANT ISOLATION                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Request (with businessId)                              │
│    ↓                                                     │
│  Authentication Layer                                    │
│    ├─ Validate session                                  │
│    └─ Extract businessId                                │
│         ↓                                                │
│  Repository Layer                                        │
│    ├─ Inject businessId into query                      │
│    ├─ Filter by businessId (WHERE clause)               │
│    └─ Validate no cross-business access                 │
│         ↓                                                │
│  Database Layer                                          │
│    ├─ Row-level security (future)                       │
│    └─ Composite indexes (businessId + ...)              │
│                                                          │
│  ✅ Business isolation enforced                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Isolation Guarantees

| Layer | Mechanism | Enforcement |
|-------|-----------|-------------|
| **API** | `resolveBusinessContext()` | Mandatory |
| **Repository** | `businessId` parameter | Mandatory |
| **Database** | `WHERE businessId = ?` | Automatic |
| **Cache** | Keyed by `businessId` | Automatic |
| **Queries** | Scoped by `businessId` | Mandatory |

### Global vs Business-Scoped Data

```typescript
// Global plugin state (businessId = null)
{
  pluginId: 'qr-menu',
  businessId: null,  // ← Global scope
  lifecycleState: 'ENABLED'
}

// Business-scoped plugin state
{
  pluginId: 'qr-menu',
  businessId: 'biz_123',  // ← Business scope
  lifecycleState: 'ENABLED'
}
```

**Rule:** Global and business-scoped states are separate entities.

---

## 8. Data Ownership Model

### Ownership Rules

| Data Type | Owner | Scope | Lifecycle |
|-----------|-------|-------|-----------|
| **Plugin State** | Governance Engine | Global or Business | Mutable |
| **Audit Events** | Governance Engine | Global or Business | Immutable |
| **Snapshots** | Control Plane | System-wide | Immutable |
| **Alerts** | Alert Service | System-wide | Immutable |

### Write Permissions

| Component | Can Write | Can Read | Can Delete |
|-----------|-----------|----------|------------|
| **Governance Engine** | State, Audit | All | State only |
| **Control Plane** | Snapshots | All | Snapshots only |
| **Alert Service** | Alerts | All | Alerts only |
| **Dashboard** | None | All (scoped) | None |
| **API** | None | All (scoped) | None |

**Critical Rule:** Only owning component can write. All can read (with scoping).

---

## 9. Synchronization Strategy

### Startup Synchronization

```
Server Startup
  ↓
1. Connect to database
  ↓
2. Load current governance states
   └─ Query: SELECT * FROM PluginGovernanceState
  ↓
3. Populate memory cache
   └─ Map<string, GovernancePluginState>
  ↓
4. Load recent audit events (last 100)
   └─ Query: SELECT * FROM PluginAuditEvent ORDER BY timestamp DESC LIMIT 100
  ↓
5. Load latest snapshot
   └─ Query: SELECT * FROM ControlPlaneSnapshot ORDER BY generatedAt DESC LIMIT 1
  ↓
6. Mark system as ready
  ↓
✅ System operational
```

**Performance:** <500ms for typical dataset

---

### Runtime Synchronization

```
Every 5 minutes:
  ↓
1. Generate control plane snapshot
  ↓
2. Persist to database
  ↓
3. Update memory cache
  ↓
✅ Snapshot synchronized
```

**Performance:** <100ms (async, non-blocking)

---

### Reconciliation Strategy

```
Every 1 hour:
  ↓
1. Compare memory vs database
  ↓
2. Identify discrepancies
  ↓
3. Log differences
  ↓
4. Alert if critical divergence
  ↓
✅ Reconciliation complete
```

**Discrepancy Handling:**
- Minor differences (<5%): Log only
- Major differences (>5%): Alert operator
- Critical differences (>20%): Auto-reload from database

---

## 10. Performance Targets

### Write Performance

| Operation | Target | Actual (Expected) |
|-----------|--------|-------------------|
| **Memory write** | <1ms | <1ms |
| **Database write (async)** | Non-blocking | <50ms |
| **Dual write (total)** | <5ms | <2ms |

### Read Performance

| Operation | Target | Actual (Expected) |
|-----------|--------|-------------------|
| **Cache hit** | <1ms | <1ms |
| **Cache miss** | <50ms | <20ms |
| **Historical query (30d)** | <200ms | <100ms |
| **Historical query (90d)** | <500ms | <300ms |

### Startup Performance

| Operation | Target | Actual (Expected) |
|-----------|--------|-------------------|
| **Load states** | <200ms | <100ms |
| **Load audit events** | <100ms | <50ms |
| **Load snapshot** | <50ms | <20ms |
| **Total startup** | <500ms | <200ms |

---

## 11. Scalability Considerations

### Horizontal Scaling

**Challenge:** Multiple instances with separate memory caches

**Solution:**
- Database is source of truth
- Memory cache is instance-local
- Eventual consistency across instances
- Acceptable for governance use case

**Trade-off:**
- Slight delay in cross-instance visibility (<5 minutes)
- Acceptable for non-real-time governance

---

### Vertical Scaling

**Memory Growth:**
- Current state: ~1 MB (bounded)
- Recent events: ~100 KB (bounded)
- Snapshot cache: ~2 KB (bounded)
- **Total:** <2 MB (negligible)

**Database Growth:**
- ~25 MB/month (typical)
- ~200 MB/year (typical)
- Archival strategy at 1 year

**Conclusion:** Vertical scaling not a concern.

---

## 12. Future Enhancements

### Phase 1 (v1.6): Foundation
- ✅ Dual-write pattern
- ✅ Repository abstraction
- ✅ Basic persistence
- ✅ Startup recovery

### Phase 2 (v1.7): Optimization
- Redis cache layer
- Write-ahead logging
- Batch writes
- Query optimization

### Phase 3 (v2.0): Intelligence
- Time-series analytics
- Trend detection
- Predictive models
- Anomaly forecasting

### Phase 4 (v2.5): Autonomy
- Self-healing
- Auto-optimization
- Capacity planning
- Autonomous decisions

---

## Conclusion

This architecture provides:

✅ **Durability** — No data loss on restart  
✅ **Performance** — Memory-speed reads, async writes  
✅ **Scalability** — Horizontal and vertical scaling  
✅ **Safety** — Business isolation, graceful degradation  
✅ **Future-Proof** — Foundation for autonomous operations

**Next Step:** Phase 3 — Prisma Model Design

---

**Architecture Designed:** 2026-06-19  
**Architect:** Cascade AI  
**Status:** 📐 DESIGN COMPLETE  
**Version:** v1.6 Enterprise Persistence Layer
