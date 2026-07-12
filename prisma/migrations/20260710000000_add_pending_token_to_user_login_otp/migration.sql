-- Add pendingToken to UserLoginOtp for secure OTP resend authentication.
-- This token is issued by pre-login after password validation and required
-- by resend-otp as cryptographic proof the requester completed the password step.

ALTER TABLE "UserLoginOtp" ADD COLUMN "pendingToken" TEXT;

CREATE UNIQUE INDEX "UserLoginOtp_pendingToken_key" ON "UserLoginOtp"("pendingToken");
CREATE INDEX "UserLoginOtp_pendingToken_idx" ON "UserLoginOtp"("pendingToken");
