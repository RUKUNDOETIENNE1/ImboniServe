# Founder Success Portal — Engineering Standard Operating Procedure

## Purpose

The Founder Success Portal is the daily workspace for Founder Partners. It provides a motivating, coaching-like experience that helps partners grow their business, track earnings, manage campaigns and codes, and access learning resources.

## Access

- **URL**: `/portal`
- **Authentication**: NextAuth session required
- **Authorization**: User must have an active `Partnership` record (status not in `PROSPECT`, `REJECTED`, `TERMINATED`)
- **Enforcement**: Server-side via `getServerSideProps` on all pages + API-level checks

## Architecture

### Composite API
- Single endpoint: `/api/portal`
- GET with `?section=` parameter for data retrieval
- PATCH with `action` field for mutations
- Rate limited: 100 requests/minute per IP

### Data Flow
1. Page calls `fetch('/api/portal?section=<section>')`
2. API authenticates session → resolves `userId` → finds `Partnership`
3. API queries Prisma models scoped to `partnershipId`
4. Business data fetched via batched `prisma.business.findMany` (no direct relation from `PartnershipCodeRedemption` or `PartnershipAttribution`)
5. Response returned as `{ data: ... }`

### Key Prisma Considerations
- `PartnershipCodeRedemption.businessId` is a plain string, NOT a relation. Use `prisma.business.findMany({ where: { id: { in: [...] } } })` to fetch business data.
- `PartnershipAttribution.businessId` is similarly a plain string.
- `PartnershipCommissionType` enum uses `RECURRING_REVENUE` (not `RECURRING`).
- `PartnershipAgreement` uses `effectiveAt`/`expiresAt` (not `startDate`/`endDate`).

## Adding a New Portal Section

1. **API**: Add a new case in the GET switch statement in `src/pages/api/portal/index.ts`
2. **Component**: Create a reusable component in `src/components/portal/`
3. **Page**: Create a new page in `src/pages/portal/<section>.tsx`
4. **Navigation**: Add the route to `PortalLayout.tsx` navigation items
5. **Tests**: Add tests in `tests/components/founder-portal.test.tsx`
6. **SSR**: Add `getServerSideProps` with auth check

## Adding a New Portal Action

1. Add a case in the PATCH switch statement in `src/pages/api/portal/index.ts`
2. Validate input and scope to `partnershipId`
3. Use existing services (`PartnershipCampaignService`, etc.) where possible
4. Return `{ success: true, message: '...' }`

## Testing

- Run: `npx jest tests/components/founder-portal.test.tsx --no-coverage`
- All 63 tests must pass
- Test categories: rendering, interactions, accessibility, regression

## Deployment Checklist

- [ ] TypeScript: `npx tsc --noEmit` — 0 portal errors
- [ ] Tests: `npx jest tests/components/founder-portal.test.tsx` — all pass
- [ ] No new dependencies added
- [ ] Rate limiting applied
- [ ] All pages have `getServerSideProps` auth checks
- [ ] API validates partnership status

## Monitoring

- API errors logged via `logger.child({ service: 'founder-portal-api' })`
- Monitor rate limit hits for potential abuse
- Track section popularity via API request logs

## Best Practices

1. **Never duplicate business logic** — reuse existing services (`PartnershipCampaignService`, `PartnershipCodeService`, etc.)
2. **Always scope queries to `partnershipId`** — never expose other partners' data
3. **Use batched queries** for business data — avoid N+1 queries
4. **Keep content motivating** — every page should answer "How am I doing? → How can I improve? → What's next?"
5. **No internal terminology** — use partner-friendly labels in navigation and UI
