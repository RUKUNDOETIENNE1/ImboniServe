import { prisma } from '@/lib/prisma'

export class BranchService {
  static async getBranches(businessId: string) {
    return prisma.branch.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  static async createBranch(businessId: string, data: {
    name: string; address?: string; phone?: string; email?: string
    latitude?: number; longitude?: number
  }) {
    return prisma.branch.create({
      data: { ...data, businessId },
    })
  }

  static async updateBranch(branchId: string, businessId: string, data: Partial<{
    name: string; address: string; phone: string; email: string
    latitude: number; longitude: number; isActive: boolean; settings: unknown
  }>) {
    return prisma.branch.update({
      where: { id: branchId },
      data: data as any,
    })
  }

  static async setDefault(branchId: string, businessId: string) {
    // Branch default functionality removed - field doesn't exist in schema
    return prisma.branch.findUnique({ where: { id: branchId } })
  }

  static async ensureDefaultBranch(businessId: string) {
    const count = await prisma.branch.count({ where: { businessId } })
    if (count === 0) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true, address: true, phone: true },
      })
      await prisma.branch.create({
        data: {
          businessId,
          name: `${business?.name || 'Main'} – Main Branch`,
          address: business?.address,
          phone: business?.phone,
        },
      })
    }
  }
}
