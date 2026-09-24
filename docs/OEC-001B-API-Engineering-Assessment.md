# OEC-001B API Engineering Assessment

## API Layer Quality Review

---

## Assessment Score: 6.0/10 — INCONSISTENT

---

## 1. API Route Inventory

| Metric | Value |
|--------|-------|
| Total API Routes | 497 files |
| Admin endpoints | 76 files |
| Auth endpoints | 9 files |
| Webhook endpoints | 6 files |
| Cron endpoints | 17 files |
| Public endpoints | 4 files |
| API versioning | None (no v1/ directory) |

---

## 2. REST Consistency

### Strengths
- 97% of files check `req.method` (482/497)
- Consistent 405 response for method not allowed
- Consistent status codes (200, 401, 403, 404, 405, 500)

### Concerns
- **Inconsistent response structures**: 4 different patterns found
  - `{ data }` — success with data
  - `{ success: true, message }` — success flag
  - `{ items }` — direct items
  - `result` — direct object
- No standardized response envelope
- No API versioning strategy
- No OpenAPI/Swagger documentation

---

## 3. Error Response Consistency

### Strengths
- Standardized helpers exist in src/lib/api/response-helpers.ts:
  - errorResponse(), unauthorizedResponse(), forbiddenResponse(), notFoundResponse(), validationErrorResponse(), internalServerErrorResponse()
- Error handler middleware (withErrorHandler) provides centralized handling with Zod support

### Concerns
- Only 65 files (13%) use withErrorHandler middleware
- Inconsistent error formats: `{ error }`, `{ error, details }`, `{ message }`, `{ success: false, error }`

---

## 4. Authentication Consistency

### CRITICAL INCONSISTENCY

| Pattern | Files | Percentage |
|---------|-------|-----------|
| Direct getServerSession | 456 | 92% |
| requireAuth middleware | 10 | 2% |
| requireRole middleware | 10 | 2% |
| No auth (public) | 21 | 4% |

**92% of endpoints use direct getServerSession instead of middleware.** This means:
- Auth logic is duplicated 456 times
- Changing auth behavior requires updating 456 files
- Inconsistent error messages ("Unauthorized", "Authentication required", "User not found")

---

## 5. Authorization

### Mixed Models
- Role-based: `requireRole(['ADMIN'])`
- Permission-based: `requirePermission('inventory.read')`
- Manual checks: `if (!user?.roles.includes('ADMIN'))`
- Business context: `if (order.businessId !== ctx.businessId)`

**No centralized authorization policy.** Three different authorization models in use.

---

## 6. Input Validation

### CRITICAL GAPS

| Pattern | Files | Percentage |
|---------|-------|-----------|
| Zod schema validation | 25 | 5% |
| Manual validation | ~470 | 95% |
| No validation | Unknown | — |

**95% of endpoints lack schema validation.** High-risk endpoints with minimal validation:
- staff/index.ts:67-69 — Creates users with manual validation only
- tables/index.ts:80-82 — Creates tables with manual validation
- menu/index.ts:30-32 — Creates menu items with manual validation
- public/order/confirm.ts:11-15 — Minimal validation on public endpoint

---

## 7. Rate Limiting

### CRITICAL GAP

| Status | Files | Percentage |
|--------|-------|-----------|
| Rate limited | 3 | 0.6% |
| Not rate limited | 494 | 99.4% |

**99.4% of endpoints have NO rate limiting.** Unprotected high-risk endpoints:
- /api/auth/signup — Account creation
- /api/auth/forgot-password — Password reset
- /api/public/menu — Public menu access
- /api/public/order/confirm — Order confirmation
- /api/waiter-calls — Waiter call spam

Rate limiting middleware EXISTS (withRateLimit.ts, rateLimit.redis.ts) but is not applied.

---

## 8. Service Layer Composition

### Strengths
- 744 uses of `Service.` pattern across API files
- Good separation in core business operations (reservations, analytics, payments)
- Excellent parallel query composition with Promise.all

### Concerns
- 249 files with direct Prisma access (bypassing service layer)
- Admin endpoints tend to use Prisma directly
- Business logic scattered between services and API handlers

---

## 9. Webhook Endpoints

### Excellent Security
- Proper webhook signature validation (InTouch, Irembo)
- HMAC verification for security
- Idempotency handling (duplicate webhook detection)
- Defense-in-depth (Basic Auth + HMAC)
- PII redaction in logs

### Concerns
- No rate limiting on webhook endpoints
- Error handling varies between providers

---

## 10. Cron Job Endpoints

### Strengths
- CRON_SECRET authentication (Bearer token)
- Method checking (GET only)
- Proper error logging

### Concerns
- No input validation on cron parameters
- No idempotency handling (cron retries could cause duplicates)

---

## 11. Summary

| Category | Score | Status |
|----------|-------|--------|
| REST Consistency | 6/10 | ⚠️ Inconsistent |
| Error Responses | 5/10 | ⚠️ Underutilized helpers |
| Authentication | 4/10 | ⚠️ 92% direct, not middleware |
| Authorization | 5/10 | ⚠️ Mixed models |
| Input Validation | 3/10 | ⚠️ 95% lack Zod |
| Rate Limiting | 2/10 | ⚠️ 99.4% unprotected |
| Service Composition | 8/10 | ✅ Strong |
| Webhook Security | 9/10 | ✅ Excellent |
| Cron Security | 7/10 | ✅ Good |
| **Overall** | **6.0/10** | **⚠️ Inconsistent** |

---

## 12. Recommendations

### Priority 1 — Critical
1. Implement rate limiting on all public and auth endpoints
2. Standardize authentication using requireAuth/requireRole middleware
3. Add Zod input validation to all API endpoints (target 80%+)

### Priority 2 — High
4. Standardize response structures using successResponse() helper
5. Apply withErrorHandler to all endpoints (target 80%+)
6. Standardize authorization model (choose role-based OR permission-based)

### Priority 3 — Medium
7. Migrate admin endpoints to service layer (reduce direct Prisma access)
8. Add API versioning (v1/ directory)
9. Generate OpenAPI documentation
