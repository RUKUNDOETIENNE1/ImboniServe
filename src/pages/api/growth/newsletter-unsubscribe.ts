import type { NextApiRequest, NextApiResponse } from 'next'
import { NewsletterService } from '@/lib/services/newsletter.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const { emailOrPhone } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!emailOrPhone || typeof emailOrPhone !== 'string' || emailOrPhone.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Invalid email or phone' })
    }

    const result = await NewsletterService.unsubscribe(emailOrPhone.trim())
    return res.status(200).json({ success: true, data: { emailOrPhone: result.emailOrPhone, isActive: result.isActive } })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to unsubscribe' })
  }
}
