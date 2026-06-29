# DIE Governance Repository Design

**Date:** 2026-06-19  
**Phase:** v1.5 Enterprise Operations Layer — Phase 5  
**Status:** ✅ **INTERFACE COMPLETE**

---

## Executive Summary

The Governance Repository abstraction prepares DIE for future persistence without introducing schema changes in v1.5. The interface-based design allows swapping storage backends without changing governance logic.

### v1.5 Status

✅ **Repository interface defined**  
✅ **Memory implementation complete**  
✅ **Preserves existing behavior**  
⏳ **Database persistence** (v2.0)  
⏳ **Redis caching** (v2.0)

---

## Architecture

### Repository Interface

```typescript
interface GovernanceRepository {
  // State Management
  getState(pluginId: string, businessId: string | null): Promise<GovernancePluginState | null>
  setState(pluginId: string, businessId: string | null, lifecycleState: GovernanceLifecycleState): Promise<GovernancePluginState>
  getAllStatesForPlugin(pluginId: string): Promise<GovernancePluginState[]>
  getAllStatesForBusiness(businessId: string): Promise<GovernancePluginState[]>
  getAllGlobalStates(): Promise<GovernancePluginState[]>
  getAllStates(): Promise<GovernancePluginState[]>

  // Audit Trail Management
  appendAuditEvent(event: Omit<GovernanceAuditEvent, 'id' | 'timestamp'>): Promise<GovernanceAuditEvent>
  getAuditTrailForPlugin(pluginId: string, businessId: string | null): Promise<GovernanceAuditEvent[]>
  getRecentAuditEvents(limit: number): Promise<GovernanceAuditEvent[]>
  getAuditTrailForBusiness(businessId: string): Promise<GovernanceAuditEvent[]>

  // Cleanup
  clearAll(): Promise<void>
}
```

---

## Implementations

### Memory Repository (v1.5)

**Status:** ✅ ACTIVE  
**Storage:** `globalThis.__dieGovernance`  
**Persistence:** Ephemeral (session-based)  
**Performance:** Instant (in-memory)

**Characteristics:**
- Zero latency
- No external dependencies
- State lost on restart
- Suitable for development and single-instance deployments

### Prisma Repository (v2.0)

**Status:** ⏳ PLANNED  
**Storage:** PostgreSQL via Prisma  
**Persistence:** Durable  
**Performance:** ~10-50ms per query

**Schema (Future):**
```prisma
model PluginGovernanceState {
  id                String   @id @default(cuid())
  pluginId          String
  businessId        String?
  lifecycleState    String
  installCount      Int      @default(0)
  enableCount       Int      @default(0)
  disableCount      Int      @default(0)
  firstInstalledAt  DateTime?
  lastInstalledAt   DateTime?
  lastEnabledAt     DateTime?
  lastDisabledAt    DateTime?
  lastStateChangeAt DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([pluginId, businessId])
  @@index([pluginId])
  @@index([businessId])
}

model PluginAuditEvent {
  id         String   @id @default(cuid())
  pluginId   String
  businessId String?
  eventType  String
  metadata   Json?
  timestamp  DateTime @default(now())

  @@index([pluginId, timestamp])
  @@index([businessId, timestamp])
  @@index([eventType, timestamp])
}
```

### Redis Repository (v2.0)

**Status:** ⏳ PLANNED  
**Storage:** Redis  
**Persistence:** Configurable (RDB/AOF)  
**Performance:** ~1-5ms per query

**Use Case:**
- High-performance caching
- Horizontal scaling
- Session-based state with persistence
- Write-through cache for Prisma

---

## Migration Path

### Phase 1 (v1.5 - Current)
- ✅ Memory repository active
- ✅ Interface defined
- ✅ No schema changes

### Phase 2 (v2.0 - Q3 2026)
- Add Prisma models
- Implement PrismaGovernanceRepository
- Add migration script (memory → database)
- Enable database persistence

### Phase 3 (v2.5 - Q4 2026)
- Implement RedisGovernanceRepository
- Add write-through caching
- Hybrid mode (Redis + Prisma)

---

## File Structure

```
src/lib/die/governance/repositories/
├── governance-repository.interface.ts  # Repository contract
├── memory-governance-repository.ts     # ✅ v1.5 default
├── prisma-governance-repository.ts     # ⏳ v2.0 (future)
└── redis-governance-repository.ts      # ⏳ v2.5 (future)
```

---

## Benefits

### Separation of Concerns
- Governance logic independent of storage
- Easy to test (mock repository)
- Swap backends without code changes

### Future-Proof
- Database persistence ready
- Caching layer ready
- No refactoring required

### Backward Compatible
- Existing behavior preserved
- No breaking changes
- Gradual migration path

---

## Conclusion

The Governance Repository abstraction is architectural preparation only. v1.5 uses in-memory storage. v2.0 will add database persistence without changing governance logic.

---

**Design Completed:** 2026-06-19  
**Designer:** Cascade AI  
**Status:** ✅ INTERFACE COMPLETE  
**Version:** v1.5 Phase 5
