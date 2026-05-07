-- Purpose: Add concurrent, additive indexes to improve Tap & Leave payment reliability and admin metrics.
-- Safety: All statements use CREATE INDEX CONCURRENTLY IF NOT EXISTS, making them safe to re-run and
--         minimizing locks. PostgreSQL still requires brief lightweight locks for catalog updates,
--         but concurrent index creation does NOT block reads or writes on the target tables.
--
-- IMPORTANT Postgres constraint:
--   - CREATE INDEX CONCURRENTLY (and DROP INDEX CONCURRENTLY) cannot run inside a transaction block.
--     Ensure your SQL tool is NOT wrapping these statements in a single transaction.
--
-- Supabase/Postgres execution notes:
--   - Supabase SQL Editor: uncheck any option that runs all statements inside one transaction.
--   - psql CLI (recommended):
--       psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/add_payment_health_indexes.sql
--     or run each statement individually with -c, e.g.:
--       psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt");'
--
-- Validation (post-run):
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename IN ('PaymentTransaction','CheckoutEvent')
--     AND indexname IN (
--       'PaymentTransaction_updatedAt_idx',
--       'CheckoutEvent_paymentId_idx',
--       'CheckoutEvent_eventType_createdAt_idx'
--     );
--
-- Rollback (if ever needed; run individually and never inside a transaction):
--   DROP INDEX CONCURRENTLY IF EXISTS "PaymentTransaction_updatedAt_idx";
--   DROP INDEX CONCURRENTLY IF EXISTS "CheckoutEvent_paymentId_idx";
--   DROP INDEX CONCURRENTLY IF EXISTS "CheckoutEvent_eventType_createdAt_idx";

-- 1) PaymentTransaction.updatedAt to speed up cron/sweeper/metrics scans
-- NOTE: When running in Supabase SQL Editor, CREATE INDEX CONCURRENTLY cannot run inside a transaction.
-- Leave the direct statements commented and use the pg_cron section below instead.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "PaymentTransaction_updatedAt_idx"
--   ON "PaymentTransaction"("updatedAt");

-- 2) CheckoutEvent.paymentId for admin metrics/event lookups by payment
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_paymentId_idx"
--   ON "CheckoutEvent"("paymentId");

-- 3) CheckoutEvent.eventType + createdAt for time-bounded event scans and breakdowns
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_eventType_createdAt_idx"
--   ON "CheckoutEvent"("eventType", "createdAt");

-- Supabase SQL Editor friendly runner: schedule the concurrent index builds via pg_cron (runs outside txn)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule each job to run every minute; IF NOT EXISTS ensures only the first run builds the index.
-- After verifying indexes exist, you can unschedule the jobs (see notes below).
SELECT cron.schedule(
  'idx_paymenttransaction_updatedat_1',
  '*/1 * * * *',
  $$ CREATE INDEX CONCURRENTLY IF NOT EXISTS "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt"); $$
);

SELECT cron.schedule(
  'idx_checkoutevent_paymentid_1',
  '*/1 * * * *',
  $$ CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_paymentId_idx" ON "CheckoutEvent"("paymentId"); $$
);

SELECT cron.schedule(
  'idx_checkoutevent_eventtype_createdat_1',
  '*/1 * * * *',
  $$ CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_eventType_createdAt_idx" ON "CheckoutEvent"("eventType", "createdAt"); $$
);

-- Optional: monitor job results
-- SELECT * FROM cron.job_run_details ORDER BY end_time DESC LIMIT 20;

-- After 1-2 minutes, verify indexes exist, then unschedule the jobs:
--   SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN (
--     'PaymentTransaction_updatedAt_idx','CheckoutEvent_paymentId_idx','CheckoutEvent_eventType_createdAt_idx');
--   SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
--     'idx_paymenttransaction_updatedat_1','idx_checkoutevent_paymentid_1','idx_checkoutevent_eventtype_createdat_1'
--   );


