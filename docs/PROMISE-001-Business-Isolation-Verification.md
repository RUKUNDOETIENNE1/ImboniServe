# PROMISE-001 — Business Isolation Verification

**Document:** PROMISE-001-Business-Isolation-Verification.md
**Phase:** PROMISE-001 — ImboniServe Promise Engine™ Integration, Simulation & Operational Certification
**Date:** 2026-08-13
**Status:** VERIFIED

---

## 1. Purpose

Verify that Business A can never see Business B's promises, risks, statistics, events, or dashboard data.

---

## 2. Isolation Mechanisms

### 2.1 PromiseEngine Service Layer

All PromiseEngine methods are scoped by `businessId`:

| Method | Isolation |
|--------|-----------|
| `createOrUpdatePromise(input)` | Stores `input.businessId` in promise record |
| `evaluateOne(promiseId, now?)` | Reads `businessId` from promise record for Heart Pulse channel |
| `evaluateActivePromises(businessId?, now?)` | Optional `businessId` filter in WHERE clause |
| `getActiveRisks(businessId)` | **Required** `businessId` in WHERE clause |

### 2.2 API Layer

Both service-risks API endpoints use `resolveBusinessContext(req, res)`:

**File:** `src/lib/api/business-context.ts`

```typescript
export async function resolveBusinessContext(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<BusinessContext | null> {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }
  // ... extracts businessId from session
}
```

- Returns 401 if no session (unauthenticated)
- Extracts `businessId` from the authenticated user's session
- All Prisma queries use this `businessId` in their WHERE clause

### 2.3 Dashboard Layer

**File:** `src/pages/dashboard/operations/service-risks.tsx`

```typescript
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  const roles: string[] = (session.user as any).roles || []
  if (!roles.some(r => ALLOWED_ROLES.has(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return {
    props: {
      businessId: (session.user as any).businessId || '',
      // ...
    },
  }
}
```

- Redirects to login if unauthenticated
- Redirects to dashboard if unauthorized role
- Passes `businessId` from session to the client component
- Client fetches `/api/service-risks` which uses session-scoped `businessId`

### 2.4 Heart Pulse Channel

Promise events are published to business-specific channels:

```typescript
HeartPulseChannel.business(businessId)
```

Business B subscribers on Business B's channel will never receive Business A's Promise events.

### 2.5 Database Indexes

The ServicePromise table has indexes that support efficient business-scoped queries:

```prisma
@@index([businessId, state])
@@index([businessId, saleId])
```

---

## 3. Test Verification

The test suite includes a dedicated "Business Isolation" describe block:

1. **"should only return risks for the specified business"** — Verifies the Prisma query includes `businessId` in the WHERE clause
2. **"should NOT return Business B promises for Business A"** — Verifies that when `getActiveRisks('biz-A')` is called, only biz-A promises are returned
3. **"should scope cron evaluation by businessId when provided"** — Verifies `evaluateActivePromises('biz-A')` filters by businessId

All 3 tests pass.

---

## 4. Attack Surface Analysis

| Attack Vector | Protected? | How |
|--------------|-----------|-----|
| Direct API call without session | YES | `resolveBusinessContext` returns 401 |
| API call with session but different businessId | YES | businessId extracted from session, not request body |
| Dashboard access without login | YES | `getServerSideProps` redirects to /login |
| Dashboard access with wrong role | YES | Role check redirects to /dashboard |
| Heart Pulse cross-business subscription | YES | Business-specific channel |
| Direct promise access via API | YES | No API endpoint exposes promise by ID — only business-scoped queries |
| Stats cross-business | YES | All counts filtered by businessId from session |

---

## 5. Certification

Business isolation is **VERIFIED**. Business A cannot see Business B's promises, risks, statistics, events, or dashboard data through any Promise Engine endpoint or channel.
