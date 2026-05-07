import type { NextApiRequest, NextApiResponse } from 'next'
import { DemoRequestService } from '@/lib/services/demo-request.service'
import { logger } from '@/lib/logger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, businessName, contact, message } = req.body

    // Validation
    if (!name || !businessName || !contact) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be 2-100 characters' })
    }

    if (businessName.length < 2 || businessName.length > 200) {
      return res.status(400).json({ error: 'Business name must be 2-200 characters' })
    }

    if (contact.length < 5 || contact.length > 100) {
      return res.status(400).json({ error: 'Contact must be 5-100 characters' })
    }

    if (message && message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' })
    }

    const request = await DemoRequestService.createRequest({
      name,
      businessName,
      contact,
      message
    })

    return res.status(201).json({ success: true, request })
  } catch (error: any) {
    logger.error('Failed to create demo request', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
