-- Phase 0.7 Production Observation Queries
-- READ-ONLY monitoring queries for system health validation

-- ============================================================================
-- 1. PAYMENT SYSTEM HEALTH
-- ============================================================================

-- 1.1 Payment Success Rate by Provider (Last 24 Hours)
SELECT 
  gateway,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as success_rate_pct
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
ORDER BY total_transactions DESC;

-- 1.2 Payment Latency Analysis (Webhook Delivery Time)
SELECT 
  gateway,
  COUNT(*) as successful_payments,
  ROUND(AVG(EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) as avg_latency_seconds,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) as median_latency_seconds,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) as p95_latency_seconds,
  MAX(EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))) as max_latency_seconds
FROM "PaymentTransaction"
WHERE status = 'SUCCESS' 
  AND "paidAt" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
ORDER BY avg_latency_seconds ASC;

-- 1.3 Stuck Payments Detection (Current State)
SELECT 
  gateway,
  status,
  COUNT(*) as stuck_count,
  MIN("createdAt") as oldest_stuck,
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60), 2) as avg_age_minutes
FROM "PaymentTransaction"
WHERE status IN ('PENDING', 'PROCESSING')
  AND "createdAt" < NOW() - INTERVAL '10 minutes'
GROUP BY gateway, status
ORDER BY stuck_count DESC;

-- 1.4 Failure Reasons Breakdown (Last 24 Hours)
SELECT 
  gateway,
  ("rawStatus"->>'error')::text as error_reason,
  COUNT(*) as failure_count
FROM "PaymentTransaction"
WHERE status = 'FAILED'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway, ("rawStatus"->>'error')::text
ORDER BY failure_count DESC
LIMIT 20;

-- 1.5 Webhook Delivery Success (Last 24 Hours)
SELECT 
  gateway,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE "webhookVerified" = true) as verified_webhooks,
  COUNT(*) FILTER (WHERE "webhookVerified" = false OR "webhookVerified" IS NULL) as unverified_webhooks,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "webhookVerified" = true) / NULLIF(COUNT(*), 0), 2) as verification_rate_pct
FROM "PaymentTransaction"
WHERE "webhookTimestamp" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
ORDER BY total_webhooks DESC;

-- ============================================================================
-- 2. LEDGER CONSISTENCY VERIFICATION
-- ============================================================================

-- 2.1 Ledger Entry Coverage (SUCCESS payments should have ledger entries)
SELECT 
  'SUCCESS payments without ledger entry' as check_type,
  COUNT(*) as violation_count
FROM "PaymentTransaction" pt
WHERE pt.status = 'SUCCESS'
  AND pt."paidAt" >= NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM "FinancialLedgerEntry" fle
    WHERE fle."paymentTransactionId" = pt.id
      AND fle."eventType" = 'PAYMENT_SUCCESS'
  );

-- 2.2 Duplicate Ledger Entries (Idempotency Violation)
SELECT 
  "idempotencyKey",
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as entry_ids
FROM "FinancialLedgerEntry"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY "idempotencyKey"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- 2.3 Ledger Entry Lag (Time between payment success and ledger write)
SELECT 
  ROUND(AVG(EXTRACT(EPOCH FROM (fle."createdAt" - pt."paidAt"))), 2) as avg_lag_seconds,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fle."createdAt" - pt."paidAt"))), 2) as median_lag_seconds,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fle."createdAt" - pt."paidAt"))), 2) as p95_lag_seconds,
  MAX(EXTRACT(EPOCH FROM (fle."createdAt" - pt."paidAt"))) as max_lag_seconds,
  COUNT(*) as sample_size
FROM "PaymentTransaction" pt
JOIN "FinancialLedgerEntry" fle ON fle."paymentTransactionId" = pt.id
WHERE pt.status = 'SUCCESS'
  AND pt."paidAt" IS NOT NULL
  AND fle."eventType" = 'PAYMENT_SUCCESS'
  AND pt."paidAt" >= NOW() - INTERVAL '24 hours';

