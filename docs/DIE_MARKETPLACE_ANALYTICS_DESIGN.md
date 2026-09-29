# DIE Marketplace Analytics Design v1.0

## Objectives
Provide adoption, usage, and stability intelligence for each plugin, without modifying plugin runtime or marketplace core behavior.

## Metrics

### Adoption
- `adoptionScore` (0-100): Weighted composite of adoption breadth (business count), activation rate, and install→enable ratio.
- `installToEnableRatio` (0..1): Enables / Installs across businesses.
- `businessAdoptionCount`: Count of businesses with at least one install.
- `activationRate` (0..1): Enabled businesses / Installed businesses.

### Usage
- `usageFrequency` (0-100): Share of recent events in last window vs total recent.
- `lastUsedAt`: ISO timestamp of most recent audit event.
- `trendDirection` (UP/STABLE/DOWN): Recent activity vs prior window using weighted events.
- `activityScore` (0-100): Weighted event sum normalized by total recent events.

### Stability
- `anomalyRate` (0..1): Anomaly events / total recent events.
- `churnScore` (0-100): Disables / Enables ratio scaled.
- `stabilityScore` (0-100): 100 minus penalties for anomalies and churn.
- `governanceRiskScore` (0-100): Anomaly pressure + lifecycle inconsistency penalties.

## Algorithms

### Adoption Score
```
adoptionScore = min(100, businessAdoptionCount*10)*0.5
              + activationRate*100*0.3
              + installToEnableRatio*100*0.2
```

### Usage Trend
- Windows: recent (N minutes), prior (N..2N minutes)
- Weights: ENABLE=3, INSTALL=2, DISABLE=1, ANOMALY=1
- Trend: UP if recent > 1.2 * prior; DOWN if recent < 0.8 * prior; else STABLE

### Stability
```
anomalyRate = anomalies / totalEvents
churnScore = min(100, round((disables/enables)*100))
stabilityPenalty = min(60, round(anomalyRate*100*0.6)) + min(40, round(churnScore*0.4))
stabilityScore = max(0, 100 - stabilityPenalty)

governanceRiskScore = min(100, round(anomalyRate*100) + inconsistencyPenalty)
```

## Rankings
- `mostAdopted`: sort by adoptionScore desc
- `fastestGrowing`: trendDirection UP first, tie-breaker by activityScore desc
- `mostStable`: sort by stabilityScore desc
- `highestRisk`: sort by governanceRiskScore desc

## API Contracts (Read-Only)
- `GET /api/die/marketplace/intelligence/overview`: MarketplacePluginIntelligence[]
- `GET /api/die/marketplace/intelligence/rankings`: MarketplaceRankings
- `GET /api/die/marketplace/intelligence/plugin?pluginId=...`: MarketplacePluginIntelligence

## Constraints Honored
- No autonomous actions, self-healing, or runtime changes
- No marketplace rewrites or URL changes to existing routes
- Business isolation preserved
- Performance preserved (in-memory, cached sources)

## Future Work
- Multi-tenant filters (businessId-specific views)
- Persisted, rolling usage snapshots to reduce on-demand compute
- Enhanced weighting per plugin category
