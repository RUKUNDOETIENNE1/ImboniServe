import { prisma } from '@/lib/prisma'
import { OutletType } from '@prisma/client'
import { QRGeneratorService } from './qr-generator.service'

export interface CreateOutletInput {
  businessId: string
  branchId?: string
  name: string
  type: OutletType
  description?: string
  address?: string
  city?: string
  district?: string
  phone?: string
}

export interface OutletWithStats {
  id: string
  name: string
  type: OutletType
  description?: string
  isActive: boolean
  qrCode?: string
  tablesCount: number
  activeSalesCount: number
  todayRevenueCents: number
}

export class OutletService {
  static async createOutlet(input: CreateOutletInput) {
    const outlet = await prisma.outlet.create({
      data: {
        businessId: input.businessId,
        branchId: input.branchId,
        name: input.name,
        type: input.type,
        description: input.description,
        address: input.address,
        city: input.city,
        district: input.district,
        phone: input.phone,
        isActive: true
      }
    })

    const qrCodeURL = QRGeneratorService.generateURL({
      branchId: input.businessId,
      outletId: outlet.id,
      mode: 'invenue'
    })

    await prisma.outlet.update({
      where: { id: outlet.id },
      data: { qrCode: qrCodeURL }
    })

    return { ...outlet, qrCode: qrCodeURL }
  }

  static async getOutlets(businessId: string, branchId?: string): Promise<OutletWithStats[]> {
    const outlets = await prisma.outlet.findMany({
      where: {
        businessId,
        ...(branchId && { branchId }),
        isActive: true
      },
      include: {
        tables: {
          select: { id: true }
        },
        sales: {
          where: {
            status: 'ACTIVE',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: {
            id: true,
            totalAmountCents: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return outlets.map(outlet => ({
      id: outlet.id,
      name: outlet.name,
      type: outlet.type,
      description: outlet.description || undefined,
      isActive: outlet.isActive,
      qrCode: outlet.qrCode || undefined,
      tablesCount: outlet.tables.length,
      activeSalesCount: outlet.sales.length,
      todayRevenueCents: outlet.sales.reduce((sum, s) => sum + s.totalAmountCents, 0)
    }))
  }

  static async getOutletById(outletId: string) {
    return await prisma.outlet.findUnique({
      where: { id: outletId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            currency: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        tables: {
          include: {
            seats: true,
            assignedWaiter: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
  }

  static async updateOutlet(outletId: string, data: Partial<CreateOutletInput>) {
    return await prisma.outlet.update({
      where: { id: outletId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.phone !== undefined && { phone: data.phone })
      }
    })
  }

  static async deactivateOutlet(outletId: string) {
    return await prisma.outlet.update({
      where: { id: outletId },
      data: { isActive: false }
    })
  }

  static async getOutletSales(outletId: string, startDate?: Date, endDate?: Date) {
    return await prisma.sale.findMany({
      where: {
        outletId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } })
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                category: true
              }
            }
          }
        },
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