-- 2.4 Ledger Integrity by Provider
SELECT 
  pt.gateway,
  COUNT(DISTINCT pt.id) as total_success_payments,
  COUNT(DISTINCT fle."paymentTransactionId") as payments_with_ledger,
  COUNT(DISTINCT pt.id) - COUNT(DISTINCT fle."paymentTransactionId") as missing_ledger_entries,
  ROUND(100.0 * COUNT(DISTINCT fle."paymentTransactionId") / NULLIF(COUNT(DISTINCT pt.id), 0), 2) as ledger_coverage_pct
FROM "PaymentTransaction" pt
LEFT JOIN "FinancialLedgerEntry" fle ON fle."paymentTransactionId" = pt.id AND fle."eventType" = 'PAYMENT_SUCCESS'
WHERE pt.status = 'SUCCESS'
  AND pt."paidAt" >= NOW() - INTERVAL '24 hours'
GROUP BY pt.gateway
ORDER BY missing_ledger_entries DESC;

-- ============================================================================
-- 3. WATCHDOG BEHAVIOR VALIDATION
-- ============================================================================

-- 3.1 Watchdog Alert Volume (Simulated - check actual logs)
-- This query identifies payments that SHOULD trigger watchdog alerts
SELECT 
  DATE_TRUNC('hour', "createdAt") as hour,
  gateway,
  COUNT(*) as stuck_payment_count,
  COUNT(*) FILTER (WHERE "netToBusinessCents" >= 5000000) as high_value_stuck_count
FROM "PaymentTransaction"
WHERE status IN ('PENDING', 'PROCESSING')
  AND "createdAt" < NOW() - INTERVAL '10 minutes'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', "createdAt"), gateway
ORDER BY hour DESC, stuck_payment_count DESC;

-- 3.2 False Positive Detection (Payments that recovered after being stuck)
SELECT 
  gateway,
  COUNT(*) as recovered_count,
  ROUND(AVG(EXTRACT(EPOCH FROM ("paidAt" - "createdAt")) / 60), 2) as avg_recovery_time_minutes
FROM "PaymentTransaction"
WHERE status = 'SUCCESS'
  AND "paidAt" IS NOT NULL
  AND EXTRACT(EPOCH FROM ("paidAt" - "createdAt")) > 600 -- Took longer than 10 minutes
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
ORDER BY recovered_count DESC;

-- ============================================================================
-- 4. PROVIDER STABILITY COMPARISON
-- ============================================================================

-- 4.1 Provider Performance Scorecard (Last 24 Hours)
SELECT 
  gateway,
  COUNT(*) as total_transactions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as success_rate_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'FAILED') / NULLIF(COUNT(*), 0), 2) as failure_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) FILTER (WHERE status = 'SUCCESS') as avg_latency_seconds,
  COUNT(*) FILTER (WHERE status IN ('PENDING', 'PROCESSING') AND "createdAt" < NOW() - INTERVAL '10 minutes') as currently_stuck,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "webhookVerified" = true) / NULLIF(COUNT(*) FILTER (WHERE "webhookTimestamp" IS NOT NULL), 0), 2) as webhook_verification_rate_pct
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
ORDER BY total_transactions DESC;

-- 4.2 Provider Reliability Trend (Last 7 Days, Daily)
SELECT 
  DATE_TRUNC('day', "createdAt")::date as day,
  gateway,
  COUNT(*) as total_transactions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as success_rate_pct
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', "createdAt")::date, gateway
ORDER BY day DESC, gateway;

-- ============================================================================
-- 5. CURRENCY DRIFT DETECTION (READ-ONLY)
-- ============================================================================

-- 5.1 Currency Usage in Payment Transactions
SELECT 
  "paymentMethod",
  ("metadata"->>'currency')::text as currency_used,
  COUNT(*) as transaction_count
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
  AND "metadata" IS NOT NULL
GROUP BY "paymentMethod", ("metadata"->>'currency')::text
ORDER BY transaction_count DESC;

