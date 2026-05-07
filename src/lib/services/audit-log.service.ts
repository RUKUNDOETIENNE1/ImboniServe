import { prisma } from '@/lib/prisma'

export type AuditLogInput = {
  actorId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: any
}

export const AuditLogService = {
  async log(input: AuditLogInput) {
    try {
      const data: any = {
        actorId: input.actorId || null,
        action: String(input.action),
        entityType: String(input.entityType),
        entityId: input.entityId || null,
        metadata: input.metadata ?? null,
      }
      // Use any-cast to avoid type errors if Prisma Client not yet regenerated
      return await (prisma as any).auditLog.create({ data })
    } catch (e) {
      // Never throw from logging; this must not disrupt business logic
      return null
    }
  },
}
