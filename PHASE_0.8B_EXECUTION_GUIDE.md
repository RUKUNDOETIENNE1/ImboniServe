# Phase 0.8B — Infrastructure Truth & Operational Governance

## 🎯 OBJECTIVE

Answer one question: **"Does production infrastructure match what the code believes exists?"**

**This is a READ-ONLY audit phase. No code changes. No deployments. No migrations.**

---

## 📋 EXECUTION STEPS

### PHASE 0.8B.1 — ENVIRONMENT VARIABLE GOVERNANCE

#### Step 1: Run Environment Audit

```bash
npx tsx scripts/audit-environment-variables.ts
```

**Output**: `environment-truth.json`

**What it discovers**:
- All environment variables used in code
- Variables in `.env.example`
- Variables in `.env` (actual)
- Missing variables (in code but not in example)
- Unused variables (in example but not in code)
- Public vs secret variables
- Variable categories (database, auth, payment, messaging, etc.)

**Duration**: ~2 minutes

---

### PHASE 0.8B.2 — PAYMENT PROVIDER TRUTH

#### Step 2: Run Payment Provider Audit

```bash
npx tsx scripts/audit-payment-providers.ts
```

**Output**: `payment-provider-truth.json`

**What it discovers**:
- InTouch configuration status
- IremboPay configuration status
- Required vs actual environment variables
- Webhook URLs
- Callback URLs
- Sandbox vs production environment
- MTN/Airtel routing assumptions
- Code references to each provider

**Duration**: ~3 minutes

---

### PHASE 0.8B.3 — REDIS & QUEUE GOVERNANCE

#### Step 3: Run Redis & Queue Audit

```bash
npx tsx scripts/audit-redis-queue.ts
```

**Output**: `redis-governance.json`

**What it discovers**:
- Redis URL configuration
- TLS enabled/disabled
- Certificate validation (rejectUnauthorized)
- All BullMQ queue names
- Queue workers
- Dead letter queue handling
- Retry policies
- Alerting configuration
- Security findings

**Duration**: ~2 minutes

---

### PHASE 0.8B.4 — CRON & WATCHDOG GOVERNANCE

#### Step 4: Run Scheduler Audit

```bash
npx tsx scripts/audit-schedulers.ts
```

**Output**: `scheduler-governance.json`

**What it discovers**:
- Vercel Cron jobs (from vercel.json)
- Node Cron jobs (node-cron library)
- BullMQ scheduled jobs
- Watchdog jobs
- Reconciliation jobs
- Execution method for each job
- Expected frequency
- Error handling, logging, alerting
- Risk level for each job

**Duration**: ~2 minutes

---

### PHASE 0.8B.5 — WEBHOOK GOVERNANCE

#### Step 5: Run Webhook Audit

```bash
npx tsx scripts/audit-webhooks.ts
```

**Output**: `webhook-governance.json`

**What it discovers**:
- All webhook endpoints
- Provider for each webhook
- HTTP methods (GET/POST)
- Signature validation
- Replay protection
- Idempotency
- Basic auth
- Error handling
- Logging and alerting
- Environment variables used
- Risk level for each webhook

**Duration**: ~2 minutes

---

## 🚀 QUICK START

### Run All Audits at Once

```bash
# Run all infrastructure audits
npx tsx scripts/audit-environment-variables.ts && \
npx tsx scripts/audit-payment-providers.ts && \
npx tsx scripts/audit-redis-queue.ts && \
npx tsx scripts/audit-schedulers.ts && \
npx tsx scripts/audit-webhooks.ts
```

**Total Duration**: ~11 minutes

---

## 📊 EXPECTED OUTPUTS

After running all audits, you will have:

1. **`environment-truth.json`** - Environment variable inventory
2. **`payment-provider-truth.json`** - Payment provider configuration
3. **`redis-governance.json`** - Redis and queue configuration
4. **`scheduler-governance.json`** - Scheduled job inventory
5. **`webhook-governance.json`** - Webhook endpoint inventory

---

## 📝 REPORT GENERATION

After all audits complete, I will generate:

### 1. `ENVIRONMENT_TRUTH_REPORT.md`
**Classification**:
- 🟢 **GREEN**: Present and valid
- 🟡 **YELLOW**: Present but suspicious
- 🔴 **RED**: Missing or broken

**Contents**:
- Required variables inventory
- Actually configured variables
- Missing variables
- Unused variables
- Duplicated variables
- Secrets still referenced in code

