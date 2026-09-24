-- WhatsApp inbound webhook deduplication.
-- Provider-side message id (Twilio MessageSid / Meta wamid) persisted on
-- WhatsAppMessage so repeated webhook deliveries cannot create duplicate orders.
-- Nullable to keep existing outbound log rows valid; unique where present.

ALTER TABLE "WhatsAppMessage" ADD COLUMN "messageSid" TEXT;
CREATE UNIQUE INDEX "WhatsAppMessage_messageSid_key" ON "WhatsAppMessage"("messageSid");
