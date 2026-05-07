import { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'
import { SecurityEventService } from '@/lib/services/security-event.service'
import bcrypt from 'bcryptjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId: actorId, businessId, roles: actorRoles } = ctx
  const staffId = req.query.id as string

  try {
    const staffMember = await prisma.user.findFirst({
      where: { id: staffId, businessId },
      select: { id: true, roles: true, isActive: true },
    })
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' })

    const targetIsOwner = (staffMember.roles as string[]).includes('OWNER')
    const actorIsOwner = actorRoles.includes('OWNER')

    if (req.method === 'PUT') {
      const { name, email, phone, role, isActive, branchId, customRoleId, newPassword } = req.body as { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean; branchId?: string; customRoleId?: string; newPassword?: string }

      if (role === 'OWNER' && !actorIsOwner) {
        return res.status(403).json({ error: 'Only Owner can assign Owner role' })
      }
      if (targetIsOwner && !actorIsOwner) {
        return res.status(403).json({ error: 'Managers cannot modify the Owner' })
      }

      let passwordData: any = {}
      if (newPassword && newPassword.trim().length > 0) {
        if (targetIsOwner && !actorIsOwner) {
          return res.status(403).json({ error: 'Only Owner can reset Owner password' })
        }
        const hashed = await bcrypt.hash(newPassword.trim(), 10)
        passwordData = { password: hashed }
      }

      const updated = await prisma.user.update({
        where: { id: staffId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email: email.toLowerCase() } : {}),
          ...(phone ? { phone } : {}),
          ...(role ? { roles: [role] } : {}),
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
          ...(branchId !== undefined ? { primaryBranchId: branchId || null } : {}),
          ...passwordData,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          primaryBranchId: true,
        },
      })

      if (customRoleId !== undefined) {
        await prisma.userStaffRole.deleteMany({ where: { userId: staffId, businessId } })
        if (customRoleId) {
          try {
            await prisma.userStaffRole.create({ data: { userId: staffId, staffRoleId: customRoleId, businessId } })
          } catch (e) {
            console.error('Custom role assignment failed', e)
          }
        }
      }

      await SecurityEventService.log({ userId: actorId, eventType: 'STAFF_UPDATE' as any, metadata: { targetUserId: staffId, changes: { name, email, phone, role, isActive, branchId, customRoleId, passwordChanged: Boolean(newPassword) } } })
      return res.status(200).json({ staff: updated })
    }

    if (req.method === 'DELETE') {
      if (targetIsOwner && !actorIsOwner) {
        return res.status(403).json({ error: 'Managers cannot deactivate the Owner' })
      }
      await prisma.user.update({ where: { id: staffId }, data: { isActive: false } })
      await SecurityEventService.log({ userId: actorId, eventType: 'STAFF_SUSPEND' as any, metadata: { targetUserId: staffId } })
      return res.status(200).json({ message: 'Staff member deactivated' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Staff update error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('staff.manage')(handler)
