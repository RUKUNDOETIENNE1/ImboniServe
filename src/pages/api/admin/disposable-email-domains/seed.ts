import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware/auth.middleware'

const STARTER_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
]

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const items = STARTER_DOMAINS.map((d) => ({ domain: d }))
  const result = await prisma.disposableEmailDomain.createMany({ data: items, skipDuplicates: true })
  return res.status(200).json({ inserted: result.count })
}

export default requireAuth(requireRole(['ADMIN'])(handler))
