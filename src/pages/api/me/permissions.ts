import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getUserEffectivePermissions } from '@/lib/permissions/staff'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = (session.user as any).id as string | undefined
  const businessId = (session.user as any).businessId as string | null
  const roles = (((session.user as any).roles as string[]) || []).filter(r => ['OWNER','ADMIN','MANAGER','CASHIER','FRONT_DESK','WAITER','KITCHEN_MANAGER'].includes(r)) as any

  if (!userId || !businessId) return res.status(400).json({ error: 'Missing context' })

  const permissions = await getUserEffectivePermissions(userId, businessId, roles)
  return res.status(200).json({ permissions })
}
