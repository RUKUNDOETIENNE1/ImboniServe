import { prisma } from '@/lib/prisma'

export class AdminService {
  static async getPlatformOverview() {
    const [
      totalRestaurants,
      totalUsers,
      totalSales,
      totalMarketplaceOrders,
      activeSubscriptions
    ] = await Promise.all([
      prisma.business.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.sale.count(),
      prisma.marketplaceOrder.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } })
    ])

    const salesRevenue = await prisma.sale.aggregate({
      _sum: {
        totalAmountCents: true
      },
      where: {
        isPaid: true
      }
    })

    const marketplaceRevenue = await prisma.marketplaceOrder.aggregate({
      _sum: {
        totalAmountCents: true
      },
      where: {
        paymentStatus: 'COMPLETED'
      }
    })

    const subscriptionRevenue = await prisma.subscription.aggregate({
      _sum: {
        amountCents: true
      },
      where: {
        status: 'ACTIVE'
      }
    })

    return {
      totalRestaurants,
      totalUsers,
      totalSales,
      totalMarketplaceOrders,
      activeSubscriptions,
      salesRevenue: salesRevenue._sum.totalAmountCents || 0,
      marketplaceRevenue: marketplaceRevenue._sum.totalAmountCents || 0,
      subscriptionRevenue: subscriptionRevenue._sum.amountCents || 0,
      totalRevenue: 
        (salesRevenue._sum.totalAmountCents || 0) +
        (marketplaceRevenue._sum.totalAmountCents || 0) +
        (subscriptionRevenue._sum.amountCents || 0)
    }
  }

  static async getRestaurants(filters?: {
    search?: string
    isActive?: boolean
    planId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.planId) where.planId = filters.planId
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const [restaurants, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          plan: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              users: true,
              sales: true,
              menuItems: true
            }
          }
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.business.count({ where })
    ])

    return { restaurants, total }
  }

  static async getUsers(filters?: {
    search?: string
    roles?: string[]
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.roles && filters.roles.length > 0) {
      where.roles = { hasSome: filters.roles }
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true
            }
          },
          ownedBusinesses: {
            select: {
              id: true,
              name: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    return { users, total }
  }

  static async getSubscriptions(filters?: {
    status?: string
    businessId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.status) where.status = filters.status
    if (filters?.businessId) where.businessId = filters.businessId

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          plan: true
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.subscription.count({ where })
    ])

    return { subscriptions, total }
  }

  static async getMarketplaceMetrics() {
    const [
      totalProducts,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      completedOrders
    ] = await Promise.all([
      prisma.marketplaceProduct.count({ where: { isAvailable: true } }),
      prisma.marketplaceOrder.count(),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.marketplaceOrder.count({ where: { status: 'PENDING' } }),
      prisma.marketplaceOrder.count({ where: { status: 'DELIVERED' } })
    ])

    const topProducts = await prisma.marketplaceProduct.findMany({
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: 10
    })

    return {
      totalProducts,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      completedOrders,
      topProducts
    }
  }

  static async updateRestaurantStatus(businessId: string, isActive: boolean) {
    return await prisma.business.update({
      where: { id: businessId },
      data: { isActive }
    })
  }

  static async updateUserStatus(userId: string, isActive: boolean) {
    return await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    })
  }

  static async updateUserRoles(userId: string, roles: string[]) {
    return await prisma.user.update({
      where: { id: userId },
      data: { roles: roles as any }
    })
  }
}
