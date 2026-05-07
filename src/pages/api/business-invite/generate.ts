import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { BusinessInviteService } from '@/lib/services/business-invite.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { business: true },
  })

  if (!user?.businessId) return res.status(400).json({ error: 'No business found' })

  const code = await BusinessInviteService.getOrCreateCode(user.businessId)
  const inviteUrl = `${process.env.APP_URL || process.env.NEXTAUTH_URL}/signup?inv=${code}`

  const whatsappText = encodeURIComponent(
    `Hi! I use Imboni Serve for my business and it's been great.\nJoin using my invite link and we both benefit: ${inviteUrl}`
  )

  return res.status(200).json({
    code,
    inviteUrl,
    whatsappShare: `https://wa.me/?text=${whatsappText}`,
  })
}
