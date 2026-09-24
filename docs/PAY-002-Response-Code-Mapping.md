# PAY-002 — Response Code Mapping

| Field | Value |
|---|---|
| Document ID | PAY-002-RESPONSE-CODE-MAPPING |
| Date | 2026-08-14 |

## 1. Critical Structural Finding

**InTouch response codes are NOT globally unique across APIs.** The same numeric code carries different meanings depending on which endpoint returned it. Any code-mapping table that is shared across RequestPayment, RequestDeposit, and GetTransactionStatus without regard to which API produced the code is unsafe. This is proven by direct document evidence (see rows marked "COLLISION" below).

## 2. RequestPayment Response Codes (Document Section 2.9)

| Code | Document Meaning | ImboniServe `isSuccess()` (post-fix) | ImboniServe `isPending()` | Category |
|---|---|---|---|---|
| `1000` | Pending | false | **true** | PENDING |
| `01` | Successfull | **true** | false | SUCCESS |
| `0002` | Missing Username Information | false | false | AUTHENTICATION ERROR |
| `0003` | Missing Password Information | false | false | AUTHENTICATION ERROR |
| `0004` | Missing Date Information | false | false | AUTHENTICATION ERROR |
| `0005` | Invalid Password | false | false | AUTHENTICATION ERROR |
| `0006` | User Does not have an intouchPay Account | false | false | AUTHENTICATION ERROR |
| `0007` | No such user | false | false | AUTHENTICATION ERROR |
| `0008` | Failed to Authenticate | false | false | AUTHENTICATION ERROR |
| `2100` | Amount should be greater than 0 | false | false | VALIDATION ERROR |
| `2200` | Amount below minimum | false | false | VALIDATION ERROR |
| `2300` | Amount above maximum | false | false | VALIDATION ERROR |
| `2400` | Duplicate Transaction ID | false | false | DUPLICATE |
| `2500` | Route Not Found | false | false | FAILED |
| `2600` | Operation Not Allowed | false | false | FAILED |
| `2700` | Failed to Complete Transaction | false | false | FAILED |
| `1005` | Failed Due to Insufficient Funds | false | false | FAILED (subscriber) |
| `1002` | Mobile number not registered on mobile money | false | false | VALIDATION ERROR |
| `1008` | General Failure | false | false | FAILED |
| `1200` | Invalid Number | false | false | VALIDATION ERROR |
| `1100` | Number not supported on this Mobile money network | false | false | VALIDATION ERROR — **COLLISION: `1100` means something different in RequestDeposit (below)** |
| `1300` | Failed to Complete Transaction, Unknown Exception | false | false | FAILED |

**No retry semantics are documented for any of these codes.** The mission brief's phase 5 asks whether codes map to RETRYABLE — the document never states that any code should be retried by the App; it does not distinguish "transient" from "permanent" failures. ImboniServe's own reconciler retries `PENDING`-only codes (`1000`) via polling; it does not automatically retry any error code. This is a deliberate choice, not something the document mandates — flagged INFO.

## 3. RequestDeposit Response Codes (Document Section 3.7)

| Code | Document Meaning | Category | Note |
|---|---|---|---|
| `0002` | Missing Username Information | AUTHENTICATION ERROR | Duplicated from the auth-error block shared with RequestPayment |
| `0003` | Missing Password Information | AUTHENTICATION ERROR | |
| `0004` | Missing Date Information | AUTHENTICATION ERROR | |
| `0005` | Invalid Password | AUTHENTICATION ERROR | |
| `0006` | User Does not have an intouchPay Account | AUTHENTICATION ERROR | |
| `0007` | No such user | AUTHENTICATION ERROR | |
| `0008` | Failed to Authenticate | AUTHENTICATION ERROR | |
| `1100` | **Error in Request** | VALIDATION ERROR | **COLLISION with RequestPayment's `1100` = "Number not supported on this Mobile money network"** |
| `1101` | Service ID not Recognized | VALIDATION ERROR | |
| `1102` | Invalid Mobile Phone Number | VALIDATION ERROR | |
| `1103` | Payment Above Allowed Maximum | VALIDATION ERROR | |
| `1104` | Payment Below Allowed Minimum | VALIDATION ERROR | |
| `1105` | Network Not Supported | VALIDATION ERROR | |
| `1106` | Operation Not Permitted | FAILED | |
| `1107` | Payment Account Not Configured | FAILED | |
| `1108` | Insufficient Account Balance | FAILED (partner) | |
| `1110` | **Duplicate Remit ID** | DUPLICATE | **This is the code that ImboniServe's `isSuccess()` incorrectly treated as a payment success before PAY-002. It is a RequestDeposit-only failure code and does not appear in the RequestPayment or GetTransactionStatus tables at all.** |
| `2001` | Request Successful | **SUCCESS (deposit-context only)** | This is the correct RequestDeposit success code. `refunds.ts` incorrectly compares against `'200'` — see PAY-002-RequestDeposit-Assessment.md Section 5 (not fixed, tracked separately) |
| `2003` | Transaction Not Allowed | FAILED | |
| `2102` | Subscriber Could not be Identified | VALIDATION ERROR | |
| `2105` | Non Existent Mobile Account | VALIDATION ERROR | |
| `2106` | Own Mobile Account Provided | VALIDATION ERROR | |
| `2107` | Invalid Amount Format | VALIDATION ERROR | |
| `2108` | Insufficient Funds on Source Account | FAILED | |
| `2109` | Daily Limit Exceeded | FAILED | |
| `2110` | Source Account Not Active | FAILED | |
| `2111` | Mobile Account Not Active | VALIDATION ERROR | |
| `2000` | General Failure | FAILED | |
| `2500` | Service Failure | FAILED | |
| `2510` | Service Temporarily Unavailable | FAILED — document does not label this RETRYABLE, but the name strongly implies transience | INFO: not treated as retryable by code; would require provider confirmation to safely auto-retry |
| `2518` | Could Not Perform Operation | FAILED | |
| `2520` | Incorrect Account Password | AUTHENTICATION ERROR | |
| `2522` | Invalid Amount | VALIDATION ERROR | |
| `2525` | Resource Not Active | FAILED | |
| `2600` | **Network Failure - Request Timed Out** | FAILED | **COLLISION with RequestPayment's `2600` = "Operation Not Allowed"** |
| `2800` | Deposit Channel Failure | FAILED | |

