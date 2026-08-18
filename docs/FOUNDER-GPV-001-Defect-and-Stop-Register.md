# FOUNDER-GPV-001 — Defect and Stop Register

| Field | Value |
|---|---|
| Document ID | FOUNDER-GPV-001-DEFECT-STOP-REGISTER |
| Date | 2026-08-14 |
| Source | Forensic discovery of actual repository |

## Defect Register

### Defects Found During Forensic Discovery

| ID | Severity | Category | Description | Impact | Status | Fix Required Before GPV? |
|---|---|---|---|---|---|---|
| FGPV-D001 | P1 | MISSING PAGE | `/order/receipt` page does not exist | After Tap & Leave payment, guest is redirected to `/order/receipt?sessionId=...` which returns 404. Guest cannot view receipt after payment. | OPEN | YES — must be created before Tap & Leave can complete end-to-end |
| FGPV-D002 | FOUNDER-ACTION | CONFIG | `INTOUCH_WEBHOOK_USERNAME` missing from `.env` | Webhook returns 503 — payment callbacks fail | OPEN | YES — founder must set in `.env` |
| FGPV-D003 | FOUNDER-ACTION | CONFIG | `INTOUCH_WEBHOOK_PASSWORD` missing from `.env` | Webhook returns 503 — payment callbacks fail | OPEN | YES — founder must set in `.env` |
| FGPV-D004 | FOUNDER-ACTION | CONFIG | `PAYMENTS_PROVIDER` set to "irembo" instead of "intouch" | Payment routing may use wrong provider | OPEN | YES — founder must change to "intouch" |
| FGPV-D005 | FOUNDER-ACTION | CONFIG | `INTOUCH_CALLBACK_URL` missing from `.env` | InTouch doesn't know where to send callbacks | OPEN | YES — founder must set to ngrok URL |
| FGPV-D006 | KNOWN LIMITATION | MOCK DATA | Supplier portal (`/dashboard/supplier-portal`) uses hardcoded mock data | Supplier management is non-functional. No real CRUD API exists. | DOCUMENTED | NO — not a blocker for Customer #1 |
| FGPV-D007 | ENVIRONMENT | TUNNEL | Webhook tunnel (ngrok) required for localhost InTouch callbacks | InTouch cannot reach localhost webhook without tunnel | OPEN | YES — founder must set up ngrok |
| FGPV-D008 | ENVIRONMENT | ACCESS | Local only — no remote URL for phone QR testing | Founder cannot test QR from phone on different network | DOCUMENTED | NO — workaround: same local network |

### Defect Severity Definitions

| Severity | Meaning |
|---|---|
| P0 | Critical — blocks all testing |
| P1 | High — blocks a key user journey |
| P2 | Medium — degrades experience but workaround exists |
| FOUNDER-ACTION | Configuration issue that founder must resolve |
| ENVIRONMENT | Environment limitation requiring setup |
| KNOWN LIMITATION | Documented limitation, not a defect to fix now |

### Previously Remediated Defects (from GPV-001)

These were found and fixed in prior GPV-001 cycle — listed for reference:

| ID | Severity | Description | Status |
|---|---|---|---|
| GPV-D001 | P0 | Prisma schema drift: pendingToken field missing | REMEDIATED |
| GPV-D009 | P2 | Tax config mismatch: isInclusive vs taxMode | REMEDIATED |
| GPV-D010 | P1 | Dashboard revenue shows 0 for paid orders | REMEDIATED |
| GPV-D011 | P2 | Close-day Z-Report GET: invalid `date` field | REMEDIATED |
| GPV-D012 | P1 | PATCH /api/reservations/[id] bypasses domain logic | REMEDIATED |
| GPV-D013 | P1 | BigInt serialization error in supplier orders API | REMEDIATED |

---

## Stop Conditions

### Universal Stop Conditions

The founder should STOP the guided session immediately when any of these conditions occur:

