import type { NextApiRequest, NextApiResponse } from 'next'
import { OTPService } from '@/lib/services/otp.service'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().min(9),
  businessId: z.string().cuid(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
  const { phone, businessId } = parsed.data
  const result = await OTPService.sendOTP(phone, businessId)
  if (!result.success) return res.status(429).json({ error: result.error })
  return res.status(200).json({ success: true })
}
