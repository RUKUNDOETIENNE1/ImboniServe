import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { BranchService } from '@/lib/services/branch.service'
import { getUserEffectivePermissions, hasPermission } from '@/lib/permissions/staff'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const branches = await BranchService.getBranches(businessId)
    return res.status(200).json({ branches })
  }

  if (req.method === 'POST') {
    const userId = (session.user as any)?.id as string | undefined
    const roles: string[] = (session?.user as any)?.roles || []
    const isOwner = roles.includes('OWNER')
    if (!isOwner) {
      if (!userId) return res.status(401).json({ error: 'Unauthorized', code: 'NO_USER_ID' })
      const baseRoles = roles.filter(r => r !== 'ADMIN') as any[]
      const perms = await getUserEffectivePermissions(userId, businessId, baseRoles)
      if (!hasPermission(perms, 'settings.manage')) {
        return res.status(403).json({ error: 'Insufficient permissions', code: 'PERMISSION_DENIED' })
      }
    }
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    const branch = await BranchService.createBranch(businessId, parsed.data)
    return res.status(201).json({ branch })
  }

  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
}
