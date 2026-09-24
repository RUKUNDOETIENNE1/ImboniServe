# Release Gates

This document tracks critical validation and testing requirements that must be completed before production deployment.

## 🔴 BLOCKER: InTouch Sandbox Validation (Not Started)

**Status:** Pending - Validation tooling complete, execution deferred  
**Owner:** TBD  
**Estimated Time:** 2-4 hours  
**Priority:** Must complete before production deployment

### Validation Tooling (Ready)
- ✅ Integration test harness (`tests/integration/payment-lifecycle.test.ts`)
- ✅ Validation script (`scripts/intouch/collect-validation-artifacts.ts`)
- ✅ Documentation (`docs/intouch-sandbox-validation.md`)
- ✅ BillingEvent ledger
- ✅ Webhook Basic Auth enforcement
- ✅ Audit logging
- ✅ Provider metadata capture

### Required Test Scenarios

#### Success Scenarios
- [ ] MTN Mobile Money payment success
  - [ ] Payment initiation
  - [ ] Customer approval on phone
  - [ ] Webhook delivery
  - [ ] PaymentTransaction: PENDING → PROCESSING → SUCCESS
  - [ ] BillingEvent entries created
  - [ ] Subscription activated automatically
  - [ ] Audit logs generated
- [ ] Airtel Money payment success
  - [ ] Same validation as MTN

#### Failure Scenarios
- [ ] Invalid phone number
  - [ ] Provider error response
  - [ ] Transaction marked FAILED
  - [ ] No subscription activation
- [ ] User rejection on phone
  - [ ] Webhook with failed status
  - [ ] Transaction marked FAILED
  - [ ] BillingEvent logged
- [ ] Payment timeout
  - [ ] Transaction remains PROCESSING
  - [ ] No subscription activation
- [ ] Duplicate webhook
  - [ ] Second webhook ignored (idempotent)
  - [ ] No duplicate subscription
  - [ ] Logged as duplicate in audit
- [ ] Invalid webhook credentials
  - [ ] 401 Unauthorized response
  - [ ] Webhook rejected
- [ ] Delayed webhook (>30s)
  - [ ] Transaction remains PROCESSING
  - [ ] Webhook eventually arrives
  - [ ] Status updated correctly
- [ ] Verification before webhook
  - [ ] Manual status check returns PROCESSING
  - [ ] Webhook arrives later
  - [ ] Status synchronized

### Validation Report Requirements

For each scenario, capture:
- Request payload sent to InTouch (sanitized)
- Provider response at initiation
- Webhook payload received
- Database records (PaymentTransaction, Subscription, BillingEvent)
- Status transitions with timestamps
- Edge cases or unexpected behavior

### Execution Instructions

1. Configure sandbox environment variables
2. Run test scenarios one by one
3. For each scenario, execute:
   ```bash
   npx tsx scripts/intouch/collect-validation-artifacts.ts --id=<txId>
   ```
4. Compile validation report with all artifacts
5. Document any issues or edge cases
6. Update this checklist

### Success Criteria

- All success scenarios pass
- All failure scenarios handled gracefully
- No data corruption or orphaned records
- BillingEvent ledger complete and accurate
- Subscription activation reliable
- Webhook security enforced
- Provider responses documented

---

## 🟡 IremboPay Validation (Not Started)

**Status:** Pending implementation  
**Dependencies:** IremboPay provider implementation  

Same validation requirements as InTouch but for card payments.

---

## 🟢 Integration Tests (Completed)

**Status:** ✅ All 7 tests passing  
**Last Run:** June 1, 2026  
**Coverage:**
- Payment lifecycle (success, failure)
- Duplicate webhook handling
- Delayed webhook handling
- Subscription renewal
- Subscription cancellation
- Billing event ledger

---

## Future Release Gates

### Before Public Beta
- [ ] InTouch sandbox validation complete
- [ ] IremboPay sandbox validation complete
- [ ] Load testing (100 concurrent payments)
- [ ] Security audit (webhook security, auth)
- [ ] Disaster recovery plan documented

### Before Production
- [ ] All beta gates passed
- [ ] Production credentials configured
- [ ] Monitoring and alerting active
- [ ] Incident response plan documented
- [ ] Customer support trained on payment issues
- [ ] Refund process documented and tested

---

## Notes

- Validation tooling is production-ready but execution is deferred
- Do not remove or refactor validation scripts/tests
- Keep validation documentation up to date as system evolves
- Sandbox validation is a release gate, not a development blocker
