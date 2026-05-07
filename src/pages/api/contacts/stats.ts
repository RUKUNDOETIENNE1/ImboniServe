import type { NextApiRequest, NextApiResponse } from 'next'
import { ContactService } from '@/lib/services/contact.service'
import { resolveBusinessContext } from '@/lib/api/business-context'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const stats = await ContactService.getContactStats(businessId)
    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Contact stats error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
