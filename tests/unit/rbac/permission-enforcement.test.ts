import { describe, it, expect } from '@jest/globals'
import {
  hasPermission,
  mergePermissions,
  getSystemRoleDefinition,
  SystemRoleKeys,
  type PermissionMatrix,
} from '@/lib/permissions/staff'

describe('hasPermission', () => {
  it('returns true for an explicitly granted permission', () => {
    const perms: PermissionMatrix = { payments: { read: true, refund: true } }
    expect(hasPermission(perms, 'payments.read')).toBe(true)
    expect(hasPermission(perms, 'payments.refund')).toBe(true)
  })

  it('returns false for an explicitly denied permission', () => {
    const perms: PermissionMatrix = { payments: { read: true, refund: false } }
    expect(hasPermission(perms, 'payments.refund')).toBe(false)
  })

  it('returns false when the group is missing', () => {
    const perms: PermissionMatrix = { orders: { read: true } }
    expect(hasPermission(perms, 'payments.read')).toBe(false)
  })

  it('returns false when the key is missing within the group', () => {
    const perms: PermissionMatrix = { payments: { read: true } }
    expect(hasPermission(perms, 'payments.refund')).toBe(false)
  })

  it('returns false for empty permissions', () => {
    expect(hasPermission({}, 'settings.manage')).toBe(false)
  })
})

describe('mergePermissions', () => {
  it('merges two non-overlapping permission groups', () => {
    const a: PermissionMatrix = { orders: { read: true } }
    const b: PermissionMatrix = { payments: { read: true } }
    const merged = mergePermissions([a, b])
    expect(hasPermission(merged, 'orders.read')).toBe(true)
    expect(hasPermission(merged, 'payments.read')).toBe(true)
  })

  it('later matrix overrides earlier for the same key', () => {
    const base: PermissionMatrix = { settings: { read: true, manage: false } }
    const override: PermissionMatrix = { settings: { manage: true } }
    const merged = mergePermissions([base, override])
    expect(hasPermission(merged, 'settings.manage')).toBe(true)
    expect(hasPermission(merged, 'settings.read')).toBe(true)
  })

  it('handles empty array', () => {
    expect(mergePermissions([])).toEqual({})
  })
})

describe('System role permissions', () => {
  describe('OWNER', () => {
    const ownerPerms = getSystemRoleDefinition(SystemRoleKeys.OWNER).permissions

    it('has full permissions', () => {
      expect(hasPermission(ownerPerms, 'payments.refund')).toBe(true)
      expect(hasPermission(ownerPerms, 'settings.manage')).toBe(true)
      expect(hasPermission(ownerPerms, 'reports.view')).toBe(true)
      expect(hasPermission(ownerPerms, 'staff.manage')).toBe(true)
    })
  })

  describe('MANAGER', () => {
    const managerPerms = getSystemRoleDefinition(SystemRoleKeys.MANAGER).permissions

    it('can read reports and manage staff', () => {
      expect(hasPermission(managerPerms, 'reports.view')).toBe(true)
      expect(hasPermission(managerPerms, 'staff.manage')).toBe(true)
    })

    it('cannot issue refunds or manage settings', () => {
      expect(hasPermission(managerPerms, 'payments.refund')).toBe(false)
      expect(hasPermission(managerPerms, 'settings.manage')).toBe(false)
    })
  })

  describe('CASHIER', () => {
    const cashierPerms = getSystemRoleDefinition(SystemRoleKeys.CASHIER).permissions

    it('can read payments but cannot refund', () => {
      expect(hasPermission(cashierPerms, 'payments.read')).toBe(true)
      expect(hasPermission(cashierPerms, 'payments.refund')).toBe(false)
    })

    it('cannot view reports or manage settings', () => {
      expect(hasPermission(cashierPerms, 'reports.view')).toBe(false)
      expect(hasPermission(cashierPerms, 'settings.manage')).toBe(false)
    })
  })

  describe('WAITER', () => {
    const waiterPerms = getSystemRoleDefinition(SystemRoleKeys.WAITER).permissions

    it('can read and update tables', () => {
      expect(hasPermission(waiterPerms, 'tables.read')).toBe(true)
      expect(hasPermission(waiterPerms, 'tables.update')).toBe(true)
    })

    it('cannot create tables or make payments', () => {
      expect(hasPermission(waiterPerms, 'tables.create')).toBe(false)
      expect(hasPermission(waiterPerms, 'payments.read')).toBe(false)
    })
  })

  describe('KITCHEN', () => {
    const kitchenPerms = getSystemRoleDefinition(SystemRoleKeys.KITCHEN).permissions

    it('can read and update inventory', () => {
      expect(hasPermission(kitchenPerms, 'inventory.read')).toBe(true)
      expect(hasPermission(kitchenPerms, 'inventory.update')).toBe(true)
    })

    it('cannot access financial or settings', () => {
      expect(hasPermission(kitchenPerms, 'payments.read')).toBe(false)
      expect(hasPermission(kitchenPerms, 'reports.view')).toBe(false)
      expect(hasPermission(kitchenPerms, 'settings.manage')).toBe(false)
    })
  })
})
