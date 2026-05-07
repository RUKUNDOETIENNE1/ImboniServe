import { prisma } from '@/lib/prisma'

export class CustomerService {
  static async createCustomer(data: {
    name: string
    phone: string
    email?: string
    businessId: string
  }) {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        businessId: data.businessId,
      },
    })
  }

  static async findByPhone(phone: string, businessId: string) {
    return await prisma.customer.findFirst({
      where: { phone, businessId: businessId },
    })
  }

  static async updateCustomerStats(customerId: string, orderAmount: number) {
    const loyaltyPoints = Math.floor(orderAmount / 1000)
    return await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: { increment: orderAmount },
        visitCount: { increment: 1 },
        loyaltyPoints: { increment: loyaltyPoints },
        lastVisit: new Date(),
      },
    })
  }

  static async getCustomerHistory(customerId: string) {
    return await prisma.sale.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })
  }

  static async getTopCustomers(businessId: string, limit: number = 10) {
    return await prisma.$queryRaw`
      SELECT 
        c.*,
        COUNT(s.id) as "orderCount",
        SUM(s."totalAmountCents") as "totalRevenue"
      FROM "Customer" c
      LEFT JOIN "Sale" s ON s."customerId" = c.id
      WHERE c."businessId" = ${businessId}
      GROUP BY c.id
      ORDER BY "totalRevenue" DESC
      LIMIT ${limit}
    `
  }

  static async redeemLoyaltyPoints(customerId: string, points: number) {
    // Use conditional update to avoid negative points
    return await prisma.customer.updateMany({
      where: { id: customerId, loyaltyPoints: { gte: points } },
      data: { loyaltyPoints: { decrement: points } },
    })
  }
}
