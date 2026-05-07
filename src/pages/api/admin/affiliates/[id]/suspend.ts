import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.roles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query

    const affiliate = await prisma.affiliate.update({
      where: { id: id as string },
      data: { status: 'SUSPENDED' },
    })

    return res.status(200).json({ affiliate })
  } catch (error: any) {
    console.error('Suspend affiliate error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