| # | Condition | Why It's Critical | Action |
|---|---|---|---|
| SC-01 | Financial variance ≠ 0 | Financial truth is violated — revenue numbers cannot be trusted | STOP → capture Z-Report → report → diagnose → fix → re-test |
| SC-02 | Cross-business isolation fails | One business can see another's data — security breach | STOP → capture evidence → report → diagnose → fix |
| SC-03 | Unauthorized role access succeeds | A role can access functions they shouldn't — security breach | STOP → capture evidence → report → diagnose → fix |
| SC-04 | Payment creates incorrect financial records | Financial integrity compromised | STOP → capture transaction → report → diagnose → fix |
| SC-05 | Critical data disappears | Data loss — unrecoverable without backup | STOP → report immediately → restore from backup if needed |
| SC-06 | Duplicate financial effect occurs | One payment creates two ledger entries — financial integrity | STOP → capture ledger entries → report → diagnose idempotency |
| SC-07 | Production credentials unexpectedly required | Sandbox should not need production credentials | STOP → check configuration → do NOT enter production credentials |
| SC-08 | External provider behaves unexpectedly | InTouch sandbox behaves differently than documented | STOP → document behavior → contact InTouch support |
| SC-09 | P0/P1 defect appears | Critical or high severity defect blocks testing | STOP → document defect → assess fix vs. workaround |
| SC-10 | Security boundary is violated | Any security check is bypassed | STOP → capture evidence → report → diagnose → fix |
| SC-11 | Invalid QR grants access | QR security bypassed | STOP → check HMAC validation → fix immediately |
| SC-12 | Session persists after logout | Session management failure | STOP → check NextAuth configuration → fix |
| SC-13 | Double-close day succeeds | Data integrity violation | STOP → check audit log → fix close-day logic |
| SC-14 | Failed payment creates revenue | Financial truth violated | STOP → check PaymentCompletionService → fix |

### Stop Condition Response Protocol

When a stop condition is triggered:

```
STOP
  │
  ▼
CAPTURE EVIDENCE
  │  - Screenshot of the issue
  │  - Note the exact step (FGPV-XXX)
  │  - Note the expected vs. actual behavior
  │  - Save any error messages
  │
  ▼
REPORT
  │  - Report to the guided test conductor
  │  - Document in the defect register
  │
  ▼
DIAGNOSE
  │  - Identify root cause
  │  - Check server logs
  │  - Check API responses
  │  - Check database state
  │
  ▼
FIX / CONFIGURE
  │  - Apply fix or configuration change
  │  - Do NOT make unrelated changes
  │
  ▼
REGRESSION TEST
  │  - Re-run the failing step
  │  - Verify the fix works
  │  - Check for side effects
  │
  ▼
RETURN TO LAST SAFE CHECKPOINT
  │  - Resume from the last passing step
  │  - Do NOT skip the failed step
```

### Non-Stop Conditions (Continue Despite These)

| Condition | Why It's Not a Stop | Action |
|---|---|---|
| Receipt page 404 (FGPV-D001) | Known defect — payment itself succeeded | Document and continue to financial verification |
| Supplier portal shows mock data (FGPV-D006) | Known limitation — not part of core journey | Document and skip supplier testing |
| Pusher not connected | Polling fallback exists | Continue — real-time updates may be delayed |
| Twilio notification not sent | Non-critical for core flow | Continue — check Twilio config separately |
| AI features unavailable | Not part of core business loop | Continue — test AI features separately |
| Analytics page empty | Requires more data | Continue — revisit after more transactions |

---

## Defect Tracking

### Open Defects Requiring Fix Before GPV

| ID | Action Required | Who | Priority |
|---|---|---|---|
| FGPV-D001 | Create `/order/receipt` page | Engineering | HIGH — blocks Tap & Leave completion |
| FGPV-D002 | Set `INTOUCH_WEBHOOK_USERNAME` in `.env` | Founder | HIGH — blocks payment webhook |
| FGPV-D003 | Set `INTOUCH_WEBHOOK_PASSWORD` in `.env` | Founder | HIGH — blocks payment webhook |
| FGPV-D004 | Change `PAYMENTS_PROVIDER` to "intouch" in `.env` | Founder | HIGH — blocks correct payment routing |
| FGPV-D005 | Set `INTOUCH_CALLBACK_URL` in `.env` | Founder | HIGH — blocks webhook delivery |
| FGPV-D007 | Set up ngrok tunnel | Founder | HIGH — blocks localhost webhook |

### Open Defects NOT Requiring Fix Before GPV

| ID | Action | When |
|---|---|---|
| FGPV-D006 | Build real supplier portal backend | Future implementation |
| FGPV-D008 | Deploy to remote server | When production authorized |
