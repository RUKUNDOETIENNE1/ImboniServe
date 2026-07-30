# Playbook Volume IV — Development Standards

```yaml
id: PB-V4
title: Development Standards
type: playbook
version: 1.0
status: active
owner: Principal Software Engineer
created: 2026-07-30
updated: 2026-07-30
review_frequency: bi-annual
depends_on: [PB-V1, PB-V2, IEOS-FP-001, IEOS-MD-001]
implements: [MEP-001 D2]
related_documents: [IEC-TERM-001, IEC-FIG-001]
supersedes: []
tags: [playbook, development, standards]
```

## Purpose

Define how code is written, organized, and verified at Imboni.

---

## 1. Code Organization

### Source Structure
```
/src
  /pages/api/    — API routes (one file per endpoint)
  /lib/          — Shared libraries and services
  /components/   — React components
  /hooks/        — Custom React hooks
  /utils/        — Utility functions
  /types/        — TypeScript type definitions
  /middleware/   — Auth and feature middleware
```

### Naming Conventions
- **Files:** camelCase for utilities, PascalCase for components
- **Functions:** camelCase
- **Components:** PascalCase
- **Types/Interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Database tables:** PascalCase (Prisma convention)
- **API routes:** kebab-case

---

## 2. TypeScript Standards

- Strict mode enabled
- No `any` types without explicit justification
- All function parameters and returns typed
- Prefer interfaces over type aliases for objects
- Use enums for fixed value sets

---

## 3. API Route Standards

### Structure:
```typescript
// 1. Imports
// 2. Type definitions
// 3. Handler function
// 4. Export with middleware wrapping
```

### Requirements:
- All endpoints wrapped in auth middleware
- Commercial endpoints wrapped in feature middleware
- Consistent error response format
- Input validation on all requests
- No business logic in route handlers — delegate to lib services

---

## 4. Database Standards

### Prisma Schema:
- `schema.prisma` is the canonical source
- All models use `@@map` for table names
- Enums defined in schema, not in code
- Relations explicitly defined
- Indexes defined in schema

### Migrations:
- Use `prisma migrate dev` for development
- All migrations must be idempotent (IF NOT EXISTS, DO $$ blocks)
- Never modify applied migrations
- Test migrations against staging before production
- Document non-trivial migrations with comments

### Query Standards:
- Use Prisma client for all database access
- No raw SQL unless Prisma cannot express the query
- FinancialLedgerEntry is the exclusive source for revenue analytics
- PaymentTransaction, Subscription, MarketplaceOrder are execution/audit only

---

## 5. Error Handling

### Error Response Format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}
}
```

### HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized
- 403: Forbidden (feature/plan restriction)
- 404: Not found
- 409: Conflict
- 500: Internal server error

---

## 6. Development Checklist

### Before writing code:
- [ ] Understand the domain and business capability
- [ ] Check existing patterns in the codebase
- [ ] Review relevant standards
- [ ] Plan the implementation

### While writing code:
- [ ] Follow naming conventions
- [ ] Use TypeScript strict types
- [ ] Delegate business logic to services
- [ ] Handle errors appropriately
- [ ] No hardcoded business logic

### Before committing:
- [ ] Code compiles without errors
- [ ] TypeScript strict checks pass
- [ ] No console.log in production code
- [ ] Tests written and passing
- [ ] Self-reviewed the diff

---

## 7. Code Review Standards

### Reviewer responsibilities:
- Verify pattern compliance
- Check for security issues
- Ensure error handling is appropriate
- Verify test coverage
- Check documentation updates

### Reviewer checklist:
- [ ] No `any` types without justification
- [ ] No hardcoded business logic
- [ ] No raw SQL without justification
- [ ] Error handling follows standard
- [ ] Naming conventions followed
- [ ] Tests cover the change

---

## References

| Document | Location |
|----------|----------|
| Terminology Standard | `docs/standards/TERMINOLOGY_STANDARD.md` |
| Financial Data Governance | `docs/standards/FINANCIAL_DATA_GOVERNANCE.md` |
| Metadata Standard | `docs/standards/IEOS-MD-001_METADATA_STANDARD.md` |
