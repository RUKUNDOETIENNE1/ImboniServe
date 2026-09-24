# MPCA-001B — InTouch Production Verification Questionnaire

**Date:** 2026-08-12
**Phase:** MPCA-001B
**Purpose:** To be sent directly to InTouch support/API/technical representatives
**Status:** READY FOR FOUNDER TO SEND

---

## Instructions for InTouch Representative

ImboniServe is integrating InTouch as a payment provider for hospitality businesses in Rwanda. We need to verify InTouch's production API capabilities for settlement, withdrawal, and reconciliation.

**Please answer each question with one of:**
- **VERIFIED** — directly demonstrated in your production API
- **DOCUMENTED** — explicitly stated in your API documentation
- **SUPPORT_CONFIRMED** — confirmed by your support team
- **NOT_SUPPORTED** — your platform does not support this
- **NOT_APPLICABLE** — not relevant to your platform

Please provide documentation links, API endpoint references, or sample responses where possible.

---

## 1. MERCHANT ACCOUNT

1.1. Does each hospitality business receive its own InTouch merchant account, or do all businesses share our platform account?

1.2. What uniquely identifies a merchant in your system? (merchant ID, account number, etc.)

1.3. Is there a merchant balance concept? (funds held by InTouch on behalf of the merchant)

1.4. Can the merchant balance be retrieved via API?

1.5. If yes, what API endpoint returns the merchant balance?

1.6. Is the balance real-time or periodically updated?

---

## 2. FUNDS AVAILABILITY

2.1. After a payment succeeds (webhook received with status "successful"), when are funds available to the merchant?

2.2. Is same-day funds availability supported?

2.3. Is availability immediate (seconds/minutes) or delayed (hours/days)?

2.4. Are weekends or holidays treated differently for funds availability?

2.5. Is there an API to check funds availability status for a specific payment?

2.6. Is there a webhook that notifies when funds become available?

---

## 3. WITHDRAWAL

3.1. Can merchants withdraw funds every day?

3.2. What withdrawal destinations are supported? (bank account, mobile money, etc.)

3.3. How long does a withdrawal take to complete after request?

3.4. Are there withdrawal fees? If so, what are they?

3.5. Is there a minimum withdrawal amount?

3.6. Is there a maximum withdrawal amount?

3.7. Are there daily withdrawal limits?

3.8. What happens when a withdrawal fails? (retry, manual intervention, etc.)

3.9. Is there a withdrawal API endpoint?

3.10. Is there a withdrawal status webhook?

3.11. What is the withdrawal request payload format?

3.12. What is the withdrawal status response format?

---

## 4. SETTLEMENT

4.1. Is settlement automatic (funds flow to merchant without action) or merchant-initiated?

4.2. Is there a settlement ID for each settlement event?

4.3. Is there a settlement API endpoint?

4.4. Is there a settlement webhook?

4.5. Can settlement history be retrieved via API?

4.6. Can individual payments be reconciled against specific settlements?

4.7. What is the settlement frequency? (real-time, daily, weekly, etc.)

4.8. Does settlement happen on weekends/holidays?

4.9. Is there a settlement report available?

4.10. What format is the settlement report? (API, CSV, PDF, etc.)

---

## 5. FEES

5.1. What gateway fee is charged per transaction? (percentage, fixed, or both)

5.2. Is the fee visible in the payment API response?

5.3. Is the fee deducted before merchant funds become available, or billed separately?

5.4. Can platform fees (our fees, not InTouch fees) be deducted at the provider level?

5.5. Does InTouch support split settlement? (sending portions of a payment to different destinations)

5.6. If split settlement is supported, how is it configured?

5.7. Are there different fee tiers based on volume?

---

## 6. WEBHOOKS

6.1. What webhook events does InTouch send? (payment success, settlement, withdrawal, refund, reversal, etc.)

6.2. What authentication/signature mechanism is used for webhooks? (basic auth, HMAC, IP whitelist, etc.)

6.3. What retry behavior exists for failed webhook deliveries? (max retries, backoff, etc.)

6.4. What unique event ID should we use for idempotency? (transaction ID, event ID, etc.)

6.5. Is there a webhook for settlement events?

6.6. Is there a webhook for withdrawal events?

6.7. Is there a webhook for refund/reversal events?

6.8. What is the webhook payload format for each event type?

---

## 7. RECONCILIATION

7.1. Is there a settlement report API?

7.2. Is there a transaction report API?

7.3. Is there a balance API?

7.4. Is there a withdrawal report API?

7.5. How should merchants reconcile individual payments against settlements and withdrawals?

7.6. Is there a recommended reconciliation workflow?

7.7. Are there any reconciliation tools or dashboards provided by InTouch?

---

## 8. PRODUCTION

8.1. What production credentials are required? (username, password, account number, API keys, etc.)

8.2. What merchant onboarding/KYC is required before going live?

8.3. What production API endpoints differ from sandbox?

8.4. What rate limits or transaction limits apply in production?

8.5. What currencies are supported in production?

8.6. What production webhook configuration is required? (URL registration, IP whitelist, etc.)

8.7. Is there a production go-live checklist or testing requirement?

8.8. What is the production support process? (SLA, contact methods, etc.)

---

## 9. ADDITIONAL QUESTIONS

9.1. Does InTouch provide a test/sandbox environment for settlement and withdrawal APIs?

9.2. Are there any API versioning considerations? (v1, v2, deprecation, etc.)

9.3. Are there any geographic restrictions? (Rwanda only, EAC, etc.)

9.4. Does InTouch support recurring/subscription payments?

9.5. Does InTouch support partial refunds?

9.6. What is the typical time for a support ticket response?

9.7. Is there a technical documentation portal? If so, what is the URL?

9.8. Is there a developer relations or technical integration support contact?

---

## Response Format

Please format your response as:

```
Question X.Y: [ANSWER]
Status: [VERIFIED / DOCUMENTED / SUPPORT_CONFIRMED / NOT_SUPPORTED / NOT_APPLICABLE]
Evidence: [API endpoint, documentation URL, sample response, or explanation]
```

---

## Contact Information

**From:** ImboniServe Engineering
**Purpose:** Production integration verification for settlement and withdrawal capabilities
**Priority:** Required before production go-live

---

*This questionnaire must be completed before InTouch production settlement behavior can be marked as VERIFIED in the ImboniServe capability matrix.*
