# PAY-002 — InTouch Provider Questions (Final Prioritized List)

| Field | Value |
|---|---|
| Document ID | PAY-002-INTOUCH-PROVIDER-QUESTIONS |
| Date | 2026-08-14 |
| Purpose | Ready to send to InTouch support/technical contact |
| Supersedes | `MPCA-001B-InTouch-Verification-Questionnaire.md` (not discarded — that questionnaire's settlement/withdrawal/production sections remain fully valid and are referenced, not duplicated, below) |

## Priority 1 — Blocks the Founder's Sandbox Payment Test

1. **Phone number field name:** Your documentation's RequestPayment example (Section 2.3) uses the key `mobilephone`, but the parameter table immediately below it (Section 2.5) names the same field `mobilephoneno`. Which field name does your server actually parse? Does it accept both?
2. **`requesttransactionid` format constraints:** Your examples use bare numeric strings (e.g. `'34555'`, `'4522233'`). Does your server accept alphanumeric IDs containing hyphens or underscores (e.g. `IMBONI-abc123-1234567890`)? Is there a maximum length?
3. **Sandbox test subscriber:** For our test account (username `testa`, account `123456`), is there a specific Mobile Money test phone number and PIN we should use to reliably trigger the USSD approval flow in sandbox, or should we use a real MTN/Airtel number with test balance?
4. **Sandbox vs. production host:** Is `https://www.intouchpay.co.rw/api` the correct sandbox endpoint for account `testa`, or is a different `IP:Port` assigned to us for sandbox testing, per your documentation's statement "Contact carriers to obtain the IP address and port number"?

## Priority 2 — Blocks Webhook Verification

5. **Basic Auth variant:** Your documentation (Section 2.7) shows two ways you may deliver the payment-completion callback: with HTTP Basic Auth and without it. Which variant will be sent to our registered callback URL for account `testa`? Is this configurable on our end (e.g. via a partner portal setting), or determined by InTouch?
6. **Failure/cancelled callback payload shape:** Your documentation only shows a successful completion callback example (`responsecode: '01'`, `status: 'Successfull'`). What does the callback payload look like for a failed, cancelled, or timed-out payment? Specifically, what `status` string and `responsecode` values should we expect?
7. **Webhook retry policy:** If our endpoint is temporarily unreachable or returns a non-200 response, does InTouch retry delivery? If so, how many times, over what time window, and with what backoff?
8. **Webhook idempotency key:** Is there a unique event identifier (distinct from `transactionid`/`requesttransactionid`) we should use to detect duplicate webhook deliveries at the event level, or should we rely solely on `transactionid`?
9. **Acknowledgment response validation:** Your documentation (Section 2.8) specifies our server should respond `{"message": "success", "success": true, "request_id": "..."}`. Does your system validate this response body, and does a mismatched/missing field trigger a retry?

## Priority 3 — Blocks Settlement/Funds-Availability Understanding

10. **GetBalance scope:** Your `getbalance` endpoint (Section 5) returns a `balance` field. Does this represent funds we (the merchant/partner) can withdraw, or an operational account balance used for a different purpose (e.g. a prepaid float for RequestDeposit)?
11. **Funds availability timing:** After a RequestPayment transaction reaches `responsecode: '01'` (successful), when do the corresponding funds become available to us? Immediately? T+1? On a settlement schedule?
12. **Relationship between RequestPayment collections and RequestDeposit funds:** Can funds collected via RequestPayment be sent back out via RequestDeposit (e.g., to fund a merchant payout), or are these two separate balances/flows?
13. See also `MPCA-001B-InTouch-Verification-Questionnaire.md` Sections 3 and 4 (Withdrawal, Settlement) — every question there remains open; the supplied document does not address settlement or withdrawal at all.

## Priority 4 — Blocks Reconciliation

14. **Transaction history / statement export:** Is there an API or portal to download a full transaction history for our account, for reconciliation against our internal ledger?
15. **GetTransactionStatus code `3200` disambiguation:** Your own documentation is internally inconsistent — Section 4.6's worked failure example shows `responsecode: "3200"` for "Transaction Doesn't Exist," but Section 4.7's code table maps `3200` to "Missing Request Transaction ID Information" and `3100` to "Transaction Doesn't Exist." Which is correct?
16. **`referenceno` (webhook) vs. `referenceid` (RequestDeposit) relationship:** Are these the same concept with inconsistent naming across your documentation, or genuinely distinct identifiers? What should we use each for in reconciliation?

## Priority 5 — Blocks Production Activation

17. See `MPCA-001B-InTouch-Verification-Questionnaire.md` Section 8 (Production) in full — merchant onboarding/KYC, production credential provisioning, production endpoint differences, rate limits, and go-live checklist remain entirely unanswered by the supplied document.
18. **Minimum/maximum transaction amounts:** Your response codes `2200`/`2300` (RequestPayment) and `1103`/`1104` (RequestDeposit) confirm amount limits exist. What are the actual numeric values, in RWF, for both sandbox and production?
19. **Gateway fee:** What percentage or fixed fee does InTouch charge per successful RequestPayment transaction, and is it deducted before or after funds reach our account?

## Priority 6 — Blocks Tap & Leave / Future Disbursement Capabilities

20. **Is RequestDeposit intended for merchant-initiated payouts to arbitrary Mobile Money subscribers** (e.g. staff tips, vendor payments, customer refunds), or is its use restricted to specific documented scenarios? Are there volume/frequency limits for this use case distinct from one-off refunds?
21. **Can a RequestDeposit target our own merchant-registered phone number** (i.e., can "the subscriber" be us), or does your system reject self-targeted deposits (note: your own response code `2106` is literally named "Own Mobile Account Provided" and appears to be a rejection code — please confirm this interpretation)?
22. **`sid` (Service ID) parameter:** Your documentation states "Set to 1 For Bulk Payments" but does not otherwise explain this field. What service IDs exist, and what changes in behavior, fees, or limits apply to bulk-payment-flagged RequestDeposit calls?
23. **`withdrawcharge` parameter:** Your documentation states "Set to 1 to include Withdraw Charges in amount sent to subscriber." What is the actual charge amount/percentage, and is it merchant-configurable or fixed?

## Reconciliation with PAY-001's Original 26 Unanswered Questions

Every question in `PAY-001-InTouch-Questions-and-Evidence-Register.md` that remains unanswered after PAY-002 (26 of 41 — see `PAY-002-PAY001-Question-Reconciliation.md` Section 9) is preserved above, either verbatim or reworded with terminology now available from the supplied document (e.g., "paymentstatus" corrected to "GetTransactionStatus" throughout). No question has been dropped.

## Response Format Requested

Please answer in the same structured format as `MPCA-001B-InTouch-Verification-Questionnaire.md`:
```
Question #: [ANSWER]
Status: [VERIFIED / DOCUMENTED / SUPPORT_CONFIRMED / NOT_SUPPORTED / NOT_APPLICABLE]
Evidence: [API endpoint, documentation URL, sample response, or explanation]
```