-- 5.2 Sale Amount Consistency Check
-- Compare Sale.totalAmountCents with PaymentTransaction amounts
SELECT 
  COUNT(*) as total_sales,
  COUNT(*) FILTER (WHERE s."totalAmountCents" = pt."netToBusinessCents") as matching_amounts,
  COUNT(*) FILTER (WHERE s."totalAmountCents" != pt."netToBusinessCents") as mismatched_amounts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE s."totalAmountCents" = pt."netToBusinessCents") / NULLIF(COUNT(*), 0), 2) as match_rate_pct
FROM "Sale" s
JOIN "PaymentTransaction" pt ON pt."invoiceNumber" = 'INV-' || s."orderNumber"
WHERE s."createdAt" >= NOW() - INTERVAL '24 hours'
  AND pt.status = 'SUCCESS';

-- ============================================================================
-- 6. SYSTEM ERROR SURFACE
-- ============================================================================

-- 6.1 Payment Transaction Errors (Last 24 Hours)
SELECT 
  gateway,
  ("rawStatus"->>'error')::text as error_type,
  COUNT(*) as error_count,
  ARRAY_AGG(DISTINCT id ORDER BY id) FILTER (WHERE id IS NOT NULL) as sample_transaction_ids
FROM "PaymentTransaction"
WHERE status = 'FAILED'
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway, ("rawStatus"->>'error')::text
ORDER BY error_count DESC
LIMIT 30;

-- 6.2 Webhook Signature Failures
SELECT 
  gateway,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE "webhookVerified" = false) as failed_verifications,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "webhookVerified" = false) / NULLIF(COUNT(*), 0), 2) as failure_rate_pct
FROM "PaymentTransaction"
WHERE "webhookTimestamp" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY gateway
HAVING COUNT(*) FILTER (WHERE "webhookVerified" = false) > 0
ORDER BY failed_verifications DESC;

-- 6.3 Reconciliation Mismatches (Last 24 Hours)
SELECT 
  COUNT(*) as total_reconciled,
  COUNT(*) FILTER (WHERE ("rawStatus"->>'reconciled'->>'mismatch')::boolean = true) as mismatch_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ("rawStatus"->>'reconciled'->>'mismatch')::boolean = true) / NULLIF(COUNT(*), 0), 2) as mismatch_rate_pct
FROM "PaymentTransaction"
WHERE "rawStatus"->>'reconciled' IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '24 hours';

-- ============================================================================
-- 7. DAILY STABILITY SUMMARY
-- ============================================================================

-- 7.1 Overall System Health (Last 24 Hours)
SELECT 
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as successful,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  COUNT(*) FILTER (WHERE status IN ('PENDING', 'PROCESSING')) as in_flight,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'SUCCESS') / NULLIF(COUNT(*), 0), 2) as overall_success_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM ("paidAt" - "createdAt"))), 2) FILTER (WHERE status = 'SUCCESS') as avg_payment_time_seconds,
  COUNT(*) FILTER (WHERE status IN ('PENDING', 'PROCESSING') AND "createdAt" < NOW() - INTERVAL '10 minutes') as currently_stuck
FROM "PaymentTransaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours';

-- 7.2 Ledger Integrity Summary
SELECT 
  (SELECT COUNT(*) FROM "PaymentTransaction" WHERE status = 'SUCCESS' AND "paidAt" >= NOW() - INTERVAL '24 hours') as success_payments,
  (SELECT COUNT(DISTINCT "paymentTransactionId") FROM "FinancialLedgerEntry" WHERE "eventType" = 'PAYMENT_SUCCESS' AND "createdAt" >= NOW() - INTERVAL '24 hours') as ledger_entries,
  (SELECT COUNT(*) FROM "PaymentTransaction" pt WHERE pt.status = 'SUCCESS' AND pt."paidAt" >= NOW() - INTERVAL '24 hours' AND NOT EXISTS (SELECT 1 FROM "FinancialLedgerEntry" fle WHERE fle."paymentTransactionId" = pt.id AND fle."eventType" = 'PAYMENT_SUCCESS')) as missing_entries,
  (SELECT COUNT(*) FROM (SELECT "idempotencyKey" FROM "FinancialLedgerEntry" WHERE "createdAt" >= NOW() - INTERVAL '24 hours' GROUP BY "idempotencyKey" HAVING COUNT(*) > 1) duplicates) as duplicate_entries;
