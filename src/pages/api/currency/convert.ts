import type { NextApiRequest, NextApiResponse } from 'next'
import { convertFromRWF, getExchangeRate } from '@/lib/services/currency-conversion.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, currency } = req.query

    if (!amount || !currency) {
      return res.status(400).json({ error: 'Missing amount or currency parameter' })
    }

    const amountInRWF = parseFloat(amount as string)
    const targetCurrency = (currency as string).toUpperCase()

    if (isNaN(amountInRWF)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const rate = await getExchangeRate(targetCurrency)
    const convertedAmount = await convertFromRWF(amountInRWF, targetCurrency)

    return res.status(200).json({
      from: 'RWF',
      to: targetCurrency,
      amountRWF: amountInRWF,
      convertedAmount,
      exchangeRate: rate,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Currency conversion error:', error)
    return res.status(500).json({ error: 'Failed to convert currency' })
  }
}
