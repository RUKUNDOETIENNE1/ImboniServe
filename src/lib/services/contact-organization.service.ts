import { prisma } from '@/lib/prisma'
import { OrganizationType, Prisma } from '@prisma/client'

export interface CreateOrganizationInput {
  name: string
  type: OrganizationType
  description?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  district?: string
  country?: string
  latitude?: number
  longitude?: number
  industry?: string
  taxId?: string
  registrationNumber?: string
  tags?: string[]
  notes?: string
  logoUrl?: string
  customFields?: any
}

export interface UpdateOrganizationInput extends Partial<CreateOrganizationInput> {
  id: string
}

export interface OrganizationSearchFilters {
  type?: OrganizationType | OrganizationType[]
  city?: string
  tags?: string[]
  search?: string
  industry?: string
}

export class ContactOrganizationService {
  
  static async createOrganization(businessId: string, input: CreateOrganizationInput) {
    return prisma.contactOrganization.create({
      data: {
        ...input,
        businessId,
        tags: input.tags || [],
        country: input.country || 'RW',
      },
      include: {
        members: {
          include: {
            contact: true,
          },
        },
      },
    })
  }

  static async updateOrganization(businessId: string, input: UpdateOrganizationInput) {
    const { id, ...updateData } = input

    return prisma.contactOrganization.update({
      where: { 
        id,
        businessId,
      },
      data: updateData,
      include: {
        members: {
          include: {
            contact: true,
          },
        },
      },
    })
  }

  static async deleteOrganization(businessId: string, organizationId: string) {
    await prisma.contactOrganization.delete({
      where: { 
        id: organizationId,
        businessId,
      },
    })
  }

  static async getOrganization(businessId: string, organizationId: string) {
    return prisma.contactOrganization.findFirst({
      where: { 
        id: organizationId,
        businessId,
      },
      include: {
        members: {
          include: {
            contact: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        relationships: {
          include: {
            fromContact: true,
            toContact: true,
          },
        },
      },
    })
  }

  static async listOrganizations(
    businessId: string,
    filters: OrganizationSearchFilters = {},
    page = 1,
    limit = 50
  ) {
    const where: Prisma.ContactOrganizationWhereInput = {
      businessId,
    }

    if (filters.type) {
      where.type = Array.isArray(filters.type) 
        ? { in: filters.type }
        : filters.type
    }

    if (filters.city) {
      where.city = filters.city
    }

    if (filters.industry) {
      where.industry = filters.industry
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [organizations, total] = await Promise.all([
      prisma.contactOrganization.findMany({
        where,
        include: {
          members: {
            where: { isPrimary: true },
            include: {
              contact: true,
            },
          },
          _count: {
            select: {
              members: true,
              relationships: true,
            },
          },
        },
        orderBy: [
          { totalOrders: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactOrganization.count({ where }),
    ])

    return {
      organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async addMember(
    businessId: string,
    organizationId: string,
    contactId: string,
    role?: string,
    isPrimary = false
  ) {
    const organization = await prisma.contactOrganization.findFirst({
      where: { id: organizationId, businessId },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    if (isPrimary) {
      await prisma.organizationMember.updateMany({
        where: { organizationId },
        data: { isPrimary: false },
      })
    }

    return prisma.organizationMember.create({
      data: {
        contactId,
        organizationId,
        role,
        isPrimary,
      },
      include: {
        contact: true,
        organization: true,
      },
    })
  }

  static async removeMember(
    businessId: string,
    organizationId: string,
    contactId: string
  ) {
    const organization = await prisma.contactOrganization.findFirst({
      where: { id: organizationId, businessId },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    await prisma.organizationMember.deleteMany({
      where: {
        organizationId,
        contactId,
      },
    })
  }

  static async updateMember(
    businessId: string,
    memberId: string,
    updates: {
      role?: string
      isPrimary?: boolean
      isActive?: boolean
    }
  ) {
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { organization: true },
    })

    if (!member || member.organization.businessId !== businessId) {
      throw new Error('Member not found')
    }

    if (updates.isPrimary) {
      await prisma.organizationMember.updateMany({
        where: { organizationId: member.organizationId },
        data: { isPrimary: false },
      })
    }

    return prisma.organizationMember.update({
      where: { id: memberId },
      data: updates,
      include: {
        contact: true,
        organization: true,
      },
    })
  }

  static async getOrganizationStats(businessId: string) {
    const [
      totalOrganizations,
      byType,
      topByRevenue,
      topByOrders,
    ] = await Promise.all([
      prisma.contactOrganization.count({ where: { businessId } }),
      prisma.contactOrganization.groupBy({
        by: ['type'],
        where: { businessId },
        _count: true,
      }),
      prisma.contactOrganization.findMany({
        where: { businessId },
        orderBy: { totalRevenue: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          totalRevenue: true,
        },
      }),
      prisma.contactOrganization.findMany({
        where: { businessId },
        orderBy: { totalOrders: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          totalOrders: true,
        },
      }),
    ])

    const typeBreakdown = byType.reduce((acc, item) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      totalOrganizations,
      typeBreakdown,
      topByRevenue,
      topByOrders,
    }
  }

  static async updateOrganizationMetrics(
    organizationId: string,
    metrics: {
      totalRevenue?: number
      totalOrders?: number
      lastOrderDate?: Date
    }
  ) {
    return prisma.contactOrganization.update({
      where: { id: organizationId },
      data: metrics,
    })
  }
}
