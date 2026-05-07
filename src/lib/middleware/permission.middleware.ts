import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getUserEffectivePermissions, hasPermission } from '@/lib/permissions/staff'
import { SecurityEventService } from '@/lib/services/security-event.service'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

const BASE_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'FRONT_DESK', 'WAITER', 'KITCHEN_MANAGER'] as const

type BaseRole = typeof BASE_ROLES[number]

export function requirePermission(permission: string) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const userId = (session.user as any).id as string | undefined
      const businessId = (session.user as any).businessId as string | null
      const roles = (((session.user as any).roles as string[]) || []).filter(r => (BASE_ROLES as readonly string[]).includes(r)) as BaseRole[]
      // permissions/staff BaseRole excludes ADMIN; derive a compatible list for permission evaluation
      const rolesForPerms = roles.filter(r => r !== 'ADMIN') as Exclude<BaseRole, 'ADMIN'>[] as any

      // OWNER bypass: allow OWNER to proceed even if businessId is not yet established (bootstrap flows)
      if (roles.includes('OWNER' as BaseRole)) {
        if (userId && businessId) {
          ;(req as any).userPermissions = await getUserEffectivePermissions(userId, businessId, rolesForPerms)
        }
        return handler(req, res)
      }

      // For non-OWNER users, missing context is an error
      if (!userId || !businessId) {
        try {
          await SecurityEventService.log({
            userId: userId ?? null,
            eventType: 'PERMISSION_DENIED',
            ip: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
            userAgent: (req.headers['user-agent'] as string) || null,
            metadata: { reason: 'missing_context', permission, url: req.url, method: req.method },
          })
        } catch {}
        return res.status(400).json({ error: 'Missing context' })
      }

      const perms = await getUserEffectivePermissions(userId, businessId, rolesForPerms)
      if (!hasPermission(perms, permission)) {
        try {
          await SecurityEventService.log({
            userId,
            eventType: 'PERMISSION_DENIED',
            ip: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
            userAgent: (req.headers['user-agent'] as string) || null,
            metadata: { permission, url: req.url, method: req.method, roles },
          })
        } catch {}
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      ;(req as any).userPermissions = perms
      return handler(req, res)
    }
  }
}
