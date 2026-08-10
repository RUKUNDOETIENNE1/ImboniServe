# EOS-001H Engineering Notes — Executive Intelligence Engine

## Architecture Decisions

### 1. Composition-Only API (No New Services)
The Executive Intelligence Engine API reuses all certified services from the existing 6 centers. No new backend services were created. The API composes:
- ExecutiveSummaryService (daily/weekly summaries)
- FinancialHealthService (MRR, ARR, churn, NRR)
- FinancialPrioritiesService (top financial priorities)
- CustomerHealthScoreService (health distribution)
- SubscriptionIntelligenceService (subscription analysis)
- PartnershipOperationalQueryService (partner metrics, campaigns, LTV, CAC, commissions)
- PaymentWatchdogService, QueueWatchdogService, ReconciliationWatchdogService, SubscriptionWatchdogService
- Prisma (direct count queries for cross-domain metrics)

### 2. Cross-Center Health Score Computation
Each center's health is computed from its domain-specific signals:
- **Finance**: MRR status, NRR rate, revenue churn, revenue growth
- **Operations**: Payment health, queue health, reconciliation health
- **Growth**: Revenue trend, net customer change, new businesses, active campaigns
- **Partnership**: Active/total ratio, suspended count, campaign activity, expiring agreements
- **Customer Success**: Active/total ratio, inactivity rate, grace/past-due, cancellations, dormancy

Overall score = mean of 5 center scores.

### 3. Deterministic Cross-Center Reasoning
The `generateExecutiveDecisions()` function produces 5-7 decisions based on data patterns:
1. Revenue + Growth + Partnership = Marketing ROI decision
2. Customer Success + Finance = Churn + Revenue Risk decision
3. Partnership + Customer Success + CMO = Acquisition Quality decision
4. Operations + Finance = Operational Cost Drivers decision
5. All centers = Company Health Synthesis decision
6. Regional expansion opportunity (if data exists)
7. Weekly focus recommendation (weakest vs strongest center)

All reasoning is deterministic (no LLM calls). Evidence arrays provide traceable sources.

### 4. Priority Queue Generation
Items are sourced from all centers and sorted by severity:
- CRITICAL: Payment/Queue/Reconciliation failures, high-priority support, past-due subscriptions
- HIGH: Grace period, suspended partners, pending payouts, cancellations
- MEDIUM: Pending applications, expiring agreements, low activity businesses, financial priorities
- LOW: Open support volume

### 5. Component Architecture
All 10 components follow the certified pattern:
- Exported data interface
- Props: { data: T | null; loading?: boolean; onNavigate?: (link: string) => void }
- Three states: loading (animate-pulse), empty (text-sm text-slate-400), data
- Container: rounded-2xl border border-slate-200 bg-white p-6
- Header: icon (w-5 h-5) + h3 (text-base font-bold) + count badge

### 6. Performance Considerations
- All service calls in `Promise.all()` (parallel execution)
- ~50 parallel queries (services + prisma counts) — typical response time 200-500ms
- No N+1 queries — all counts are independent
- Client-side: single fetch, no polling (manual refresh button)

---

## Service Dependency Map

```
executive-intelligence.ts
├── ExecutiveSummaryService (daily + weekly)
├── FinancialHealthService
├── FinancialPrioritiesService (top 5)
├── CustomerHealthScoreService (distribution)
├── SubscriptionIntelligenceService
├── PartnershipOperationalQueryService
│   ├── getTopPartners (revenue + signups)
│   ├── getCampaignPerformance (10)
│   ├── getRegionalPerformance
│   ├── getPartnershipTypeLTV
│   ├── getCACByPartnerType
│   ├── getCommissionSummary
│   ├── getTotalCommissionLiability
│   ├── getPartnersRequiringAttention
│   └── getExpiringAgreements (30d)
├── PaymentWatchdogService
├── QueueWatchdogService
├── ReconciliationWatchdogService
├── SubscriptionWatchdogService
└── Prisma (30+ count queries)
```

---

## Cross-Center Consistency Audit

| Pattern | CEO | CFO | COO | CMO | PD | CSD | Intelligence |
|---------|-----|-----|-----|-----|----|----|-------------|
| AdminLayout wrapper | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SSR auth guard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| API role check | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| KpiCard usage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Loading skeletons | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Empty states | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Error + retry | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Drill-down nav | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Severity colors | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| generatedAt footer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Nav icon + label | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Known Pre-existing Issues (Not introduced by EOS-001H)

1. `_error.tsx` has import error for `defaultLocale` — pre-existing
2. 40+ tsc errors in `src/lib/intelligence/`, `src/lib/service-intelligence/`, `scripts/` — all pre-existing, none in executive files
3. 18 test failures in unrelated files (seating-conflicts, order-edge-cases, a11y) — pre-existing

---

## DGS-001 Review Notes

### Terminology
- All references use "Hospitality Business" (not "restaurant")
- Center naming is consistent: "Executive Intelligence Engine" (not dashboard)
- Priority labels: CRITICAL/HIGH/MEDIUM/LOW (consistent with AttentionCenter)

### Future Considerations
- `expectedImpact` field in CFO/COO AI assistants should be standardized (noted in EOS-001G review)
- Consider adding time-series trend data for line charts in a future phase
- Consider WebSocket for real-time priority queue updates
