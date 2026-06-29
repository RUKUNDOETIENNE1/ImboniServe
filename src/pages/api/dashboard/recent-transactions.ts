import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId } = ctx

  try {
    const limit = parseInt(req.query.limit as string) || 5

    const recentSales = await prisma.sale.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        totalAmountCents: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true
      }
    })

    const transactions = recentSales.map(sale => {
      const method = String(sale.paymentMethod || 'CASH')
      const status = String(sale.paymentStatus || 'PENDING')
      return {
        id: sale.id,
        type: method === 'MTN_MOBILE_MONEY' || method === 'AIRTEL_MONEY' ? 'MoMo' : method === 'CASH' ? 'Cash' : 'Card',
        name: method === 'MTN_MOBILE_MONEY' ? 'MoMo payment' : method === 'AIRTEL_MONEY' ? 'Airtel Money' : method === 'CASH' ? 'Cash payment' : 'Card payment',
        amount: (sale.totalAmountCents || 0) / 100,
        time: getTimeAgo(sale.createdAt as any),
        status: status === 'COMPLETED' ? 'completed' : 'pending'
      }
    })

    res.status(200).json({ transactions })
  } catch (error) {
    console.error('Recent transactions error:', error)
    res.status(500).json({ error: 'Failed to load recent transactions.' })
  }
}

export default requirePermission('reports.view')(handler)

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return `${seconds} sec ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
