import { prisma } from '@/lib/prisma'

export class MarketplaceService {
  static async getProducts(filters?: {
    supplierId?: string
    category?: string
    search?: string
    isAvailable?: boolean
    isFeatured?: boolean
  }) {
    const where: any = {}

    if (filters?.supplierId) where.supplierId = filters.supplierId
    if (filters?.category) where.category = filters.category
    if (filters?.isAvailable !== undefined) where.isAvailable = filters.isAvailable
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    return await prisma.marketplaceProduct.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            city: true,
            district: true,
            latitude: true,
            longitude: true,
            isVerified: true
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  static async getProductById(id: string) {
    return await prisma.marketplaceProduct.findUnique({
      where: { id },
      include: {
        supplier: true
      }
    })
  }

  static async createProduct(data: {
    supplierId: string
    name: string
    description?: string
    category?: string
    unit: string
    unitPriceCents: number
    minOrderQuantity?: number
    imageUrl?: string
    isAvailable?: boolean
    isFeatured?: boolean
  }) {
    return await prisma.marketplaceProduct.create({
      data,
      include: {
        supplier: true
      }
    })
  }

  static async updateProduct(id: string, data: Partial<{
    name: string
    description: string
    category: string
    unit: string
    unitPriceCents: number
    minOrderQuantity: number
    imageUrl: string
    isAvailable: boolean
    isFeatured: boolean
  }>) {
    return await prisma.marketplaceProduct.update({
      where: { id },
      data,
      include: {
        supplier: true
      }
    })
  }

  static async deleteProduct(id: string) {
    return await prisma.marketplaceProduct.delete({
      where: { id }
    })
  }

  static async createOrder(data: {
    businessId: string
    userId: string
    items: Array<{
      productId: string
      quantity: number
      unitPriceCents: number
    }>
    paymentMethod: string
    deliveryAddress?: string
    deliveryCity?: string
    deliveryDistrict?: string
    deliveryNotes?: string
    notes?: string
  }) {
    const totalAmountCents = data.items.reduce(
      (sum: number, item: { quantity: number; unitPriceCents: number }) => 
        sum + (item.quantity * item.unitPriceCents),
      0
    )

    const orderNumber = `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    return await prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        businessId: data.businessId,
        userId: data.userId,
        totalAmountCents,
        paymentMethod: data.paymentMethod as any,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity,
        deliveryDistrict: data.deliveryDistrict,
        deliveryNotes: data.deliveryNotes,
        notes: data.notes,
        items: {
          create: data.items.map((item: { productId: string; quantity: number; unitPriceCents: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.quantity * item.unitPriceCents
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        },
        business: true,
        user: true
      }
    })
  }

  static async getOrders(filters?: {
    businessId?: string
    userId?: string
    status?: string
  }) {
    const where: any = {}

    if (filters?.businessId) where.businessId = filters.businessId
    if (filters?.userId) where.userId = filters.userId
    if (filters?.status) where.status = filters.status

    return await prisma.marketplaceOrder.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        },
        business: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getOrderById(id: string) {
    return await prisma.marketplaceOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        },
        business: true,
        user: true
      }
    })
  }

  static async updateOrderStatus(id: string, status: string, paymentStatus?: string) {
    const data: any = { status }
    if (paymentStatus) data.paymentStatus = paymentStatus

    return await prisma.marketplaceOrder.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        }
      }
    })
  }

  static async getNearestSuppliers(filters: {
    latitude?: number
    longitude?: number
    district?: string
    city?: string
    limit?: number
  }) {
    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        isVerified: true
      },
      include: {
        marketplaceProducts: {
          where: {
            isAvailable: true
          },
          take: 5
        }
      }
    })

    if (filters.latitude && filters.longitude) {
      const suppliersWithDistance = suppliers
        .filter((s: any) => s.latitude && s.longitude)
        .map((supplier: any) => {
          const distance = this.calculateDistance(
            filters.latitude!,
            filters.longitude!,
            supplier.latitude,
            supplier.longitude
          )
          return { ...supplier, distance }
        })
        .sort((a: any, b: any) => a.distance - b.distance)

      const nearbySuppliers = suppliersWithDistance.slice(0, filters.limit || 10)

      const districtSuppliers = suppliers
        .filter((s: any) => 
          !s.latitude && 
          s.district === filters.district
        )
        .slice(0, Math.max(0, (filters.limit || 10) - nearbySuppliers.length))

      return [...nearbySuppliers, ...districtSuppliers]
    }

    if (filters.district) {
      return suppliers
        .filter((s: any) => s.district === filters.district)
        .slice(0, filters.limit || 10)
    }

    if (filters.city) {
      return suppliers
        .filter((s: any) => s.city === filters.city)
        .slice(0, filters.limit || 10)
    }

    return suppliers.slice(0, filters.limit || 10)
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}
