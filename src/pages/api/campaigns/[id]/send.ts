import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { sendCampaignMessages } from '@/lib/whatsapp/campaign-scheduler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Campaign ID required' })
  }

  try {
    const metrics = await sendCampaignMessages(id)
    return res.status(200).json({ 
      success: true, 
      metrics,
      message: `Campaign sent: ${metrics.sent} messages delivered, ${metrics.failed} failed`
    })
  } catch (error) {
    console.error('Campaign send error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send campaign' 
    })
  }
}
