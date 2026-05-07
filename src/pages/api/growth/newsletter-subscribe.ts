import type { NextApiRequest, NextApiResponse } from 'next'
import { NewsletterService } from '@/lib/services/newsletter.service'
import { logger } from '@/lib/logger'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { emailOrPhone, sourcePage } = req.body

    // Validation
    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Email or phone required' })
    }

    if (emailOrPhone.length < 5 || emailOrPhone.length > 100) {
      return res.status(400).json({ error: 'Invalid email or phone' })
    }

    const subscriber = await NewsletterService.subscribe({
      emailOrPhone,
      sourcePage
    })

    return res.status(201).json({ success: true, subscriber })
  } catch (error: any) {
    logger.error('Failed to subscribe to newsletter', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
