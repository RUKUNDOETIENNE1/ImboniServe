import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { fetchRates, getFallbackRates } from '@/lib/currency/exchange-rates'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { base } = req.query
  let baseCurrency = typeof base === 'string' && base ? base.toUpperCase() : null
  if (!baseCurrency) {
    const user = await prisma.user.findUnique({
      where: { email: String(session.user.email) },
      select: { business: { select: { currency: true } } }
    })
    baseCurrency = user?.business?.currency || 'RWF'
  }

  const baseToUse = baseCurrency || 'RWF'

  try {
    const { rates, fetchedAt } = await fetchRates(baseToUse)
    return res.status(200).json({ base: baseToUse, rates, lastUpdated: new Date(fetchedAt).toISOString() })
  } catch (error: any) {
    console.error('Currency rates error, using fallback rates:', error)
    const { rates, fetchedAt } = getFallbackRates(baseToUse)
    return res.status(200).json({ base: baseToUse, rates, lastUpdated: new Date(fetchedAt).toISOString() })
  }
}
