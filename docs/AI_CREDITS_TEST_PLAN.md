# AI Credits Platform — Test Plan

## Overview

Comprehensive test coverage for all critical scenarios of the AI Credits Platform.

## Test Categories

### 1. Monthly Allocations

| Test | Description | Expected Result |
|------|-------------|-----------------|
| ALLOC-01 | New business gets wallet with plan allocation | Wallet created with correct monthly allocation |
| ALLOC-02 | Monthly renewal grants credits | Balance increases by monthly allocation |
| ALLOC-03 | Renewal respects max_balance policy | Credits capped at max_balance |
| ALLOC-04 | Plan upgrade changes allocation amount | New allocation amount reflected on next renewal |
| ALLOC-05 | Free plan gets 0 credits | Balance remains 0 |
| ALLOC-06 | Batch renewal processes all due wallets | All due wallets renewed |
| ALLOC-07 | Renewal is idempotent (called twice) | Credits granted only once |

### 2. Credit Purchases

| Test | Description | Expected Result |
|------|-------------|-----------------|
| PURCH-01 | Purchase via package creates payment transaction | Transaction created with correct amount |
| PURCH-02 | Payment success webhook fulfills purchase | Credits added to wallet, ledger entry created |
| PURCH-03 | Duplicate fulfillment is idempotent | Credits not double-granted |
| PURCH-04 | Bonus credits included in package | Both base and bonus credits added |
| PURCH-05 | Invalid package code rejected | 400 error |
| PURCH-06 | Inactive package rejected | 400 error |

### 3. Concurrent Requests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| CONC-01 | Two concurrent reservations on same wallet | Both succeed if sufficient balance |
| CONC-02 | Concurrent reservations exceeding balance | Only one succeeds, other gets InsufficientCreditsError |
| CONC-03 | Concurrent commit and release on different reservations | Both complete without interference |
| CONC-04 | Concurrent purchase fulfillment | Only one fulfillment succeeds (idempotency) |

### 4. Reservation and Rollback

| Test | Description | Expected Result |
|------|-------------|-----------------|
| RESV-01 | Reserve credits creates PENDING reservation | Reservation created, reservedBalance incremented |
| RESV-02 | Commit reservation deducts credits | Balance decremented, reservedBalance decremented |
| RESV-03 | Release reservation returns credits | Balance unchanged, reservedBalance decremented |
| RESV-04 | Expire stale reservation auto-releases | Reservation status = EXPIRED, credits returned |
| RESV-05 | Commit already-committed reservation (idempotent) | Returns original result, no double deduction |
| RESV-06 | Release already-released reservation (idempotent) | Returns success, no error |
| RESV-07 | Commit a released reservation | Throws error |
| RESV-08 | Insufficient credits for reservation | Throws InsufficientCreditsError |

### 5. Failed AI Operations

| Test | Description | Expected Result |
|------|-------------|-----------------|
| FAIL-01 | executeWithCredits with throwing operation | Credits released, error re-thrown |
| FAIL-02 | No ledger CONSUMPTION entry for failed operation | Only RESERVATION_RELEASE entry exists |
| FAIL-03 | Balance unchanged after failed operation | Balance same as before |
| FAIL-04 | ReservedBalance restored after failed operation | reservedBalance decremented |

### 6. Ledger Integrity

| Test | Description | Expected Result |
|------|-------------|-----------------|
| LEDG-01 | Every balance change has a ledger entry | Ledger entries match wallet changes |
| LEDG-02 | balanceAfter == balanceBefore + credits | Mathematical integrity maintained |
| LEDG-03 | Idempotency key prevents duplicates | Second entry with same key returns null |
| LEDG-04 | Ledger entries are ordered by createdAt | Chronological order preserved |
| LEDG-05 | Business ledger pagination works | Correct page/limit/total returned |
| LEDG-06 | Admin search filters work | Results match filter criteria |

### 7. Policy Enforcement

| Test | Description | Expected Result |
|------|-------------|-----------------|
| POL-01 | Max balance policy caps allocation | Credits not granted beyond max |
| POL-02 | Feature restriction blocks non-eligible plan | isFeatureAllowed returns false |
| POL-03 | Plan-specific policy overrides general policy | Plan-specific value returned |
| POL-04 | Inactive policy is ignored | Default/fallback value used |
| POL-05 | Low credit threshold calculation correct | Warning triggered at correct percentage |

### 8. Subscription Changes

| Test | Description | Expected Result |
|------|-------------|-----------------|
| SUB-01 | Plan upgrade changes monthly allocation | New allocation on next renewal |
| SUB-02 | Plan downgrade reduces allocation | New allocation on next renewal |
| SUB-03 | Subscription cancellation stops renewals | No new credits granted |
| SUB-04 | Free trial credits granted | Free trial policy value applied |

### 9. Zero-Credit Businesses

| Test | Description | Expected Result |
|------|-------------|-----------------|
| ZERO-01 | Business with 0 credits cannot reserve | InsufficientCreditsError thrown |
| ZERO-02 | Business with 0 credits gets check failure | checkAICredits returns allowed: false |
| ZERO-03 | Business with 0 credits can still purchase | Purchase flow works normally |
| ZERO-04 | Business with 0 credits receives allocation | Monthly renewal grants credits |

### 10. Large-Volume AI Usage

| Test | Description | Expected Result |
|------|-------------|-----------------|
| VOL-01 | 1000 consecutive consumptions | All succeed, ledger has 1000 entries |
| VOL-02 | Large credit purchase (10,000) | Credits added correctly |
| VOL-03 | Analytics query on large dataset | Returns within reasonable time |
| VOL-04 | Batch renewal of 500+ wallets | All processed without error |

### 11. Analytics Accuracy

| Test | Description | Expected Result |
|------|-------------|-----------------|
| ANAL-01 | Business analytics matches ledger | Usage totals match ledger sums |
| ANAL-02 | Platform analytics aggregates correctly | Totals match sum of all wallets |
| ANAL-03 | Daily trend matches individual entries | Trend data matches ledger by date |
| ANAL-04 | Top features sorted by credits consumed | Correct ordering |
| ANAL-05 | Consumption by plan groups correctly | Plan-level aggregation accurate |

### 12. Administrative Operations

| Test | Description | Expected Result |
|------|-------------|-----------------|
| ADM-01 | Non-admin cannot access admin endpoints | 403 Forbidden |
| ADM-02 | Admin can grant credits | Credits added, ledger entry with ADJUSTMENT type |
| ADM-03 | Admin can revoke credits | Credits removed, ledger entry with ADJUSTMENT type |
| ADM-04 | Cannot revoke more than balance | Error thrown |
| ADM-05 | Admin can update feature cost | Cost updated, cache invalidated |
| ADM-06 | Admin can update policy | Policy updated, cache invalidated |
| ADM-07 | Admin wallet list pagination works | Correct page/limit/total |
| ADM-08 | Admin ledger search filters work | Results match criteria |

## Test Implementation

Tests should be implemented using the project's existing test framework. Key principles:

1. **Setup:** Create test businesses with wallets, seed feature costs and policies
2. **Teardown:** Clean up test data after each test
3. **Isolation:** Each test should be independent and not rely on state from other tests
4. **Mocking:** Mock external AI providers (OpenAI) but use real database for credit operations
5. **Assertions:** Verify both return values and database state (ledger entries, wallet balances)

## Running Tests

```bash
# Run all credit platform tests
npm test -- --grep "credits"

# Run specific category
npm test -- --grep "LEDG"
npm test -- --grep "RESV"
npm test -- --grep "CONC"
```
