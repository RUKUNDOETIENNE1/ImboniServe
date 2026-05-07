import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

export function requireAuth(handler: ApiHandler): ApiHandler
export function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<any | null>
export function requireAuth(handlerOrReq: ApiHandler | NextApiRequest, res?: NextApiResponse): ApiHandler | Promise<any | null> {
  // Overload 1: direct session getter — requireAuth(req, res)
  if (res && typeof handlerOrReq !== 'function') {
    return (async () => {
      const session = await getServerSession(handlerOrReq as NextApiRequest, res, authOptions)
      if (!session || !session.user) {
        res.status(401).json({ error: 'Unauthorized' })
        return null
      }
      return session
    })()
  }

  // Overload 2: wrapper — requireAuth(handler)
  const handler = handlerOrReq as ApiHandler
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    ;(req as any).session = session
    return handler(req, res)
  }
}

export function requireRole(allowedRoles: string[], verifyInDb: boolean = false): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const session = await getServerSession(req, res, authOptions)
      
      if (!session || !session.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const userId = (session.user as any).id
      let userRoles = (session.user as any).roles || [(session.user as any).role]

      // For sensitive operations, verify roles against database
      if (verifyInDb && userId) {
        try {
          const { prisma } = await import('@/lib/prisma')
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { roles: true, isActive: true }
          })

          if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or inactive' })
          }

          // Use database roles instead of JWT roles for sensitive operations
          userRoles = user.roles
        } catch (error) {
          console.error('Role verification error:', error)
          return res.status(500).json({ error: 'Role verification failed' })
        }
      }

      // Validate that roles are from the allowed enum
      const validRoles = ['OWNER', 'ADMIN', 'CASHIER', 'WAITER', 'SUPERVISOR', 'MANAGER', 'FRONT_DESK', 'KITCHEN_MANAGER']
      const sanitizedRoles = userRoles.filter((role: string) => validRoles.includes(role))

      if (sanitizedRoles.length === 0) {
        return res.status(403).json({ error: 'No valid roles found' })
      }

      const hasRole = allowedRoles.some((role: string) => sanitizedRoles.includes(role))

      if (!hasRole) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
      }

      // Attach verified roles to request for downstream use
      ;(req as any).userRoles = sanitizedRoles

      return handler(req, res)
    }
  }
}
