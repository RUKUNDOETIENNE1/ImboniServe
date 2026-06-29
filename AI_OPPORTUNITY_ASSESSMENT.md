# AI Opportunity Assessment (Phase 1.0A)

Date: June 22, 2026
Guiding Principle: Start with high-signal, low-risk models; offline evaluation → shadow → gated rollout.

---

## 1) Tier-1 (High Impact, Moderate Effort)

- Revenue Forecasting (Ledger-based)
  - Input: `FinancialLedgerEntry` time series by segment, plan, region
  - Approach: Prophet/SARIMAX/LSTM baselines; seasonality + holiday calendars
  - Value: inventory planning, capacity, hiring, finance projections
  - KPI: MAPE ≤ 10–15% on 4–8 week horizon

- Churn Prediction (Subscriptions)
  - Input: tenure, FRM, payment history, grace/past-due aging, engagement
  - Approach: GBM/Logistic baseline; SHAP for interpretability
  - Value: early-warning for rescue campaigns; reduce net churn
  - KPI: AUC ≥ 0.75; lift in top deciles

- Payment Failure Anomaly Detection (Providers)
  - Input: failure rates by code/provider/region, latency, webhook failures
  - Approach: EWMA/CUSUM baselines; robust z-score + seasonal decomposition
  - Value: faster incident detection; reduced financial leakage
  - KPI: Precision ≥ 0.7 at fixed recall

---

## 2) Tier-2 (Medium Impact, Low/Medium Effort)

- Occupancy Forecasting (Hotels)
  - Inputs: historical occupancy, ADR, seasonality, events
  - Approach: SARIMA/Prophet baselines; upgrade to gradient-boosted trees
  - Value: pricing and staffing optimization

- Intelligent Recommendations (Restaurants)
  - Inputs: menu mix, order history, margins
  - Approach: association rules + matrix factorization; guardrails for margin
  - Value: increase AOV and repeat rate

- Revenue Anomaly Detection
  - Inputs: ledger-based aggregates; seasonality-aware residuals
  - Approach: STL decomposition + robust thresholds
  - Value: catch reporting errors and pipeline drifts

---

## 3) Tier-3 (Strategic, Longer-Term)

- Time-to-Drain Forecasting (Queues)
  - Inputs: backlog size, processing rates, job class mix
  - Value: proactive scaling & SLA adherence

- Autonomous Remediation Advisor
  - Inputs: watchdog events, historical incidents, runbook outcomes
  - Value: reduce MTTR via suggested fixes

- LTV Prediction & Offer Optimization
  - Inputs: FRM, tenure, spend velocity, margin
  - Value: targeted promotions with ROI guarantees

---

## 4) Risk & Ethics

- Privacy & PII: minimize features with PII; aggregate wherever possible
- Explainability: prefer interpretable baselines first; SHAP for complex models
- Bias & Drift: monitor model drift; fairness-aware evaluation where applicable
- Guardrails: no automated user-facing actions without human-in-the-loop review

---

## 5) Roadmap & Validation Plan

- Phase 1.1: Offline datasets, baselines, backtests (no production inference)
- Phase 1.2: Shadow deployment on staged traffic (read-only)
- Phase 1.3: Gated limited rollout with alert-only actions first
- Phase 2.0: Integrate with watchdogs for forecast-aware alerting and recommendations
