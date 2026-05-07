import { NextApiRequest, NextApiResponse } from 'next'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { withRateLimit } from '@/lib/middleware/rateLimit.redis'
import { prisma } from '@/lib/prisma'
import { SecurityEventService } from '@/lib/services/security-event.service'
import { resolveBusinessContext } from '@/lib/api/business-context'
import bcrypt from 'bcryptjs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId: actorId, businessId, roles: creatorRoles } = ctx

  try {
    if (req.method === 'GET') {
      const { q, role, branchId, status } = req.query as { q?: string; role?: string; branchId?: string; status?: string }

      const where: any = { businessId }
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ]
      }
      if (status === 'active') where.isActive = true
      if (status === 'inactive') where.isActive = false
      if (branchId) where.primaryBranchId = branchId
      if (role) {
        if (role.startsWith('custom:')) {
          const customId = role.split(':')[1]
          const usersWithCustom = await prisma.userStaffRole.findMany({
            where: { businessId, staffRoleId: customId },
            select: { userId: true },
          })
          where.id = { in: (usersWithCustom as Array<{ userId: string }>).map((u) => u.userId) }
        } else {
          where.roles = { has: role }
        }
      }

      const staff = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          primaryBranchId: true,
          primaryBranch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json({ staff })
    }

    if (req.method === 'POST') {
      const { name, email, phone, password, role, branchId, customRoleId } = req.body as { name: string; email: string; phone: string; password?: string; role: string; branchId?: string; customRoleId?: string }

      if (!name || !email || !phone || !role) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: email.toLowerCase() }, { phone }] },
        select: { id: true },
      })
      if (existingUser) return res.status(400).json({ error: 'User with this email or phone already exists' })

      const pwd = password?.trim()
      if (!pwd) return res.status(400).json({ error: 'Password is required' })
      const hashedPassword = await bcrypt.hash(pwd, 10)

      if (role === 'OWNER' && !creatorRoles.includes('OWNER')) {
        return res.status(403).json({ error: 'Only Owner can create another Owner' })
      }

      const newStaff = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          phone,
          password: hashedPassword,
          roles: [role as any],
          businessId,
          isActive: true,
          primaryBranchId: branchId || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roles: true,
          isActive: true,
          lastLoginAt: true,
          primaryBranchId: true,
        },
      })

      if (customRoleId) {
        try {
          await prisma.userStaffRole.create({ data: { userId: newStaff.id, staffRoleId: customRoleId, businessId } })
        } catch (e) {
          console.error('Failed to assign custom role', e)
        }
      }

      await SecurityEventService.log({ userId: actorId, eventType: 'STAFF_CREATE' as any, metadata: { createdUserId: newStaff.id, role } })
      return res.status(201).json({ staff: newStaff })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Staff API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withRateLimit({ maxRequests: 20, windowMs: 60_000, keyPrefix: 'staff-mut' })(requirePermission('staff.manage')(handler))
