-- P1-B customer-facing security hardening.
-- Binds each QR-draft Sale to the jti of the single-use QR access token that
-- created it, so public order endpoints (confirm/status/messages) can verify
-- that the caller holds the exact credential that produced the order.
-- Nullable: existing rows and non-QR order sources have no token binding.

ALTER TABLE "Sale" ADD COLUMN "orderTokenJti" TEXT;
