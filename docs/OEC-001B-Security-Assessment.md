# OEC-001B Security Assessment

## Security Engineering Review

---

## Assessment Score: 6.5/10 — MODERATE (Critical Gaps)

---

## 1. Authentication

### Strengths
- NextAuth with JWT strategy (industry standard)
- MFA with OTP via email/WhatsApp
- OTPs hashed with SHA-256 before storage
- 8-hour session timeout with 1-hour refresh
- Comprehensive security event logging
- Legacy credentials guarded (only enabled with explicit flag in non-production)

### Concerns
- Development OTP fallback: OTPs logged to console in dev if email/WhatsApp fails
- Legacy auth flag: ALLOW_LEGACY_CREDENTIALS can enable password auth

---

## 2. Authorization

### Strengths
- Role-Based Access Control (OWNER, ADMIN, MANAGER, CASHIER, etc.)
- Permission middleware with requirePermission() wrapper
- Business context resolution (automatic business association)
- Security event logging for permission denials

### Concerns
- Inconsistent role checks: Some admin endpoints manually check roles instead of using middleware
- OWNER bypass: OWNER role bypasses business context validation

---

## 3. Sensitive Data Handling

### Strengths
- Environment validation at startup (env-validator.ts)
- .gitignore properly excludes .env files
- No hardcoded secrets found in source code
- Type-safe env helpers (src/lib/env.ts)

### Concerns
- Direct process.env usage in some services instead of helpers
- API keys passed to external services without additional encryption

---

## 4. Input Validation

### Strengths
- Zod schemas for structured validation (user.schema.ts)
- File upload validation (type and size checks)
- Query parameter type checking

### Concerns
- Inconsistent validation: Not all endpoints use schema validation
- Some endpoints lack input validation entirely

---

## 5. SQL Injection Protection — CRITICAL

### Critical Vulnerability
**$executeRawUnsafe usage** in src/lib/die/plugins/built-in/qr-menu.plugin.ts:173-175:
```typescript
await prisma.$executeRawUnsafe(sql)
await prisma.$executeRawUnsafe(indexBusiness)
await prisma.$executeRawUnsafe(indexStatus)
```
The `sql` variable is constructed dynamically without proper sanitization.

### Raw SQL Usage
- 42 raw SQL queries found across codebase
- Most use parameterized template literals (safe)
- $executeRawUnsafe is the critical exception

### Raw SQL Locations
- src/pages/api/qr/designs/index.ts (lines 37, 86, 92)
- src/pages/api/qr/designs/[id].ts (lines 27, 32, 33, 40, 50, 67, 72)
- src/pages/api/business/scan.ts (lines 252, 257, 299)
- src/pages/api/qr/templates/[id].ts (line 9)
- src/pages/api/q/[token].ts (lines 18, 25)

---

## 6. XSS Protection

### Strengths
- React auto-escaping (default JSX)
- CSP headers configured (next.config.js)

### Concerns
- **4 instances of dangerouslySetInnerHTML**:
  - src/pages/index.tsx:311 — JSON-LD structured data (acceptable)
  - src/components/PublicLayout.tsx:65,77 — JSON-LD structured data (acceptable)
  - **src/pages/dashboard/qr-builder.tsx:379 — SVG rendering without sanitization (CRITICAL)**
    ```typescript
    <div dangerouslySetInnerHTML={{ __html: renderedSvg }} />
    ```

---

## 7. CSRF Protection — CRITICAL

### Critical Gap
- **No CSRF protection found** — zero CSRF token implementation
- No SameSite cookie enforcement (middleware only sets SameSite for referral cookies)
- All POST/PUT/DELETE endpoints vulnerable to cross-site request forgery

---

## 8. API Exposure

