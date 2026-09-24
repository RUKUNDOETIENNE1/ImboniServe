# OEC-001B Engineering Improvement Matrix

## Categorized Findings and Recommendations

---

## Finding Categories

| Category | Count | Action Required |
|----------|-------|----------------|
| Critical | 4 | Must fix before production |
| High | 8 | Should fix soon |
| Medium | 10 | Should plan for |
| Low | 6 | Nice to have |
| Future Evolution | 4 | Post-launch consideration |
| **Total** | **32** | |

---

## CRITICAL Findings

### CRIT-001: SQL Injection via $executeRawUnsafe
- **Area**: Security
- **File**: src/lib/die/plugins/built-in/qr-menu.plugin.ts:173-175
- **Issue**: `prisma.$executeRawUnsafe(sql)` with dynamically constructed SQL
- **Impact**: Data breach risk — SQL injection vulnerability
- **Fix**: Replace with parameterized queries using `prisma.$executeRaw` with template literals
- **Effort**: 2-4 hours
- **Risk to fix**: LOW (isolated change)

### CRIT-002: No CSRF Protection
- **Area**: Security
- **File**: All mutation endpoints (POST/PUT/DELETE)
- **Issue**: Zero CSRF token implementation, no SameSite cookie enforcement
- **Impact**: Cross-site request forgery on all mutation endpoints
- **Fix**: Implement CSRF token middleware, use NextAuth built-in CSRF, add SameSite=Strict
- **Effort**: 8-16 hours
- **Risk to fix**: MEDIUM (affects all mutations)

### CRIT-003: Type Safety Debt (2,942 `any` usages)
- **Area**: Type Safety
- **Files**: Throughout src/ (1,702 `: any` + 1,240 `as any`)
- **Issue**: Strict mode enabled but undermined by extensive `any` usage
- **Impact**: Type safety bypassed, runtime errors not caught at compile time
- **Fix**: Gradual elimination — start with auth (SessionUser type), payments, executive dashboards
- **Effort**: 80-120 hours (gradual)
- **Risk to fix**: LOW (additive typing)

### CRIT-004: Test Coverage Gaps (95% untested)
- **Area**: Testing
- **Files**: 175 untested services, 494 untested API endpoints
- **Issue**: Critical financial services lack regression protection
- **Impact**: No regression protection for payments, billing, commissions
- **Fix**: Add tests for payment gateways, commissions, billing ledger, fraud detection
- **Effort**: 120-200 hours (gradual)
- **Risk to fix**: NONE (additive)

---

## HIGH Findings

### HIGH-001: No CORS Configuration
- **Area**: Security
- **Fix**: Implement CORS middleware with strict origin whitelist
- **Effort**: 2-4 hours

### HIGH-002: XSS via Unsanitized SVG
- **Area**: Security
- **File**: src/pages/dashboard/qr-builder.tsx:379
- **Fix**: Sanitize SVG with DOMPurify before rendering
- **Effort**: 1-2 hours

### HIGH-003: No Rate Limiting (99.4% unprotected)
- **Area**: API Engineering
- **Fix**: Apply withRateLimit middleware to all public and auth endpoints
- **Effort**: 8-16 hours

### HIGH-004: No Input Validation (95% lack Zod)
- **Area**: API Engineering
- **Fix**: Add Zod schemas to all API endpoints (target 80%+)
- **Effort**: 40-80 hours (gradual)

### HIGH-005: Auth Inconsistency (92% direct getServerSession)
- **Area**: API Engineering
- **Fix**: Migrate to requireAuth/requireRole middleware
- **Effort**: 40-60 hours (gradual)

### HIGH-006: N+1 Queries in Cron Jobs
- **Area**: Performance
- **Files**: cron/subscription-reminders.ts:71-121, lib/cron.ts:223-242, 621-623, 185-191
- **Fix**: Use Promise.all with batching, use updateMany
- **Effort**: 8-12 hours

### HIGH-007: Unbounded Queries (30+ without pagination)
- **Area**: Performance
- **Files**: portal/index.ts, operations-intelligence/index.ts, revenue-operations/index.ts
- **Fix**: Add pagination (take/skip) to all unbounded queries
- **Effort**: 16-24 hours

### HIGH-008: TypeScript Errors Ignored in Builds
- **Area**: Build
- **File**: next.config.js:94
- **Fix**: Enable TypeScript error checking in all builds, fix 155 existing errors
- **Effort**: 20-40 hours

---

## MEDIUM Findings

### MED-001: Cascade Deletes Without Soft Delete
- **Area**: Database
- **Fix**: Implement soft delete for Business model
- **Effort**: 8-16 hours

### MED-002: Missing Foreign Key Indexes
- **Area**: Database
- **Fix**: Add indexes on InventoryItem.businessId, InventoryUpdate.businessId, Recipe.businessId, MenuItem.businessId, Subscription.businessId
- **Effort**: 2-4 hours

### MED-003: Free-Text Status Fields Should Be Enums
- **Area**: Database
- **Fix**: Convert Sale.kitchenStatus, Sale.kitchenDispatchStatus to enums
- **Effort**: 4-8 hours

