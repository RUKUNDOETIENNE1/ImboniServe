import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { ContextSnapshot } from './types'

export class GuardianContextGatherer {
  static async gather(
    businessId: string,
    promiseId: string,
    saleId: string
  ): Promise<ContextSnapshot> {
    const errors: string[] = []

    const [promise, sale, saleItems, station] = await Promise.all([
      prisma.servicePromise.findUnique({
        where: { id: promiseId },
        select: {
          state: true,
          startedAt: true,
          expectedAt: true,
          warningAt: true,
          criticalAt: true,
          warningAfterMinutes: true,
          breachAfterMinutes: true,
          actualMinutes: true,
        },
      }).catch((e: any) => { errors.push(`promise: ${e.message}`); return null }),

      prisma.sale.findUnique({
        where: { id: saleId },
        select: {
          orderNumber: true,
          status: true,
          kitchenStatus: true,
          table: { select: { number: true } },
        },
      }).catch((e: any) => { errors.push(`sale: ${e.message}`); return null }),

      prisma.saleItem.findMany({
        where: { saleId },
        select: {
          id: true,
          quantity: true,
          menuItem: { select: { name: true } },
        },
        take: 10,
      }).catch((e: any) => { errors.push(`saleItems: ${e.message}`); return [] }),

      prisma.ticketEvent.findFirst({
        where: { saleId, stationId: { not: null } },
        select: { station: { select: { name: true } } },
      }).catch((e: any) => { errors.push(`station: ${e.message}`); return null }),
    ])

    const now = new Date()
    const elapsedMinutes = promise
      ? Math.round((now.getTime() - promise.startedAt.getTime()) / 60000)
      : 0

    const topItems = (saleItems || [])
      .slice(0, 5)
      .map((item: any) => `${item.quantity}x ${item.menuItem?.name || 'Unknown'}`)

    const table = (sale as any)?.table
    return {
      orderNumber: sale?.orderNumber || 'Unknown',
      orderStatus: sale?.status || 'UNKNOWN',
      kitchenStatus: sale?.kitchenStatus || null,
      tableNumber: table?.number || null,
      elapsedMinutes,
      warningAfterMinutes: promise?.warningAfterMinutes ?? 0,
      breachAfterMinutes: promise?.breachAfterMinutes ?? 0,
      promiseState: promise?.state || 'UNKNOWN',
      itemsCount: saleItems?.length ?? 0,
      topItems,
      stationName: station?.station?.name || null,
      gatheredAt: now.toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}
