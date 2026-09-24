# DIE Unified System Intelligence Architecture v1.0

## Purpose
Provide a single coherent operational intelligence surface by aggregating Governance, Control Plane, Intelligence Core, Marketplace Intelligence, Historical Trends, and Persistence Metrics.

## Principles
- Read-only, observation-only
- No autonomous actions, no self-healing
- No runtime or marketplace rewrites
- No schema changes required
- Preserve performance guarantees and business isolation

## Components

### Unified Intelligence Service
- File: `src/lib/die/unified-intelligence/unified-intelligence.service.ts`
- Aggregates:
  - Intelligence Core snapshot (platform health, control-plane data)
  - Marketplace Intelligence (adoption, usage, stability)
  - Trend Analyzer (health, governance, anomalies)
  - Persistence metrics (recent control-plane snapshots)
- Produces:
  - Unified feed (timestamped observations with severity + source)
  - Executive intelligence snapshot (consolidated scores)
  - Cross-domain correlation layer

### Types & Data Model
- File: `src/lib/die/unified-intelligence/types.ts`
- UnifiedFeedItem: { id, timestamp, source, severity, code, message, data }
- ExecutiveIntelligenceSnapshot: platform/governance/marketplace/ecosystem health + overall risk
- CrossDomainCorrelationLayer: governance↔marketplace, marketplace↔control-plane, trends↔anomalies, adoption↔stability
- PersistenceMetricsSummary: last snapshot age and count

### API Endpoint (Read-Only)
- `GET /api/die/intelligence/unified` — returns { feed, executive, correlations, persistence }

## Data Flow
```
Intelligence Core ─┐
Marketplace Intel ─┼──▶ Unified Intelligence Service ─▶ Unified Feed + Executive Snapshot + Correlations
Trend Analyzer  ───┤
Control Plane Repo ─┘
```

## Performance
- Uses cached Intelligence Core snapshot (5 min TTL)
- Marketplace Intelligence computed in-memory over cached states/events
- Trend analyzer limited to recent snapshots (default limit=10)
- End-to-end target: <200ms typical

## Security & Isolation
- No cross-business mixing
- Read-only aggregation from existing services
- No persistence writes performed by this layer

## Future Dashboard Readiness
- Unified payload designed for direct dashboard consumption
- Clear severity and source attribution for filtering and alert surfaces
- Executive snapshot provides single top-level health view
