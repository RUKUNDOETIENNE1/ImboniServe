import type { NextApiRequest, NextApiResponse } from 'next'
import { ExchangeRateType } from '@prisma/client'
import { convertMinorUnits, getCurrencyDefinition } from '@/lib/services/currency-exchange.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, currency, from, to, rateType } = req.query

    if (!amount) {
      return res.status(400).json({ error: 'Missing amount parameter' })
    }

    const amountMajor = parseFloat(amount as string)
    const fromCurrency = ((typeof from === 'string' && from) ? from : 'RWF').toUpperCase()
    const toCurrency = ((typeof to === 'string' && to) ? to : String(currency || '')).toUpperCase()
    const selectedRateType = (typeof rateType === 'string' ? rateType.toUpperCase() : 'AVERAGE') as ExchangeRateType

    if (!toCurrency) {
      return res.status(400).json({ error: 'Missing target currency (use ?to=XXX or ?currency=XXX)' })
    }

    if (Number.isNaN(amountMajor)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const fromDef = await getCurrencyDefinition(fromCurrency)
    const fromMinorFactor = Math.pow(10, fromDef.decimalDigits)
    const amountMinor = Math.round(amountMajor * fromMinorFactor)

    const conversion = await convertMinorUnits(amountMinor, fromCurrency, toCurrency, {
      rateType: ['AVERAGE', 'BUYING', 'SELLING'].includes(selectedRateType) ? selectedRateType : 'AVERAGE',
    })

    const toDef = await getCurrencyDefinition(toCurrency)
    const toMinorFactor = Math.pow(10, toDef.decimalDigits)
    const convertedAmount = conversion.toAmountMinor / toMinorFactor

    return res.status(200).json({
      from: fromCurrency,
      to: toCurrency,
      amount: amountMajor,
      amountMinor,
      convertedAmount,
      convertedAmountMinor: conversion.toAmountMinor,
      exchangeRate: Number(conversion.rateSnapshot.rate.toString()),
      exchangeRateType: conversion.rateSnapshot.rateType,
      exchangeRateSource: conversion.rateSnapshot.source,
      exchangeRateDate: conversion.rateSnapshot.effectiveDate.toISOString(),
      exchangeRateRecordId: conversion.rateSnapshot.sourceRecordId || null,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Currency conversion error:', error)
    return res.status(500).json({
      error: 'Failed to convert currency',
      details: error?.message || 'Unknown conversion error',
    })
  }
}
