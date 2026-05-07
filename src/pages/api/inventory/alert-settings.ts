import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const businessId = (session.user as any).businessId
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' })
  }

  if (req.method === 'GET') {
    // Return default settings (client will use localStorage for persistence)
    const defaultSettings = {
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      emailRecipients: [],
      whatsappNumbers: [],
      criticalThreshold: 10,
      warningThreshold: 25
    }

    return res.status(200).json({ settings: defaultSettings })
  } else if (req.method === 'POST') {
    // Settings saved on client-side (localStorage)
    // This endpoint just acknowledges the save
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
