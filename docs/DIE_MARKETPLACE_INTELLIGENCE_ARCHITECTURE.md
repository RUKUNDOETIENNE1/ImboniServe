# DIE Marketplace Intelligence Architecture v1.0

## Purpose
Transform Marketplace from a static plugin catalog into a **plugin intelligence catalog** — delivering adoption, usage, and stability insights without altering runtime behavior.

## Design Principles
- Read-only intelligence (no mutations)
- No runtime or marketplace rewrites
- No URL changes to existing routes
- Preserve business isolation and performance guarantees

## Components

### 1) Marketplace Intelligence Service
- File: `src/lib/die/marketplace/intelligence/marketplace-intelligence.service.ts`
- Computes per-plugin intelligence across three pillars:
  - Adoption: adoptionScore, installToEnableRatio, businessAdoptionCount, activationRate
  - Usage: usageFrequency, lastUsedAt, trendDirection, activityScore
  - Stability: anomalyRate, churnScore, stabilityScore, governanceRiskScore
- Sources:
  - Governance Engine (states + recent audit events)
  - Marketplace registry (plugin metadata)

### 2) Types
- File: `src/lib/die/marketplace/intelligence/types.ts`
- Defines structured outputs for adoption, usage, stability, and rankings

### 3) Rankings
- Derived from full marketplace intelligence
- Lists:
  - Most adopted, fastest growing, most stable, highest risk

### 4) API Endpoints (Read-Only)
- `GET /api/die/marketplace/intelligence/overview` — Full intelligence for all plugins
- `GET /api/die/marketplace/intelligence/rankings` — Intelligence-based rankings
- `GET /api/die/marketplace/intelligence/plugin?pluginId=...` — Per-plugin intelligence

## Data Flow
```
Governance Engine (states + audit) ──▶ Intelligence Service ──▶ APIs (read-only)
Marketplace Registry (metadata) ─────▶
```

## Performance
- In-memory aggregation over existing caches
- No synchronous database dependencies
- O(plugins + events) per request; small and bounded by recent events cap

## Security & Isolation
- No cross-business data leakage
- Reads existing governance states (businessId-aware)
- Read-only: does not persist any new data

## Future Enhancements (Post-Phase 6)
- Persist sampled usage metrics (optional) for longitudinal marketplace trends
- Add multi-tenant slicing in intelligence endpoints
- Weight usage scoring by business size or tier
- Add time-series adoption growth computation per plugin