---

### 2. `PAYMENT_PROVIDER_TRUTH_REPORT.md`
**Status for each provider**:
- ✅ Configured
- ⚠️ Partially configured
- ❓ Unknown
- 🚨 Broken

**Contents**:
- InTouch configuration audit
- IremboPay configuration audit
- MTN routing assumptions
- Webhook URLs
- Callback URLs
- Refund endpoints
- Sandbox vs production

---

### 3. `REDIS_GOVERNANCE_REPORT.md`
**Contents**:
- Redis URL verification
- TLS enabled/disabled
- Certificate validation status
- Queue names inventory
- BullMQ workers inventory
- Dead letter handling
- Retry policies
- Alerting assumptions
- Security findings

---

### 4. `SCHEDULER_GOVERNANCE_REPORT.md`
**Contents**:
- Cron jobs inventory
- Scheduled jobs inventory
- Reconciliation jobs
- Watchdog jobs
- Execution method (Vercel/Node/BullMQ)
- Expected frequency
- Actual frequency (if determinable)
- Risk level for each job

---

### 5. `WEBHOOK_GOVERNANCE_REPORT.md`
**Contents**:
- Webhook inventory (InTouch, IremboPay, WhatsApp, etc.)
- Route for each webhook
- Signature validation status
- Environment variables used
- Replay protection
- Idempotency
- Logging
- Risk classification

---

### 6. `OPERATIONAL_READINESS_REPORT.md`
**Scores** (0-100):
- Environment Governance Score
- Payment Governance Score
- Webhook Governance Score
- Queue Governance Score
- Scheduler Governance Score
- **Overall Operational Readiness Score**

**GO/NO-GO Decision**: Based on overall score

---

## ✅ SUCCESS CRITERIA

At completion, we must know:

1. ✅ What production infrastructure exists
2. ✅ What the code assumes exists
3. ✅ Where they differ
4. ✅ What can break payments
5. ✅ What can break reconciliation
6. ✅ What can break watchdog monitoring

---

## 🚨 CRITICAL NOTES

### No Code Changes

**This phase makes ZERO code changes** except:
- Audit scripts (read-only)
- Documentation files (markdown reports)

**No modifications to**:
- Environment variables
- Payment provider configuration
- Redis configuration
- Cron jobs
- Webhooks
- Application code

---

### Lint Errors Expected

The audit scripts use `glob` which may show TypeScript lint errors:
```
Could not find a declaration file for module 'glob'
```

**This is expected and safe**. The scripts run with `tsx` which handles this correctly.

**To fix** (optional):
```bash
npm install --save-dev @types/glob
```

---

## 🎯 AFTER AUDITS COMPLETE

### Review JSON Files

```bash
# View environment audit
cat environment-truth.json | jq '.'

# View payment provider audit
cat payment-provider-truth.json | jq '.'

# View Redis audit
cat redis-governance.json | jq '.'

# View scheduler audit
cat scheduler-governance.json | jq '.'

# View webhook audit
cat webhook-governance.json | jq '.'
```

### Wait for Report Generation

I will parse all JSON files and generate comprehensive markdown reports with:
- Summary statistics
- Detailed findings
- Risk classifications
- Recommendations
- Overall readiness score

---

## 📈 EXPECTED FINDINGS

### Environment Variables
- Missing variables (in code but not documented)
- Unused variables (documented but not used)
- Secret variables exposed
- Duplicated variables

### Payment Providers
- Partially configured providers
- Missing webhook URLs
- Sandbox vs production mismatches
- Missing authentication credentials

### Redis & Queues
- TLS configuration issues
- Certificate validation disabled
- Missing dead letter queues
- Missing retry policies

### Schedulers
- Unknown execution methods
- Missing error handling
- Missing logging
- Missing alerting

### Webhooks
- Missing signature validation
- Missing idempotency
- Missing replay protection
- Returning 200 on errors

---

## 🚀 READY TO EXECUTE

**Run all audits:**

```bash
npx tsx scripts/audit-environment-variables.ts && \
npx tsx scripts/audit-payment-providers.ts && \
npx tsx scripts/audit-redis-queue.ts && \
npx tsx scripts/audit-schedulers.ts && \
npx tsx scripts/audit-webhooks.ts
```

**After completion, I will generate all governance reports and calculate the operational readiness score.**

---

**This is a READ-ONLY audit. No implementations. No fixes. Findings only.**
