import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification.service'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing order id' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return
    const userBusinessId = ctx.businessId
    const userRoles: string[] = ctx.roles || []

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { business: true }
    })

    if (!sale) return res.status(404).json({ error: 'Order not found' })

    const isAdmin = userRoles.includes('ADMIN')
    if (!isAdmin && userBusinessId && sale.businessId !== userBusinessId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await prisma.sale.update({
      where: { id },
      data: { readyAt: new Date() },
      select: {
        id: true,
        orderNumber: true,
        orderSource: true,
        customerPhone: true,
        readyAt: true
      }
    })

    // Optional customer WhatsApp notification
    if (sale.customerPhone) {
      const message = `✅ Order ${sale.orderNumber} is ready for pickup at ${sale.business.name}. Thank you!`
      try {
        await NotificationService.sendWhatsApp(sale.customerPhone, message)
      } catch (e) {
        console.warn('WhatsApp notify (ready) skipped:', e)
      }
    }

    return res.status(200).json({ success: true, order: updated })
  } catch (error) {
    console.error('Kitchen ready error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default requirePermission('orders.update')(handler)
