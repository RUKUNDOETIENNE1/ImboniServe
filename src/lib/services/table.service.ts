import { prisma } from '@/lib/prisma'

export interface Table {
  id: string
  number: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
  businessId: string
  currentOrderId?: string
  assignedWaiterId?: string
}

export class TableService {
  static async getTables(businessId: string) {
    const tables = await prisma.$queryRaw`
      SELECT 
        t.*,
        o.id as "currentOrderId",
        o."orderNumber",
        o."totalAmountCents",
        u.name as "waiterName"
      FROM "Table" t
      LEFT JOIN "Sale" o ON o."tableId" = t.id AND o.status = 'ACTIVE'
      LEFT JOIN "User" u ON t."assignedWaiterId" = u.id
      WHERE t."businessId" = ${businessId}
      ORDER BY t.number
    `
    return tables
  }

  static async createTable(data: {
    businessId: string
    number: string
    capacity: number
  }) {
    return await prisma.$executeRaw`
      INSERT INTO "Table" ("id", "businessId", "number", "capacity", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${data.businessId}, ${data.number}, ${data.capacity}, 'AVAILABLE', NOW(), NOW())
    `
  }

  static async updateTableStatus(tableId: string, status: string) {
    return await prisma.$executeRaw`
      UPDATE "Table"
      SET status = ${status}, "updatedAt" = NOW()
      WHERE id = ${tableId}
    `
  }

  static async assignWaiter(tableId: string, waiterId: string) {
    return await prisma.$executeRaw`
      UPDATE "Table"
      SET "assignedWaiterId" = ${waiterId}, "updatedAt" = NOW()
      WHERE id = ${tableId}
    `
  }

  static async getTableOrders(tableId: string) {
    return await prisma.sale.findMany({
      where: {
        tableId,
        status: { in: ['ACTIVE', 'COMPLETED'] }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getAvailableTables(businessId: string) {
    return await prisma.$queryRaw`
      SELECT * FROM "Table"
      WHERE "businessId" = ${businessId}
      AND status = 'AVAILABLE'
      ORDER BY number
    `
  }
}
