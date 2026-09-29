/**
 * P1-A — Staff Order-Read Permission Regression Tests
 *
 * Defect: Station/Waiter APIs declared requirePermission('orders.view'), but
 * the PermissionMatrix defines `orders.read`. hasPermission('orders.view')
 * resolved perms.orders.view → undefined → 403 for every non-OWNER staff role.
 *
 * Fix: all order-read endpoints now use the canonical 'orders.read' key.
 *
 * Proves:
 *   1. Station/waiter/pilot endpoints declare 'orders.read' (source guard)
 *   2. OWNER bypass still works
 *   3. WAITER, KITCHEN_MANAGER, MANAGER, CASHIER pass (all have orders.read)
 *   4. Staff without orders.read (custom role / missing group) → 403
 *   5. Unauthenticated → 401
 *   6. Missing business context for non-OWNER → 400
 *   7. The old key would still fail — documents the bug is not reintroduced
 */

import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/permissions/staff', () => {
  const actual = jest.requireActual('@/lib/permissions/staff')
  return { ...actual, getUserEffectivePermissions: jest.fn() }
})
jest.mock('@/lib/services/security-event.service', () => ({
  SecurityEventService: { log: jest.fn() },
}))
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))

const { requirePermission } = require('@/lib/middleware/permission.middleware')
const { getUserEffectivePermissions, getSystemRoleDefinition, hasPermission, SystemRoleKeys } =
  require('@/lib/permissions/staff')

const mockedSession = getServerSession as jest.Mock
const mockedPerms = getUserEffectivePermissions as jest.Mock

function buildReqRes() {
  return {
    req: { headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/test', method: 'GET' } as any,
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any,
  }
}

function sessionFor(roles: string[], businessId: string | null = 'biz-1') {
  return { user: { id: 'user-1', businessId, roles } }
}

beforeEach(() => jest.clearAllMocks())

// ─── 1. Source-level regression: endpoints must declare the canonical key ────

describe('P1-A source guard: endpoints use orders.read', () => {
  const endpoints = [
    'src/pages/api/station/list.ts',
    'src/pages/api/station/orders.ts',
    'src/pages/api/station/snapshot.ts',
    'src/pages/api/waiter/queue.ts',
    'src/pages/api/pilot/metrics.ts',
  ]

  for (const ep of endpoints) {
    it(`${ep} declares requirePermission('orders.read')`, () => {
      const content = fs.readFileSync(path.join(process.cwd(), ep), 'utf8')
      expect(content).toContain("requirePermission('orders.read')")
      expect(content).not.toContain("requirePermission('orders.view')")
    })
  }
})

// ─── 2-6. Middleware behavior ────────────────────────────────────────────────

describe('P1-A middleware: requirePermission("orders.read")', () => {
  const handler = jest.fn((_req: any, res: any) => res.status(200).json({ ok: true }))

  it('OWNER bypasses permission check (bootstrap-safe)', async () => {
    mockedSession.mockResolvedValue(sessionFor(['OWNER']))
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it.each([
    ['WAITER', SystemRoleKeys.WAITER],
    ['KITCHEN_MANAGER', SystemRoleKeys.KITCHEN],
    ['MANAGER', SystemRoleKeys.MANAGER],
    ['CASHIER', SystemRoleKeys.CASHIER],
  ])('%s staff with orders.read is allowed', async (baseRole, roleKey) => {
    mockedSession.mockResolvedValue(sessionFor([baseRole]))
    // Real permission matrix for the role
    mockedPerms.mockResolvedValue(getSystemRoleDefinition(roleKey).permissions)
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('staff WITHOUT orders.read is denied with 403', async () => {
    mockedSession.mockResolvedValue(sessionFor(['WAITER']))
    // Custom role that lacks orders.read (e.g. housekeeping-only role)
    mockedPerms.mockResolvedValue({ dashboard: { view: true }, orders: { read: false } })
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('staff with no orders group at all is denied with 403', async () => {
    mockedSession.mockResolvedValue(sessionFor(['WAITER']))
    mockedPerms.mockResolvedValue({ dashboard: { view: true } })
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('unauthenticated request gets 401', async () => {
    mockedSession.mockResolvedValue(null)
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('non-OWNER missing business context gets 400 (no privilege leak)', async () => {
    mockedSession.mockResolvedValue(sessionFor(['WAITER'], null))
    const wrapped = requirePermission('orders.read')(handler)
    const { req, res } = buildReqRes()
    await wrapped(req, res)
    expect(handler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('the old orders.view key would still fail for all staff roles (bug documented)', () => {
    // Proves the defect mechanism: 'orders.view' resolves nothing in any matrix
    for (const key of Object.values(SystemRoleKeys)) {
      const perms = getSystemRoleDefinition(key).permissions
      expect(hasPermission(perms, 'orders.view')).toBe(false)
      expect(hasPermission(perms, 'orders.read')).toBe(true)
    }
  })
})
