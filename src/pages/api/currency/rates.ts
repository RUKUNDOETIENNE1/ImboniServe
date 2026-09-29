import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { getRatesForBaseCurrency } from '@/lib/services/currency-exchange.service'
import { ExchangeRateType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { base } = req.query
  const rateTypeRaw = typeof req.query.rateType === 'string' ? req.query.rateType.toUpperCase() : 'AVERAGE'
  const rateType = (['AVERAGE', 'BUYING', 'SELLING'].includes(rateTypeRaw) ? rateTypeRaw : 'AVERAGE') as ExchangeRateType
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
    const payload = await getRatesForBaseCurrency(baseToUse, { rateType })
    const currencies = Object.entries(payload.rates).map(([code, rate]) => ({
      code,
      rate,
      isDefault: code === payload.base,
    }))
    return res.status(200).json({
      base: payload.base,
      rateType: payload.rateType,
      rates: payload.rates,
      currencies,
      lastUpdated: payload.asOf,
    })
  } catch (error: any) {
    console.error('Currency rates error:', error)
    return res.status(503).json({
      error: 'Failed to fetch exchange rates',
      details: error?.message || 'Unknown FX error',
    })
  }
}
