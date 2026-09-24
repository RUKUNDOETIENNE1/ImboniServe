# PAY-002 — RequestDeposit Assessment

| Field | Value |
|---|---|
| Document ID | PAY-002-REQUESTDEPOSIT-ASSESSMENT |
| Date | 2026-08-14 |
| Status | Exploratory — no implementation changes made beyond encoding conformance |

## 1. What the Document Says (Verbatim Facts)

- Section 3.1: "The App (functioning as the client) invokes the RequestDeposit API to initiate a deposit request to a subscriber on Intouchpay (functioning as the server). The intouchpay gateway will then attempt to perform the deposit transaction as per request, and will invoke the App with the response of the deposit request status."
- Section 1: Table 1 labels this capability "Sending Payment" with the description "The App... invokes the RequestDeposit API to initiate a deposit request to a subscriber."
- The request is directed at a `mobilephoneno` — a Mobile Money **subscriber** phone number, exactly the same parameter shape as RequestPayment's target phone, just reversed in money-flow direction.
- Additional optional-looking parameters unique to RequestDeposit: `withdrawcharge` ("Set to 1 to include Withdraw Charges in amount sent to subscriber"), `reason` ("Reason for Sending Payment"), `sid` ("Service ID. Set to 1 For Bulk Payments").
- Success response includes `referenceid` (only present on success) and `responsecode: "2001"`.

**The document describes RequestDeposit as a generic "send money to any Mobile Money subscriber" capability — a payout mechanism, not a specifically-named "merchant withdrawal" or "settlement" API.**

## 2. What the Document Does NOT Say

- It does not state that RequestDeposit is how a merchant withdraws its own accumulated balance from InTouch.
- It does not state that the "subscriber" receiving a deposit can be the merchant's own account/phone number.
- It does not mention "settlement," "merchant balance withdrawal," or any equivalent phrase anywhere in its 15 pages, other than the generic `GetBalance` API (Section 5) which queries "account balance" without specifying whose balance or how it relates to merchant funds.
- It does not describe any linkage between RequestDeposit and the funds InTouch collects on the merchant's behalf via RequestPayment.

**Per the mission's explicit governance instruction, this document alone does NOT establish that RequestDeposit equals merchant settlement/withdrawal. That equivalence is not proven and must not be assumed.**

## 3. Answering the Six Assessment Questions

### 3.1 Is RequestDeposit relevant to ImboniServe?

**Yes, already in active (if defective) use.** `src/pages/api/payments/refunds.ts` calls `InTouchService.requestDeposit()` to send a refund back to a customer's Mobile Money number when a transaction needs to be reversed. This is a legitimate, document-consistent use of the API exactly as documented ("send money to a subscriber") — the subscriber here is the original paying customer.

### 3.2 Could it potentially support business disbursement?

**Architecturally plausible, not established by the document.** If ImboniServe ever needed to pay a business owner directly to their personal Mobile Money number (rather than a bank transfer), RequestDeposit's documented shape (send an amount to a `mobilephoneno`) would technically support that mechanically. Whether InTouch's partner terms *permit* this use case, and whether the "subscriber" can be an arbitrary phone number vs. only certain registered numbers, is UNKNOWN.

### 3.3 Could it potentially support Tap & Leave?

**Only in the refund direction, which is already implemented.** Tap & Leave's forward flow (customer pays the business) uses RequestPayment, not RequestDeposit. RequestDeposit's only relevance to Tap & Leave is reversing a Tap & Leave payment (refund) — which is the existing `refunds.ts` use case (currently defective — see Section 5).

### 3.4 Could it potentially support marketplace/vendor payouts?

**Architecturally plausible, not established.** Same reasoning as 3.2: mechanically, sending funds to a vendor's Mobile Money number fits the documented shape. But nothing in the document confirms InTouch permits or intends RequestDeposit for recurring vendor payout use cases, volume limits for such use, or whether `sid` ("Service ID. Set to 1 For Bulk Payments") is the mechanism InTouch expects partners to use for exactly this kind of batch vendor payout. `sid` is mentioned but never explained beyond that one sentence.

### 3.5 Is this actually a settlement withdrawal mechanism, or simply a separate payment/deposit capability?

**It is documented as a separate payment/deposit capability, not a settlement withdrawal mechanism.** No settlement, merchant balance, or withdrawal-of-collected-funds relationship is described anywhere in the document. Concluding otherwise would be inventing provider behavior the document does not support — explicitly prohibited by this mission's governance rule.

### 3.6 What provider questions must be answered before we can determine this?

See PAY-002-InTouch-Provider-Questions.md, Section "RequestDeposit / Settlement Relationship" for the exact questions. In summary, InTouch must confirm:
1. Whether funds sent via RequestDeposit are drawn from the same "account balance" queried by GetBalance, or a separate pool.
2. Whether RequestDeposit can target the merchant's own registered Mobile Money number (i.e., whether "subscriber" can be the merchant itself).
3. Whether RequestDeposit is rate-limited or fee-structured differently for bulk/recurring payout use vs. one-off refunds.
4. Whether there is a separate, distinctly-named settlement or withdrawal API not covered by this 15-page document.

## 4. Current Codebase Usage of RequestDeposit

| Caller | Purpose | Document-Consistent? |
|---|---|---|
| `src/pages/api/payments/refunds.ts` | Refund a customer's original payment back to their Mobile Money number | ✅ Yes — matches the documented "send money to a subscriber" shape exactly (the subscriber is the original payer) |

No other caller of `InTouchService.requestDeposit()` or `InTouchProvider` (for deposit purposes) exists in the codebase. `MarketerWalletService` and `loyalty.service.ts` (found in an earlier grep) do not call RequestDeposit — they use unrelated internal wallet/balance logic, confirmed by inspection.

## 5. Defect Found (Not Fixed — Out of Scope, Flagged for Separate Remediation)

`src/pages/api/payments/refunds.ts:97`:
```ts
const depositSucceeded = depositResult.responsecode === '200'
```

The document's success code for RequestDeposit is `'2001'` ("Request Successful," Section 3.7), never `'200'`. `'200'` does not appear anywhere in the document's RequestDeposit response-code table. **This means the refund success check can never evaluate to true, even when InTouch actually processes the deposit successfully — every refund would be recorded as failed regardless of the true outcome.**

This is a genuine, unambiguous P0 defect (not a document ambiguity). It is **not fixed under PAY-002** because refunds are not part of the founder's forward Tap & Leave sandbox test contract (Phase 12 of this mission), and Phase 11 restricts this mission's code changes to what is "necessary for correct InTouch sandbox operation" of the payment flow under test. It is tracked prominently in PAY-002-Final-Forensic-Certification.md as a required follow-up before any refund is attempted in sandbox or production.

## 6. Certification

RequestDeposit's encoding now conforms to the document (form-urlencoded, matching Section 3.3's example). Its relationship to merchant settlement/withdrawal remains explicitly unproven and is not assumed. The refund caller's response-code check is a separate, pre-existing, unambiguous defect requiring dedicated remediation before production refund use — it does not block the founder's sandbox payment test.