### MED-004: Excessive Console Logging (1,099 console.log)
- **Area**: Code Quality
- **Fix**: Replace with structured logger (@/lib/logger)
- **Effort**: 16-24 hours

### MED-005: Duplicate User Lookup Pattern (15 occurrences)
- **Area**: Code Quality
- **Fix**: Extract to shared utility getCurrentUser(session)
- **Effort**: 4-8 hours

### MED-006: Flat Service Directory (190+ services)
- **Area**: Architecture
- **Fix**: Reorganize by domain into subdirectories
- **Effort**: 8-16 hours

### MED-007: Mixed Routing Patterns
- **Area**: Architecture
- **Fix**: Standardize on App Router
- **Effort**: 40-80 hours (deferred)

### MED-008: In-Process Cron Jobs
- **Area**: Reliability
- **Fix**: Move cron jobs to BullMQ queues
- **Effort**: 16-24 hours

### MED-009: No CI/CD Pipeline
- **Area**: Build
- **Fix**: Set up GitHub Actions for automated testing and deployment
- **Effort**: 8-16 hours

### MED-010: Outdated Dependencies
- **Area**: Build
- **Fix**: Update Prisma (5→7), Next.js (14→15), React (18→19)
- **Effort**: 40-80 hours (with testing)

---

## LOW Findings

### LOW-001: String Fields Without Length Constraints
- **Fix**: Add @db.VarChar constraints
- **Effort**: 4-8 hours

### LOW-002: Missing Check Constraints
- **Fix**: Add check constraints for numeric ranges
- **Effort**: 2-4 hours

### LOW-003: No ESLint/Prettier Configuration
- **Fix**: Add ESLint with @typescript-eslint rules, Prettier
- **Effort**: 4-8 hours

### LOW-004: No CHANGELOG.md
- **Fix**: Create and maintain changelog
- **Effort**: 2 hours

### LOW-005: Docker Runs as Root
- **Fix**: Add non-root user to Dockerfile
- **Effort**: 1 hour

### LOW-006: Utility Files Scattered
- **Fix**: Create src/lib/utils/ directory
- **Effort**: 4-8 hours

---

## FUTURE EVOLUTION

### FUT-001: Standardize on App Router
- Migrate all API routes from src/pages/api/ to src/app/api/
- **When**: Post-launch

### FUT-002: Implement Service Discovery
- Create service registry with health checks
- **When**: When service count exceeds 250

### FUT-003: Split Large Models
- Split Business model (60+ fields) into Business, BusinessSettings, BusinessMetrics
- **When**: When field additions become frequent

### FUT-004: Achieve 70% Service Coverage
- Meet jest.config.ts coverage thresholds
- **When**: Ongoing effort

---

## Implementation Priority

### Sprint 1: Critical Security (1-2 weeks)
1. CRIT-001: Fix SQL injection (2-4h)
2. HIGH-002: Fix XSS via SVG (1-2h)
3. HIGH-001: Implement CORS (2-4h)
4. CRIT-002: Implement CSRF protection (8-16h)
5. HIGH-003: Add rate limiting (8-16h)

### Sprint 2: API Quality (2-3 weeks)
6. HIGH-004: Add Zod validation (40-80h, gradual)
7. HIGH-005: Migrate auth to middleware (40-60h, gradual)
8. MED-005: Extract shared auth utilities (4-8h)

### Sprint 3: Performance (1-2 weeks)
9. HIGH-006: Fix N+1 queries (8-12h)
10. HIGH-007: Add pagination (16-24h)
11. MED-002: Add missing indexes (2-4h)

### Sprint 4: Testing (4-6 weeks, ongoing)
12. CRIT-004: Add payment/commission/billing tests (120-200h)
13. MED-009: Set up CI/CD pipeline (8-16h)

### Sprint 5: Code Quality (2-3 weeks, ongoing)
14. MED-004: Replace console.log with logger (16-24h)
15. CRIT-003: Gradual `any` elimination (80-120h)
16. LOW-003: Add ESLint configuration (4-8h)

### Sprint 6: Build & Deploy (1-2 weeks)
17. HIGH-008: Fix TypeScript errors (20-40h)
18. MED-010: Update dependencies (40-80h)
19. LOW-005: Secure Docker (1h)

---

## Total Effort Estimate

| Sprint | Effort | Duration |
|--------|--------|----------|
| Sprint 1: Critical Security | 21-42h | 1-2 weeks |
| Sprint 2: API Quality | 84-148h | 2-3 weeks |
| Sprint 3: Performance | 26-40h | 1-2 weeks |
| Sprint 4: Testing | 128-216h | 4-6 weeks |
| Sprint 5: Code Quality | 100-152h | 2-3 weeks |
| Sprint 6: Build & Deploy | 61-121h | 1-2 weeks |
| **Total** | **420-719h** | **11-18 weeks** |

Note: Many items can be done in parallel and gradually alongside feature work.
