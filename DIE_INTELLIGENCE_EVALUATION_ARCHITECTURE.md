---
# description: Intelligence Evaluation & Self-Validation Layer (Phase 7)
---

Principles
- Additive, read-only, non-blocking, in-memory only.
- Feature-flagged OFF by default: DIE_INTELLIGENCE_EVALUATION_ENABLED=false.
- No schema changes, no business logic mutations, no automation, no notifications.

Flow
Signals → Correlations → Reasoning → Assistant → CEO → Reliability → Evaluation

Components
- evaluation-engine
  - captureInsights(insights): ring-buffer snapshot of predictions (T0)
  - evaluateDue(): at T+window, reads current metrics from finance snapshot and temporal summaries; judges correctness vs baseline and expectation
  - CEO batches: stores predicted ordering for later Top-k accuracy

- prediction-validator
  - Accuracy, Precision, Recall, FP/FN (FN heuristic), per-domain accuracy

- trust-calibration-engine
  - Buckets trustScore into 90+, 80–89, 70–79, <70; checks monotonicity and calibration score

- narrative-validator
  - Scores narrative categories (Finance, Operations, Supply Chain, Customer) based on evaluated insights underlying each narrative

- ceo-priority-validator
  - Computes Top-1/Top-3/Top-5 accuracy comparing predicted vs realized impact ordering

- intelligence-scorecard
  - Aggregates metrics into an executive summary with recommendations and executive scores

Read Sources (read-only)
- Finance: computeFinanceSnapshot() (FinancialLedgerEntry only)
- Temporal: getTemporalComparisons(), getFeedHistoryWithin()
- CEO: prioritizeForCEO() output captured at T0

API
- GET /api/die/intelligence/evaluation (read-only)
  - returns scorecard: overallAccuracy, FPR/FNR, precision, recall, domainAccuracy, trustCalibration, ceoPriorityAccuracy, narrativeAccuracy, recentEvaluations, recommendations, scores

Safety
- No writes to production tables.
- In-memory ring buffers with hard caps.
- Try/catch isolation; never blocks request path.

Configuration
- DIE_INTELLIGENCE_EVALUATION_ENABLED=false (default)
- DIE_EVALUATION_WINDOW_MS=86400000 (optional; default 24h)

Validation
- Run TypeScript, existing DIE validation suite, plugin validation, performance check.
