import { prisma } from '@/lib/prisma'
import type { CreateInventoryItemInput, UpdateInventoryItemInput, InventoryUpdateInput } from '@/lib/validations/inventory.schema'

export class InventoryService {
  static async createItem(input: CreateInventoryItemInput) {
    return prisma.inventoryItem.create({
      data: input,
    })
  }

  static async getItems(businessId: string, activeOnly = true) {
    return prisma.inventoryItem.findMany({
      where: {
        businessId: businessId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        updates: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  static async getItemById(id: string, businessId?: string) {
    const where: any = { id }
    if (businessId) where.businessId = businessId

    return prisma.inventoryItem.findFirst({
      where,
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  }

  static async updateItem(id: string, input: UpdateInventoryItemInput, businessId?: string) {
    const where: any = { id }
    if (businessId) where.businessId = businessId

    return prisma.inventoryItem.update({
      where,
      data: input,
    })
  }

  static async deleteItem(id: string, businessId?: string) {
    const where: any = { id }
    if (businessId) where.businessId = businessId

    return prisma.inventoryItem.update({
      where,
      data: { isActive: false },
    })
  }

  static async recordUpdate(userId: string, businessId: string, input: InventoryUpdateInput) {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: input.inventoryItemId,
        businessId: businessId,
      },
    })

    if (!item) throw new Error('Inventory item not found')

    let newStock = item.currentStock

    switch (input.type) {
      case 'ADD':
        newStock += input.quantity
        break
      case 'REMOVE':
      case 'WASTE':
        newStock -= input.quantity
        break
      case 'ADJUSTMENT':
        newStock = input.quantity
        break
    }

    if (newStock < 0) throw new Error('Stock cannot be negative')

    const [update, updatedItem] = await prisma.$transaction([
      prisma.inventoryUpdate.create({
        data: {
          inventoryItemId: input.inventoryItemId,
          userId,
          businessId: businessId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
          notes: input.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: input.inventoryItemId },
        data: { currentStock: newStock },
      }),
    ])

    return { update, updatedItem }
  }

  static async getLowStockItems(businessId: string) {
    return prisma.inventoryItem.findMany({
      where: {
        businessId: businessId,
        isActive: true,
        currentStock: {
          lte: prisma.inventoryItem.fields.minStockLevel,
        },
      },
      orderBy: {
        currentStock: 'asc',
      },
    })
  }

  static async getStockAlerts(businessId: string) {
    const items = await prisma.$queryRaw<Array<{
      id: string
      name: string
      currentStock: number
      minStockLevel: number
      unit: string
    }>>`
      SELECT id, name, "currentStock", "minStockLevel", unit
      FROM "InventoryItem"
      WHERE "businessId" = ${businessId}
        AND "isActive" = true
        AND "currentStock" <= "minStockLevel"
      ORDER BY ("currentStock" / "minStockLevel") ASC
    `

    return items.map(item => ({
      ...item,
      alertLevel: item.currentStock === 0 ? 'CRITICAL' : 
                  item.currentStock < item.minStockLevel * 0.5 ? 'HIGH' : 'MEDIUM',
    }))
  }
}
