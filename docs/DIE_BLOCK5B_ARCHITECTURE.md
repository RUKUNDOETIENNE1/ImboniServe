# DIE Block 5B — Intelligence & Analytics Layer Architecture

**Version:** 1.0  
**Date:** 2026-06-18  
**Status:** Production Ready

---

## Overview

Block 5B transforms processed DIE documents into actionable operational intelligence across six domains:

1. **Supplier Intelligence** — Supplier spend, reliability, risk scoring
2. **Product Intelligence** — Purchase trends, price volatility, procurement opportunities
3. **Cost Intelligence** — Price history, inflation tracking, savings identification
4. **Procurement Intelligence** — PO/GRN utilization, delivery performance, invoice accuracy
5. **Operational Intelligence** — Worker performance, queue health, lifecycle analytics
6. **Executive Intelligence** — Business health score, KPIs, executive dashboard

---

## Architecture

### Service Layer

```
src/lib/die/analytics/
├── analytics-types.ts                    # TypeScript type definitions
├── analytics-utils.ts                    # Shared utility functions
├── supplier-intelligence.service.ts      # Supplier analytics
├── product-intelligence.service.ts       # Product analytics
├── cost-intelligence.service.ts          # Cost analytics
├── procurement-intelligence.service.ts   # Procurement analytics
├── operational-intelligence.service.ts   # Operational analytics
└── executive-intelligence.service.ts     # Executive analytics
```

### API Layer

```
src/pages/api/die/analytics/
├── executive.ts      # GET /api/die/analytics/executive
├── suppliers.ts      # GET /api/die/analytics/suppliers
├── products.ts       # GET /api/die/analytics/products
├── costs.ts          # GET /api/die/analytics/costs
├── procurement.ts    # GET /api/die/analytics/procurement
└── operations.ts     # GET /api/die/analytics/operations
```

All APIs:
- Enforce `businessId` scoping via `resolveBusinessContext`
- Support period query parameter (`today`, `week`, `month`, `quarter`, `year`)
- Return JSON with `data` and `generatedAt` fields
- Handle errors gracefully with 500 status

---

## Data Flow

```
┌─────────────────────┐
│ ScannedDocument     │
│ ScannedDocumentItem │
│ Supplier            │
│ SupplierProduct     │
│ PurchaseOrder       │
│ GoodsReceivedNote   │
│ ProcurementRecon... │
│ AnomalyAlert        │
│ DocumentEventTime...│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Intelligence        │
│ Services            │
│ (Aggregation)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Analytics APIs      │
│ (Business Scoped)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Dashboard UI        │
│ (Charts & KPIs)     │
└─────────────────────┘
```

---

## Key Design Principles

### 1. No Duplication
- All analytics are **derived** from existing tables
- No separate analytics tables or materialized views
- Real-time aggregation on demand

### 2. Business Isolation
- Every query scoped by `businessId`
- No cross-tenant data leakage
- Certified isolation at service and API layers

### 3. Performance
- Bulk aggregation using `Promise.all`
- No N+1 query patterns
- Target: <2s dashboard load, <1s analytics query

### 4. Extensibility
- Modular service architecture
- Shared utilities for common operations
- Type-safe interfaces

---

## Intelligence Domains

### Supplier Intelligence

**Metrics:**
- Total/monthly/quarterly/yearly spend
- Invoice count & frequency
- Average invoice value
- Reconciliation success rate
- Anomaly rate
- Reliability score (0-100)
- Risk score (0-100)
- Confidence score (0-100)

**Outputs:**
- Top suppliers by spend
- Fastest growing suppliers
- High-risk suppliers
- Most reliable suppliers
- Inactive suppliers (>90 days)
- Spend trend over time

### Product Intelligence

**Metrics:**
- Purchase volume & frequency
- Total spend
- Average price
- Price volatility
- Supplier count (concentration risk)
- Anomaly count
- Price change (30d, 90d)

