import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { listSystemRoles } from '@/lib/permissions/staff'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { userId, businessId } = ctx

  if (req.method === 'GET') {
    const system = listSystemRoles().map(r => ({ ...r, id: `system:${r.key}` }))
    const custom = await prisma.staffRole.findMany({
      where: { businessId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, key: true, name: true, description: true, color: true, icon: true, baseRole: true, isSystem: true, permissions: true },
    })
    return res.status(200).json({ system, custom })
  }

  if (req.method === 'POST') {
    const { name, description, baseRole, permissions, color, icon, key } = req.body as {
      name: string; description?: string; baseRole: string; permissions: any; color?: string; icon?: string; key?: string
    }

    if (!name || !baseRole || !permissions) return res.status(400).json({ error: 'Missing required fields' })

    // basic validation: baseRole must be a valid UserRole and map to a system role
    const validBaseRoles = ['OWNER', 'MANAGER', 'CASHIER', 'FRONT_DESK', 'WAITER', 'KITCHEN_MANAGER']
    if (!validBaseRoles.includes(baseRole)) return res.status(400).json({ error: 'Invalid base role' })

    const slug = (key || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await prisma.staffRole.findUnique({ where: { businessId_key: { businessId, key: slug } } as any })
    if (existing) return res.status(400).json({ error: 'Role with this key already exists' })

    const created = await prisma.staffRole.create({
      data: {
        businessId,
        key: slug,
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        baseRole: baseRole as any,
        isSystem: false,
        isActive: true,
        permissions,
        createdByUserId: userId,
      },
      select: { id: true, key: true, name: true, description: true, color: true, icon: true, baseRole: true, isSystem: true, permissions: true },
    })

    return res.status(201).json({ role: created })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('staff.manage')(handler)
