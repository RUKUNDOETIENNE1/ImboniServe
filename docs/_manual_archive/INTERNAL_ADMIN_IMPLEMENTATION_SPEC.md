# Internal Admin Implementation Spec (Serve)

**Goal:** Provide Master Admin monitoring and control without touching user-facing workflows.

**Key constraints:**
- No changes to existing user APIs or workflows
- Dedicated internal namespace
- Prisma + NextAuth compatible
- Business/branch terminology only

---

## 1) Namespace & File Layout
**Location:** `src/pages/api/internal-admin/`

```
/internal-admin/
  ├─ organizations.ts
  ├─ revenue-summary.ts
  ├─ suspend-business.ts
  ├─ force-logout.ts
  ├─ system-health.ts
  └─ _middleware/
       └─ verifyInternalAdmin.ts
```

**Rationale:** completely isolated from user APIs. No impact on existing flows.

---

## 2) Authentication & Security
### Environment Variable
```
IMBONI_INTERNAL_ADMIN_KEY=super_secure_random_key
```

### Request Header
```
Authorization: Bearer <IMBONI_INTERNAL_ADMIN_KEY>
```

### Required Protections
1. **API key verification** (middleware)
2. **IP allowlist** (Master Admin servers only)
3. **Rate limiting** (100 req/min/IP)
4. **Audit logging** (every call)

> **Non-negotiable:** Internal routes must never be exposed to public UI or client usage.

---

## 3) Data Access Layer (Prisma)
Serve uses **Prisma + Postgres**. All internal admin routes query the database via Prisma (not Supabase).

**Entity mapping:**
| Proposed | Serve Model |
|---------|-------------|
| Organization | **Business** |
| Users | **User** |
| Subscription | **Subscription** |

---

## 4) Endpoints & Behavior

### 4.1 GET `/internal-admin/organizations`
**Purpose:** Aggregate business metadata.

**Returns:**
- `id`
- `name`
- `subscriptionPlan`
- `subscriptionStatus`
- `createdAt`
- `lastActiveAt` *(optional; add field if needed)*

**Data Source:** `Business` + `Subscription`

**Notes:**
- If `lastActiveAt` does not exist, omit or add field to track last activity.

---

### 4.2 GET `/internal-admin/revenue-summary`
**Purpose:** Aggregate active subscription revenue.

**Returns:**
- `activeSubscriptions`
- `monthlyRevenue`
- Optional: `mrrByPlan`, `totalBusinesses`

**Data Source:** `Subscription` (status = ACTIVE)

---

### 4.3 POST `/internal-admin/suspend-business`
**Purpose:** Non-disruptive suspension.

**Request:**
```json
{ "businessId": "..." }
```

**Behavior:**
- Updates subscription status to `SUSPENDED`
- **No changes** to orders, inventory, or business logic

**Data Source:** `Subscription` or `Business.isActive` (choose one strategy)

---

### 4.4 POST `/internal-admin/force-logout`
**Purpose:** Invalidate all active sessions for a business.

**Request:**
```json
{ "businessId": "..." }
```

**Correct Implementation (NextAuth):**
- Fetch users in business
- Delete their **NextAuth sessions**

**Data Source:** `User`, `Session`

> Supabase `invalidateUserById` is **not compatible** with Serve.

---

### 4.5 GET `/internal-admin/system-health`
**Purpose:** Report platform health metrics for Master Admin.

**Returns:**
- `apiResponseTimeMs`
- `dbStatus`
- `errorRate`
- `uptime`

**Data Source:**
- DB ping via Prisma
- In-process metrics
- Log aggregation if available

---

## 5) Audit Logging (Required)
Add new table/model `InternalAdminAuditLog` with:
- `id`
- `action`
- `businessId` (nullable)
- `adminKeyHash` (never store raw key)
- `ipAddress`
- `userAgent`
- `status`
- `createdAt`
- `metadata` (JSON)

Every internal-admin call writes an audit record.

---

## 6) Optional: Scheduled Sync
Master Admin can pull data every 5–15 minutes and store in its own DB.

**Benefits:**
- Reduces load on Serve
- Improves safety isolation
- Supports analytics without real-time dependency

---

## 7) Security Checklist
- [ ] API key verification enabled
- [ ] IP allowlist enabled
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Aggregated data only
- [ ] No PII leakage

---

## 8) Implementation Order (Low Risk)
1. Add internal-admin middleware
2. Add audit log model
3. Implement `organizations` + `revenue-summary`
4. Implement `suspend-business`
5. Implement `force-logout`
6. Implement `system-health`
7. Configure Master Admin polling

---

## 9) Acceptance Criteria
- All endpoints isolated under `/internal-admin/`
- API key auth enforced
- Works with Prisma + NextAuth
- No change to existing app flows
- Full audit logging available

---

**Status:** Ready for build after approval
