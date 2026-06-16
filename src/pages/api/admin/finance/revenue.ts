import type { NextApiRequest, NextApiResponse } from 'next'
import { LedgerDomain, PaymentGateway } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  const user = session.user as any
  if (!user.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden' })

  try {
    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate as string) : new Date()

    type LedgerSlice = { amountCents: number; currency: string; occurredAt: Date; gateway: PaymentGateway | null; domain: LedgerDomain }
    const entries = (await prisma.financialLedgerEntry.findMany({
      where: {
        eventType: 'PAYMENT_SUCCESS',
        occurredAt: { gte: start, lte: end },
      },
      select: {
        amountCents: true,
        currency: true,
        occurredAt: true,
        gateway: true,
        domain: true,
      },
    })) as unknown as LedgerSlice[]

    const subscriptionRevenue = entries.filter((e) => e.domain === LedgerDomain.SUBSCRIPTION).reduce((s, e) => s + e.amountCents, 0)
    const marketplaceRevenue = entries.filter((e) => e.domain === LedgerDomain.MARKETPLACE).reduce((s, e) => s + e.amountCents, 0)
    const totalRevenue = subscriptionRevenue + marketplaceRevenue

    const byGateway = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const key = e.gateway || 'UNKNOWN'
      acc[key] = (acc[key] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    const bySource = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const key = e.domain || 'UNKNOWN'
      acc[key] = (acc[key] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    const dailyRevenue = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const day = e.occurredAt ? new Date(e.occurredAt).toISOString().split('T')[0] : 'unknown'
      acc[day] = (acc[day] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    const weeklyKey = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = date.getUTCDay() || 7
      date.setUTCDate(date.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
    }

    const monthlyKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const annualKey = (d: Date) => `${d.getFullYear()}`

    const weeklyRevenue = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const dt = new Date(e.occurredAt)
      const key = weeklyKey(dt)
      acc[key] = (acc[key] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    const monthlyRevenue = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const dt = new Date(e.occurredAt)
      const key = monthlyKey(dt)
      acc[key] = (acc[key] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    const annualRevenue = entries.reduce((acc: Record<string, number>, e: LedgerSlice) => {
      const dt = new Date(e.occurredAt)
      const key = annualKey(dt)
      acc[key] = (acc[key] || 0) + e.amountCents
      return acc
    }, {} as Record<string, number>)

    res.status(200).json({
      startDate: start,
      endDate: end,
      totalRevenue,
      subscriptionRevenue,
      marketplaceRevenue,
      byGateway,
      bySource,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      annualRevenue,
      currency: 'RWF',
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
}
