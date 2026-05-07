import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body as any
      const updated = await prisma.aBTest.update({
        where: { id: id as string },
        data: { status },
      })
      return res.status(200).json({ success: true, test: updated })
    } catch (error: any) {
      console.error('Update A/B test error:', error)
      return res.status(500).json({ error: 'Failed to update test' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
