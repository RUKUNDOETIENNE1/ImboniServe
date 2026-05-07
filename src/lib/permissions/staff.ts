import { prisma } from '@/lib/prisma'

export type PermissionMatrix = {
  dashboard?: { view?: boolean }
  orders?: { read?: boolean; create?: boolean; update?: boolean; refund?: boolean }
  tables?: { read?: boolean; create?: boolean; update?: boolean; manageReservations?: boolean }
  rooms?: { read?: boolean; checkin?: boolean; checkout?: boolean; manage?: boolean }
  payments?: { read?: boolean; create?: boolean; refund?: boolean }
  reports?: { view?: boolean }
  staff?: { view?: boolean; manage?: boolean }
  inventory?: { read?: boolean; update?: boolean; manage?: boolean }
  settings?: { read?: boolean; manage?: boolean }
}

export const SystemRoleKeys = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier_front_desk',
  WAITER: 'waiter_staff',
  KITCHEN: 'kitchen_operations',
} as const

export type SystemRoleKey = typeof SystemRoleKeys[keyof typeof SystemRoleKeys]

type BaseRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'FRONT_DESK' | 'WAITER' | 'KITCHEN_MANAGER'

export function getSystemRoleDefinition(key: SystemRoleKey): {
  key: SystemRoleKey
  name: string
  description: string
  baseRole: BaseRole
  permissions: PermissionMatrix
} {
  switch (key) {
    case SystemRoleKeys.OWNER:
      return {
        key,
        name: 'Owner',
        description: 'Full control of the business account',
        baseRole: 'OWNER',
        permissions: {
          dashboard: { view: true },
          orders: { read: true, create: true, update: true, refund: true },
          tables: { read: true, create: true, update: true, manageReservations: true },
          rooms: { read: true, checkin: true, checkout: true, manage: true },
          payments: { read: true, create: true, refund: true },
          reports: { view: true },
          staff: { view: true, manage: true },
          inventory: { read: true, update: true, manage: true },
          settings: { read: true, manage: true },
        },
      }
    case SystemRoleKeys.MANAGER:
      return {
        key,
        name: 'Manager',
        description: 'Manage daily operations with limited settings',
        baseRole: 'MANAGER',
        permissions: {
          dashboard: { view: true },
          orders: { read: true, create: true, update: true, refund: false },
          tables: { read: true, create: true, update: true, manageReservations: true },
          rooms: { read: true, checkin: true, checkout: true, manage: false },
          payments: { read: true, create: true, refund: false },
          reports: { view: true },
          staff: { view: true, manage: true },
          inventory: { read: true, update: true, manage: false },
          settings: { read: true, manage: false },
        },
      }
    case SystemRoleKeys.CASHIER:
      return {
        key,
        name: 'Cashier / Front Desk',
        description: 'Process payments and handle front desk operations',
        baseRole: 'CASHIER',
        permissions: {
          dashboard: { view: true },
          orders: { read: true, create: false, update: false, refund: false },
          tables: { read: true },
          rooms: { read: true, checkin: true, checkout: true },
          payments: { read: true, create: true, refund: false },
          reports: { view: false },
          staff: { view: false, manage: false },
          inventory: { read: false },
          settings: { read: false, manage: false },
        },
      }
    case SystemRoleKeys.WAITER:
      return {
        key,
        name: 'Waiter / Staff',
        description: 'Serve customers and manage assigned tables',
        baseRole: 'WAITER',
        permissions: {
          dashboard: { view: true },
          orders: { read: true, create: true, update: true, refund: false },
          tables: { read: true, update: true },
          rooms: { read: true },
          payments: { read: false, create: false, refund: false },
          reports: { view: false },
          staff: { view: false, manage: false },
          inventory: { read: false },
          settings: { read: false, manage: false },
        },
      }
    case SystemRoleKeys.KITCHEN:
    default:
      return {
        key: SystemRoleKeys.KITCHEN,
        name: 'Kitchen / Operations',
        description: 'Manage kitchen operations and order statuses',
        baseRole: 'KITCHEN_MANAGER',
        permissions: {
          dashboard: { view: true },
          orders: { read: true, create: false, update: true, refund: false },
          tables: { read: true },
          rooms: { read: false },
          payments: { read: false, create: false, refund: false },
          reports: { view: false },
          staff: { view: false, manage: false },
          inventory: { read: true, update: true, manage: false },
          settings: { read: false, manage: false },
        },
      }
  }
}

export function listSystemRoles(): Array<{ businessId: string | null; key: SystemRoleKey; name: string; description: string; color?: string; icon?: string; baseRole: BaseRole; isSystem: boolean; isActive: boolean; permissions: PermissionMatrix; createdByUserId: string | null }> {
  const keys: SystemRoleKey[] = [
    SystemRoleKeys.OWNER,
    SystemRoleKeys.MANAGER,
    SystemRoleKeys.CASHIER,
    SystemRoleKeys.WAITER,
    SystemRoleKeys.KITCHEN,
  ]
  return keys.map(k => {
    const def = getSystemRoleDefinition(k)
    return {
      businessId: null,
      key: def.key,
      name: def.name,
      description: def.description,
      color: undefined,
      icon: undefined,
      baseRole: def.baseRole,
      isSystem: true,
      isActive: true,
      permissions: def.permissions,
      createdByUserId: null,
    }
  })
}

export async function getCustomRoles(businessId: string) {
  return prisma.staffRole.findMany({
    where: { businessId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export function mergePermissions(perms: PermissionMatrix[]): PermissionMatrix {
  const result: PermissionMatrix = {}
  for (const p of perms) {
    for (const [group, value] of Object.entries(p)) {
      const g = group as keyof PermissionMatrix
      if (!result[g]) (result as any)[g] = {}
      Object.assign((result as any)[g], value)
    }
  }
  return result
}

export async function getUserEffectivePermissions(userId: string, businessId: string, baseRoles: BaseRole[]): Promise<PermissionMatrix> {
  const systemPerms: PermissionMatrix[] = baseRoles.map(r => {
    switch (r) {
      case 'OWNER': return getSystemRoleDefinition(SystemRoleKeys.OWNER).permissions
      case 'MANAGER': return getSystemRoleDefinition(SystemRoleKeys.MANAGER).permissions
      case 'CASHIER': return getSystemRoleDefinition(SystemRoleKeys.CASHIER).permissions
      case 'FRONT_DESK': return getSystemRoleDefinition(SystemRoleKeys.CASHIER).permissions
      case 'WAITER': return getSystemRoleDefinition(SystemRoleKeys.WAITER).permissions
      case 'KITCHEN_MANAGER': return getSystemRoleDefinition(SystemRoleKeys.KITCHEN).permissions
      default: return {}
    }
  })

  const customAssignments = await prisma.userStaffRole.findMany({
    where: { userId, businessId },
    include: { role: true },
  })
  const customPerms: PermissionMatrix[] = customAssignments.map((a: { role: { permissions: any } }) => (a.role.permissions as any) as PermissionMatrix)
  return mergePermissions([...systemPerms, ...customPerms])
}

export function hasPermission(perms: PermissionMatrix, path: string): boolean {
  const [group, key] = path.split('.')
  const g: any = (perms as any)[group]
  if (!g) return false
  return Boolean(g[key])
}
