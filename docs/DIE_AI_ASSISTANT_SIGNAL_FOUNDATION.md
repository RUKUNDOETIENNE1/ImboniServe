# DIE AI Assistant Signal Foundation (Future Work)

This document enumerates read-only signals now available for a future AI Business Assistant to answer "What should I do today?" WITHOUT any automation.

## Inventory Insights
- Frequent shortages by item (`INVENTORY_STOCK_LOW`, `INVENTORY_STOCK_OUT`, `INVENTORY_THRESHOLD_BREACH`)
- Recovery signals (`INVENTORY_RESTOCKED`) with simple cycle-time estimates
- Risk indicators: shortageRiskScore, stockRiskScore

## Procurement Insights
- New orders created (`PROCUREMENT_ORDER_CREATED`)
- Orders received (`PROCUREMENT_ORDER_RECEIVED`, `GOODS_RECEIVED`)
- Risk indicators: delayRiskScore, procurementRiskScore, procurementEfficiencyScore
- Exceptions: `PROCUREMENT_DELAY_DETECTED` (WARN), `PROCUREMENT_EXCEPTION` (CRITICAL)

## Supplier Insights
- Order assignments and completions
- Delay and failure prevalence (`SUPPLIER_DELIVERY_DELAYED`, `SUPPLIER_DELIVERY_FAILED`)
- Risk indicators: supplier delay risk (via delayRiskScore proxy), governanceRiskScore for failures

## Recovery Cycle Insights
- Sequences from shortage → order → receipt → restock
- Average replenishment time (observational, shadow buffer derived)

## Trend Indicators
- Marketplace usage surrogates: usageFrequency, activityScore, trendDirection per plugin for shadow events

## Consumption Plan (Future)
- Dashboard cards consuming correlation report riskSignals and optimizationCandidates
- Natural language prompt grounding using unified observability feed snapshots
- No data writes, no automated actions; human-in-the-loop only