### Unprotected Public Endpoints
| Endpoint | Risk | Assessment |
|----------|------|------------|
| /api/q/[token] | Low | Public QR resolver (acceptable) |
| /api/health/ready | Low | Health check (should rate limit) |
| /api/public/menu | Medium | Public menu (should rate limit) |
| /api/public/order/confirm | HIGH | Order confirmation without auth |
| /api/public/order/status | Low | Read-only (acceptable) |
| /api/waiter-calls | HIGH | POST without auth (spam risk) |
| /api/f/[code] | Low | Founder code redirect (acceptable) |
| /api/r/[code] | Low | Referral redirect (acceptable) |
| /api/qr/templates/[id] | Medium | Template lookup should be authed |

---

## 9. CORS Configuration — CRITICAL

- **No explicit CORS configuration found**
- No CORS middleware implemented
- Documentation acknowledges gap (COMPREHENSIVE_PROJECT_BACKLOG.md)

---

## 10. Rate Limiting

### Strengths
- Rate limiting middleware exists (withRateLimit.ts)
- Redis-based distributed option available (rateLimit.redis.ts)
- Applied to auth endpoints, payments, admin

### Concerns
- In-memory default (not distributed)
- Not applied universally (99.4% of endpoints unprotected)
- Inconsistent limits without clear policy

---

## 11. Security Headers

### Strengths
- Comprehensive headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Environment-specific CSP (different for dev/prod)
- Strict CSP in production: object-src 'none', upgrade-insecure-requests

### Concerns
- CSP allows 'unsafe-inline' for Next.js scripts
- Development CSP allows 'unsafe-eval'

---

## 12. File System Operations

### Concerns
- 15 instances of fs.readFile/writeFile
- Path traversal risk: File paths constructed from user input without validation
- Locations: storage.service.ts, menu-builder/upload.ts, die/upload.ts, support/upload.ts, cms/media/upload.ts

---

## 13. Summary

| Category | Score | Status |
|----------|-------|--------|
| Authentication | 8/10 | ✅ Strong |
| Authorization | 6/10 | ⚠️ Inconsistent |
| Sensitive Data | 7/10 | ✅ Good |
| Input Validation | 4/10 | ⚠️ Inconsistent |
| SQL Injection | 3/10 | ⚠️ CRITICAL |
| XSS Protection | 6/10 | ⚠️ SVG vulnerability |
| CSRF Protection | 1/10 | ⚠️ CRITICAL (none) |
| API Exposure | 5/10 | ⚠️ Public endpoint risks |
| CORS | 1/10 | ⚠️ CRITICAL (none) |
| Rate Limiting | 3/10 | ⚠️ 99.4% unprotected |
| Security Headers | 8/10 | ✅ Strong |
| File Operations | 5/10 | ⚠️ Path traversal risk |
| **Overall** | **6.5/10** | **⚠️ Moderate with Critical Gaps** |

---

## 14. Critical Security Concerns

1. **SQL Injection** — $executeRawUnsafe in qr-menu.plugin.ts:173-175
2. **No CSRF Protection** — All mutation endpoints vulnerable
3. **No CORS Configuration** — Cross-origin requests unrestricted
4. **XSS via SVG** — Unsanitized SVG in qr-builder.tsx:379
5. **Public Endpoint Abuse** — Order confirmation, waiter calls vulnerable
6. **Path Traversal Risk** — File operations without path validation

---

## 15. Recommendations

### Immediate (Within 1 Week)
1. Replace $executeRawUnsafe with parameterized queries
2. Implement CSRF token middleware for all mutation endpoints
3. Add rate limiting to all public endpoints
4. Sanitize SVG rendering with DOMPurify
5. Implement CORS middleware with strict origin whitelist

### Short-Term (Within 1 Month)
6. Standardize authorization with permission middleware
7. Add path traversal protection to file operations
8. Implement Redis-based rate limiting for production
9. Add comprehensive input validation schemas
10. Remove console OTP fallback

### Medium-Term (Within 3 Months)
11. Implement secret management service
12. Add security testing to CI/CD
13. Conduct penetration testing
14. Implement API key rotation policy
15. Add security monitoring and alerting
