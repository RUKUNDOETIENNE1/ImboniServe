import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { UserRole } from '@prisma/client'
import type { ResponsiblePerson } from './types'

const PRIORITY_ROLES: UserRole[] = [
  'KITCHEN_MANAGER',
  'SUPERVISOR',
  'MANAGER',
  'ADMIN',
  'OWNER',
]

export class GuardianResponsibilityRouter {
  static async route(
    businessId: string,
    decisionLevel: string
  ): Promise<ResponsiblePerson | null> {
    try {
      const staff = await prisma.user.findMany({
        where: {
          businessId,
          isActive: true,
          whatsappEnabled: true,
          roles: { hasSome: PRIORITY_ROLES },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          whatsappNumber: true,
          roles: true,
        },
      })

      if (staff.length === 0) {
        const owner = await prisma.user.findFirst({
          where: {
            businessId,
            isActive: true,
            roles: { has: 'OWNER' },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            whatsappNumber: true,
            roles: true,
          },
        })

        if (owner) {
          return {
            userId: owner.id,
            role: 'OWNER',
            name: owner.name,
            phone: owner.phone,
            whatsappNumber: owner.whatsappNumber,
          }
        }

        logger.warn('[Guardian] No eligible staff found for business', { businessId })
        return null
      }

      const sorted = [...staff].sort((a, b) => {
        const aPriority = PRIORITY_ROLES.findIndex(r => a.roles.includes(r as any))
        const bPriority = PRIORITY_ROLES.findIndex(r => b.roles.includes(r as any))
        return aPriority - bPriority
      })

      if (decisionLevel === 'ESCALATE') {
        const manager = sorted.find(s =>
          s.roles.includes('MANAGER' as any) ||
          s.roles.includes('ADMIN' as any) ||
          s.roles.includes('OWNER' as any)
        )
        const chosen = manager || sorted[0]
        const role = chosen.roles.find(r => PRIORITY_ROLES.includes(r as any)) || 'STAFF'
        return {
          userId: chosen.id,
          role,
          name: chosen.name,
          phone: chosen.phone,
          whatsappNumber: chosen.whatsappNumber,
        }
      }

      const chosen = sorted[0]
      const role = chosen.roles.find(r => PRIORITY_ROLES.includes(r as any)) || 'STAFF'
      return {
        userId: chosen.id,
        role,
        name: chosen.name,
        phone: chosen.phone,
        whatsappNumber: chosen.whatsappNumber,
      }
    } catch (error: any) {
      logger.error('[Guardian] Responsibility routing failed', { error: error.message, businessId })
      return null
    }
  }
}
