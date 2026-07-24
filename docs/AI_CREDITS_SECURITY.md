# AI Credits Platform — Security

## Authentication & Authorization

### Business Endpoints
- All `/api/credits/*` endpoints (except admin) require an authenticated session via `getServerSession`
- The `businessId` is extracted from the session — users can only access their own wallet
- No business ID is accepted from the request body, preventing IDOR attacks

### Admin Endpoints
- All `/api/credits/admin/*` endpoints require `PLATFORM_ADMIN` role
- Role check: `roles.includes('PLATFORM_ADMIN')` from session
- Returns 403 Forbidden if not authorized

## Atomic Transactions

All credit operations use Prisma `$transaction` to ensure atomicity:

- **Balance adjustments:** Wallet update + ledger entry in a single transaction
- **Reservation commit:** Reservation status update + wallet balance update + ledger entry
- **Reservation release:** Reservation status update + reservedBalance decrement + ledger entry

If any step fails, the entire transaction rolls back.

## Idempotency

Every critical operation supports idempotency via unique keys:

| Operation | Idempotency Key Pattern |
|-----------|------------------------|
| Reservation | `reserve_{requestId}` |
| Commit | `commit_{requestId}` |
| Release | `release_{requestId}` |
| Purchase | `purchase_{transactionId}` |

Duplicate requests with the same key return the original result without side effects.

## Concurrency Safety

### Reservation Pattern
The reserve → execute → commit/release pattern prevents race conditions:
1. Credits are **reserved** (reservedBalance incremented) before the AI operation
2. The AI operation executes
3. On success, credits are **committed** (balance decremented, reservedBalance decremented)
4. On failure, credits are **released** (reservedBalance decremented, balance unchanged)

### Atomic Increments
Wallet balance updates use Prisma's atomic `increment`/`decrement` operations within transactions, preventing lost updates under concurrent access.

## Fraud Resistance

- **Immutable ledger:** Every credit movement is permanently recorded
- **Balance tracking:** `balanceBefore` and `balanceAfter` on every entry enable reconstruction
- **Idempotency keys:** Prevent replay attacks and duplicate fulfillment
- **Admin audit trail:** All admin actions (grant/revoke) are recorded with `userId`
- **Reservation expiry:** Stale reservations auto-expire, preventing credit hoarding

## Data Integrity

- **Cascade delete:** Wallet is deleted when business is deleted (referential integrity)
- **Unique constraints:** `businessId` on wallet, `featureKey` on costs, `policyKey` on policies, `code` on packages
- **Non-negative balances:** The `adjustBalance` function throws if `balanceAfter < 0`

## Sensitive Data

- **Cost USD:** Actual provider costs are recorded but not exposed to non-admin users
- **Metadata:** Ledger metadata may contain operational context; admin-only for cross-business search
- **Payment integration:** Purchase flow uses existing IremboPay service with VAT calculation

## Security Checklist

- [x] Session-based authentication on all endpoints
- [x] Role-based authorization on admin endpoints
- [x] No user-supplied businessId (extracted from session)
- [x] Atomic transactions for all balance changes
- [x] Idempotency keys on all critical operations
- [x] Immutable ledger for audit trail
- [x] Reservation expiry to prevent credit lockup
- [x] Non-negative balance enforcement
- [x] Cascade delete for referential integrity
- [x] Admin actions recorded with userId
