import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { getUserEffectivePermissions, hasPermission } from '@/lib/permissions/staff'
import { SecurityEventService } from '@/lib/services/security-event.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { ownedBusinesses: true, business: { select: { id: true } } }
  })

  if (!user) {
    return res.status(403).json({ error: 'No business found' })
  }

  let businessId: string | null = ((session.user as any).businessId as string | null) ?? null
  if (!businessId) businessId = (user as any).business?.id ?? null
  if (!businessId && user.ownedBusinesses.length > 0) businessId = user.ownedBusinesses[0].id
  if (!businessId) {
    return res.status(403).json({ error: 'No business found' })
  }

  const userId = (session.user as any).id as string
  const roles = ((session.user as any).roles as string[]) || []
  const baseRoles = roles.filter(r => ['OWNER','ADMIN','MANAGER','CASHIER','FRONT_DESK','WAITER','KITCHEN_MANAGER'].includes(r)) as any
  const isOwner = baseRoles.includes('OWNER')

  if (req.method === 'GET') {
    if (!isOwner) {
      const perms = await getUserEffectivePermissions(userId, businessId, baseRoles)
      if (!hasPermission(perms, 'settings.read')) {
        try {
          await SecurityEventService.log({
            userId,
            eventType: 'PERMISSION_DENIED',
            ip: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
            userAgent: (req.headers['user-agent'] as string) || null,
            metadata: { permission: 'settings.read', url: req.url, method: req.method, roles },
          })
        } catch {}
        return res.status(403).json({ error: 'Forbidden' })
      }
    }
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          whatsappOwnerReportsEnabled: true,
          whatsappClientSlipsEnabled: true,
          whatsappDailyCapClient: true,
          whatsappMonthlyBudgetCents: true
        }
      })

      return res.status(200).json({ settings: business })
    } catch (error) {
      console.error('Failed to fetch WhatsApp settings:', error)
      return res.status(500).json({ error: 'Failed to fetch settings' })
    }
  }

  if (req.method === 'POST') {
    if (!isOwner) {
      const perms = await getUserEffectivePermissions(userId, businessId, baseRoles)
      if (!hasPermission(perms, 'settings.manage')) {
        try {
          await SecurityEventService.log({
            userId,
            eventType: 'PERMISSION_DENIED',
            ip: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
            userAgent: (req.headers['user-agent'] as string) || null,
            metadata: { permission: 'settings.manage', url: req.url, method: req.method, roles },
          })
        } catch {}
        return res.status(403).json({ error: 'Forbidden' })
      }
    }
    const { ownerReportsEnabled, clientSlipsEnabled, dailyCapClient } = req.body

    if (typeof ownerReportsEnabled !== 'boolean' || typeof clientSlipsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid settings' })
    }

    if (dailyCapClient && (dailyCapClient < 10 || dailyCapClient > 500)) {
      return res.status(400).json({ error: 'Daily cap must be between 10 and 500' })
    }

    try {
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          whatsappOwnerReportsEnabled: ownerReportsEnabled,
          whatsappClientSlipsEnabled: clientSlipsEnabled,
          whatsappDailyCapClient: dailyCapClient || 50
        }
      })

      return res.status(200).json({ settings: updated })
    } catch (error) {
      console.error('Failed to update WhatsApp settings:', error)
      return res.status(500).json({ error: 'Failed to update settings' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