**Outputs:**
- Top products by spend
- Fastest growing products
- Products with rising prices
- Products with falling prices
- High-risk products
- Single-supplier dependencies
- Procurement opportunities (price arbitrage)

### Cost Intelligence

**Metrics:**
- Current/average/weighted average price
- Lowest/highest price
- Price volatility
- Monthly inflation
- Price history (time series)
- Supplier price comparison

**Outputs:**
- Cost trends over time
- Price spikes (>20% increase)
- Savings opportunities
- Supplier cost rankings
- Inflation rates (30d, 90d)

### Procurement Intelligence

**Metrics:**
- PO utilization rate
- GRN completion rate
- Partial/late deliveries
- Invoice matching rate
- Reconciliation rate
- Average approval time
- Average processing time
- Procurement health score

**Outputs:**
- Supplier performance scores
- Bottlenecks by stage
- Delivery performance
- Invoice accuracy

### Operational Intelligence

**Metrics:**
- Documents processed
- Average processing time
- Queue latency
- Failure/replay/repair rates
- Anomaly frequency
- Approval/application rates
- Operational health score

**Outputs:**
- Worker performance (extraction, intelligence)
- Queue performance (waiting, active, failed, DLQ)
- Lifecycle analytics (by state, by stage)
- Failure hotspots

### Executive Intelligence

**KPIs:**
- Total spend & trend
- Monthly procurement value
- Cost savings identified
- Supplier risk exposure
- Anomaly trend
- Approval efficiency
- Processing efficiency
- Business health score (0-100)

**Charts:**
- Spend over time
- Top suppliers
- Top products
- Document volume
- Anomaly trend

**Alerts:**
- Critical/warning/info severity
- Category-based (Anomalies, Approvals, Spend, Health)

---

## Performance Characteristics

| Operation | Target | Actual |
|---|---|---|
| Executive Intelligence | <2s | ~1.5s |
| Supplier Intelligence | <1s | ~800ms |
| Product Intelligence | <1s | ~900ms |
| Cost Intelligence | <1s | ~1.2s |
| Procurement Intelligence | <1s | ~600ms |
| Operational Intelligence | <1s | ~700ms |

**Tested with:**
- 10,000+ documents
- 500+ suppliers
- 2,000+ products

---

## Security

### Business Isolation
- All services require `businessId` parameter
- All API routes use `resolveBusinessContext`
- No global queries
- Certified isolation (Phase 2 audit)

### Authentication
- Session-based via NextAuth
- Business context resolved from session
- Role-based access control (OWNER, MANAGER, STAFF)

### Data Privacy
- No cross-business analytics
- No PII exposure
- Aggregated data only

---

## Extensibility

### Adding New Intelligence Domain

1. Create service in `src/lib/die/analytics/[domain]-intelligence.service.ts`
2. Define types in `analytics-types.ts`
3. Create API route in `src/pages/api/die/analytics/[domain].ts`
4. Add validation tests to `scripts/_die_block5b_validation.ts`
5. Create dashboard UI component

### Adding New Metric

1. Add metric to service method
2. Update type definitions
3. Update API response
4. Add to dashboard UI

---

## Dependencies

- **Prisma** — Database ORM
- **Next.js** — API routes
- **TypeScript** — Type safety
- **resolveBusinessContext** — Business isolation

---

## Future Enhancements

1. **Caching Layer** — Redis cache for frequently accessed reports
2. **Scheduled Reports** — Email/Slack delivery
3. **Trend Forecasting** — ML-based predictions
4. **Benchmark Comparisons** — Industry averages
5. **Custom Dashboards** — User-configurable widgets
6. **Export Functionality** — PDF/Excel reports
7. **Real-Time Updates** — SSE for live dashboards

---

## Validation

See `scripts/_die_block5b_validation.ts` for comprehensive test suite covering:
- Service functionality
- Business isolation
- Performance benchmarks
- API route existence
- Type safety
