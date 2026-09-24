# EOS-001G — Changelog

## [EOS-001G] — Customer Success Director Operating Center — 2026-08-06

### Added
- Customer Success Director Operating Center page at `/admin/executive/customer-success-director`
- API endpoint at `/api/admin/executive/customer-success-director` with composition-only data aggregation (46 parallel queries)
- 10 executive components for customer success intelligence:
  - CustomerSuccessPulse — health score, active businesses, new activations, businesses at risk, healthy businesses, retention rate, expansion opportunities, success status
  - CustomerSuccessDailyBrief — yesterday, today's priorities, new activations, customers requiring attention, success highlights, retention risks, recommendations
  - CustomerJourneyIntelligence — 8-stage lifecycle (Lead → Trial → Activation → Onboarding → Adoption → Healthy Customer → Expansion → Advocate) with bottleneck detection
  - CustomerHealthCenter — overall health score, health distribution, high-risk/improving/declining businesses, health trends, health drivers
  - AdoptionIntelligence — adoption rate, feature adoption (QR/remote ordering), active branches, active users, sales activity, underutilized features
  - CustomerEngagementCenter — customer activity, platform engagement, support interactions, recent support conversations, dormant customers
  - RetentionExpansionCenter — retention rate, churn rate, renewal forecast, renewal risk, expansion candidates, upcoming renewals
  - SuccessOpportunityCenter — auto-identified growth opportunities with actions and expected impact
  - CustomerAttentionCenter — actionable items only (no informational cards), sorted by severity
  - AICustomerSuccessAssistant — deterministic recommendations with evidence/confidence/expected impact/suggested actions
- Customer Success Health Score computation (composite 0-100 from active ratio, inactive rate, subscription health, cancellation rate, customer engagement, dormant rate, support burden, business activity)
- AI recommendation engine (7 rule-based recommendations: ecosystem health, trial conversion, retention/churn, adoption/engagement, customer engagement, expansion, support health)
- Opportunity detection engine (8 opportunity types: expansion, trial conversion, adoption improvement, re-engagement, feature adoption, customer re-engagement, regional expansion, success milestones)
- Attention item builder (actionable items from expiring trials, grace period, past due, low/no activity businesses, dormant customers, support conversations, renewals, cancellations, inactive businesses)
- Comprehensive test suite (65 tests covering rendering, loading/empty states, navigation/drill-down, cross-component consistency, AI assistant shape, severity sorting)
- Certification report, changelog, user guide, and engineering notes

### Changed
- `AdminLayout.tsx` — Added Heart icon import and Customer Success Center navigation item

### Services Reused (No New Services)
- ExecutiveSummaryService (generateDailySummary, generateWeeklySummary)
- CustomerHealthScoreService (getDistribution)
- SubscriptionIntelligenceService (getIntelligence)
- Direct Prisma queries (Business, Subscription, Branch, Customer, SupportConversation, SupportMessage, User, Sale)

### Permissions
- CUSTOMER_SUCCESS_DIRECTOR role already in auth middleware validRoles
- Server-side auth check on page (CUSTOMER_SUCCESS_DIRECTOR, ADMIN, CUSTOMER_SUCCESS_MANAGER, EXECUTIVE)
- API endpoint role guard (CUSTOMER_SUCCESS_DIRECTOR, ADMIN, CUSTOMER_SUCCESS_MANAGER, EXECUTIVE)
- Unauthenticated: redirect to signin
- Insufficient permissions: redirect to /admin (SSR), 403 JSON (API)

### Hospitality-First Terminology
- Zero restaurant-specific terminology in all EOS-001G files
- "Hospitality Business" used as primary entity for the managed customer
- "Customer" used specifically for end-consumers of hospitality businesses
- "hospitality business" used in AI recommendations and attention items