## 4. GetTransactionStatus Response Codes (Document Section 4.7)

| Code | Document Meaning | ImboniServe `isSuccess()` (post-fix) | ImboniServe `isPending()` | Category |
|---|---|---|---|---|
| `3000` | Missing Transaction ID Information | false | false | VALIDATION ERROR |
| `3200` | Missing Request Transaction ID Information | false | false | VALIDATION ERROR — **also used inconsistently in the document's own 4.6 failure example to mean "Transaction Doesn't Exist" (contradicts this table's 3100). Both interpretations resolve safely to FAILED in current code.** |
| `3100` | Transaction Doesn't Exist | false | false | FAILED |
| `1000` | Transaction Pending | false | **true** | PENDING |
| `01` | **Transaction Successful for Payment Transaction** | **true** | false | SUCCESS (payment) |
| `2001` | **Transaction Successful for Deposit Transaction** | **false** (fixed — was previously `true`) | false | SUCCESS (deposit-context only — never treated as a payment success) |

## 5. GetBalance Response Codes (Document Section 5.7)

| Code | Document Meaning | Category |
|---|---|---|
| `0002` | Missing Username Information | AUTHENTICATION ERROR |
| `0003` | Missing Password Information | AUTHENTICATION ERROR |
| `0004` | Missing Date Information | AUTHENTICATION ERROR |
| `0005` | Invalid Password | AUTHENTICATION ERROR |
| `0006` | User Does not have an intouchPay Account | AUTHENTICATION ERROR |
| `0007` | No such user | AUTHENTICATION ERROR (document's example response body inconsistently shows `"007"` — 3 digits — for this same code; see Forensic Review Section 4, item 6) |
| `0008` | Failed to Authenticate | AUTHENTICATION ERROR |

GetBalance has no documented success response code field at all — its success response (`{"balance": "0.0", "success": true}`) carries no `responsecode` key.

## 6. Full Category Mapping (as requested by mission Phase 5)

| Code | API | Document Meaning | ImboniServe Category |
|---|---|---|---|
| `1000` | RequestPayment / GetTransactionStatus | Pending | PENDING |
| `01` | RequestPayment / GetTransactionStatus | Successful (payment) | SUCCESS |
| `0002` | All | Missing Username | AUTHENTICATION ERROR |
| `0003` | All | Missing Password | AUTHENTICATION ERROR |
| `0004` | All | Missing Date | AUTHENTICATION ERROR |
| `0005` | All | Invalid Password | AUTHENTICATION ERROR |
| `0006` | All | No InTouchPay Account | AUTHENTICATION ERROR |
| `0007` | All | No Such User | AUTHENTICATION ERROR |
| `0008` | All | Failed to Authenticate | AUTHENTICATION ERROR |
| `2100` | RequestPayment | Amount must be > 0 | VALIDATION ERROR |
| `2200` | RequestPayment | Amount below minimum | VALIDATION ERROR |
| `2300` | RequestPayment | Amount above maximum | VALIDATION ERROR |
| `2400` | RequestPayment | Duplicate Transaction ID | DUPLICATE |
| `2500` | RequestPayment | Route Not Found | FAILED |
| `2600` | RequestPayment | Operation Not Allowed | FAILED |
| `2700` | RequestPayment | Failed to Complete | FAILED |
| `1005` | RequestPayment | Insufficient Funds (subscriber) | FAILED |
| `1002` | RequestPayment | Not registered for Mobile Money | VALIDATION ERROR |
| `1008` | RequestPayment | General Failure | FAILED |
| `1200` | RequestPayment | Invalid Number | VALIDATION ERROR |
| `1100` | RequestPayment | Network not supported | VALIDATION ERROR |
| `1300` | RequestPayment | Unknown Exception | FAILED |
| `1100` | RequestDeposit | Error in Request | VALIDATION ERROR |
| `1110` | RequestDeposit | Duplicate Remit ID | DUPLICATE |
| `2001` | RequestDeposit | Request Successful | SUCCESS (deposit-context) |
| `2600` | RequestDeposit | Network Timeout | RETRYABLE (name implies transience; not documented as such) |
| `3000` | GetTransactionStatus | Missing Transaction ID | VALIDATION ERROR |
| `3200` | GetTransactionStatus | Missing Request Transaction ID (per table) / "Doesn't Exist" (per example — contradiction) | VALIDATION ERROR / FAILED |
| `3100` | GetTransactionStatus | Transaction Doesn't Exist | FAILED |
| `2001` | GetTransactionStatus | Successful (deposit) | SUCCESS (deposit-context — never payment) |

## 7. Certification

Every response code appearing in the supplied document has been catalogued and cross-referenced against ImboniServe's code-level handling. The single most important structural finding — that codes collide across APIs with different meanings — is now explicitly documented and the code's `isSuccess()`/`isPending()` helpers are scoped correctly (payment-only) as a direct result of the PAY-002 fix in `InTouchService`.
