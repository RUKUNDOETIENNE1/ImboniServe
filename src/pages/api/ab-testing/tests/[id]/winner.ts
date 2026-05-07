import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  const { variantId } = req.body

  try {
    // Update test winner and mark completed
    const updated = await prisma.aBTest.update({
      where: { id: id as string },
      data: { status: 'COMPLETED', winnerVariantId: variantId },
      include: { variants: true }
    })

    // Apply variant changes to linked MenuItem if present
    const winner = updated.variants.find(v => v.id === variantId)
    if (winner && updated.menuItemId && winner.changes) {
      const priceCents = (winner.changes as any).priceCents || (winner.changes as any).price
      if (typeof priceCents === 'number') {
        await prisma.menuItem.update({
          where: { id: updated.menuItemId },
          data: { priceCents }
        })
      }
    }

    return res.status(200).json({ success: true, testId: id, winnerId: variantId })
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to select winner' })
  }
}
