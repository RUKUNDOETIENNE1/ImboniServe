import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { SmartDiningSlipService } from '@/lib/services/smart-dining-slip.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = session.user as any
  const businessId = user.businessId

  if (!businessId) {
    return res.status(400).json({ error: 'No business associated with user' })
  }

  try {
    if (req.method === 'GET') {
      const template = await SmartDiningSlipService.getRestaurantTemplate(businessId)
      return res.status(200).json({ template: template || { templateType: 'MINIMAL' } })
    }

    if (req.method === 'POST') {
      const { templateType } = req.body

      if (!['MINIMAL', 'PREMIUM', 'LOCAL'].includes(templateType)) {
        return res.status(400).json({ error: 'Invalid template type' })
      }

      const template = await SmartDiningSlipService.setRestaurantTemplate(businessId, templateType)
      return res.status(200).json({ template, message: 'Template updated successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Template API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
