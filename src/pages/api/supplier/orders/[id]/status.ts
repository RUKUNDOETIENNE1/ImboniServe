import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ingestProcurementShadowEvent } from '@/lib/die/business-as-plugin/procurement/procurement.shadow'
import { ingestSuppliersShadowEvent } from '@/lib/die/business-as-plugin/suppliers/suppliers.shadow'

const ALLOWED = new Set(['PENDING','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','REJECTED'])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  const { status, notes } = req.body as { status: string; notes?: string }
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Order id required' })
  if (!ALLOWED.has(status)) return res.status(400).json({ error: 'Invalid status' })

  try {
    const existing = await prisma.supplierOrder.findUnique({ where: { id: id as string }, select: { id: true, orderNumber: true, status: true, createdAt: true, businessId: true, supplierId: true } })
    const updated = await prisma.supplierOrder.update({
      where: { id },
      data: { status, notes: notes ?? undefined },
      select: { id: true, orderNumber: true, status: true, updatedAt: true }
    })
    // Shadow taps (feature-flagged, non-blocking)
    const businessId = existing?.businessId as string | undefined
    const supplierId = existing?.supplierId as string | undefined
    const orderNumber = existing?.orderNumber
    const createdAt = existing?.createdAt

    if (businessId) {
      // Suppliers events
      if (status === 'OUT_FOR_DELIVERY' || status === 'READY_FOR_DELIVERY') {
        ingestSuppliersShadowEvent({
          type: 'SUPPLIER_ORDER_ASSIGNED',
          businessId,
          supplierId,
          orderId: id as string,
          orderNumber,
        }).catch(() => {})
      }

      if (status === 'DELIVERED') {
        ingestSuppliersShadowEvent({
          type: 'SUPPLIER_DELIVERY_COMPLETED',
          businessId,
          supplierId,
          orderId: id as string,
          orderNumber,
        }).catch(() => {})

        ingestProcurementShadowEvent({
          type: 'PURCHASE_ORDER_RECEIVED',
          businessId,
          poId: id as string,
          supplierId,
          orderNumber,
        }).catch(() => {})

        ingestProcurementShadowEvent({
          type: 'GOODS_RECEIVED',
          businessId,
          poId: id as string,
          supplierId,
          orderNumber,
        }).catch(() => {})
      }

      if (status === 'REJECTED') {
        ingestProcurementShadowEvent({
          type: 'PURCHASE_ORDER_CANCELLED',
          businessId,
          poId: id as string,
          supplierId,
          orderNumber,
          reason: notes,
        }).catch(() => {})

        ingestSuppliersShadowEvent({
          type: 'SUPPLIER_DELIVERY_FAILED',
          businessId,
          supplierId,
          orderId: id as string,
          orderNumber,
          reason: notes,
        }).catch(() => {})
      }

      // Delay heuristic: status moved to OUT_FOR_DELIVERY or READY_FOR_DELIVERY or PROCESSING after long time
      if (createdAt && (status === 'OUT_FOR_DELIVERY' || status === 'READY_FOR_DELIVERY' || status === 'PROCESSING')) {
        const delayMs = Date.now() - new Date(createdAt).getTime()
        const threshold = 72 * 60 * 60 * 1000 // 72h heuristic
        if (delayMs > threshold) {
          ingestSuppliersShadowEvent({
            type: 'SUPPLIER_DELIVERY_DELAYED',
            businessId,
            supplierId,
            orderId: id as string,
            orderNumber,
            delayMs,
          }).catch(() => {})

          ingestProcurementShadowEvent({
            type: 'PROCUREMENT_DELAY',
            businessId,
            poId: id as string,
            supplierId,
            orderNumber,
            delayMs,
          }).catch(() => {})
        }
      }
    }

    return res.status(200).json({ success: true, order: updated })
  } catch (error) {
    console.error('Supplier order status error:', error)
    return res.status(500).json({ error: 'Failed to update order' })
  }
}
