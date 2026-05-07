import { prisma } from '@/lib/prisma'
import { ContactType, ContactStatus } from '@prisma/client'

export interface CreateSegmentInput {
  name: string
  description?: string
  criteria: any
  color?: string
  icon?: string
  isAutoUpdate?: boolean
}

export interface UpdateSegmentInput extends Partial<CreateSegmentInput> {
  id: string
}

export class ContactSegmentService {
  
  static async createSegment(businessId: string, input: CreateSegmentInput) {
    const segment = await prisma.contactSegment.create({
      data: {
        ...input,
        businessId,
        isAutoUpdate: input.isAutoUpdate !== false,
      },
    })

    if (segment.isAutoUpdate) {
      await this.updateSegmentMembers(segment.id)
    }

    return segment
  }

  static async updateSegment(businessId: string, input: UpdateSegmentInput) {
    const { id, ...updateData } = input

    const segment = await prisma.contactSegment.update({
      where: { 
        id,
        businessId,
      },
      data: updateData,
    })

    if (segment.isAutoUpdate) {
      await this.updateSegmentMembers(segment.id)
    }

    return segment
  }

  static async deleteSegment(businessId: string, segmentId: string) {
    await prisma.contactSegment.delete({
      where: { 
        id: segmentId,
        businessId,
      },
    })
  }

  static async getSegment(businessId: string, segmentId: string) {
    return prisma.contactSegment.findFirst({
      where: { 
        id: segmentId,
        businessId,
      },
    })
  }

  static async listSegments(businessId: string) {
    return prisma.contactSegment.findMany({
      where: { businessId },
      orderBy: [
        { memberCount: 'desc' },
        { name: 'asc' },
      ],
    })
  }

  static async updateSegmentMembers(segmentId: string) {
    const segment = await prisma.contactSegment.findUnique({
      where: { id: segmentId },
    })

    if (!segment) {
      throw new Error('Segment not found')
    }

    const criteria = segment.criteria as any
    const where: any = {
      businessId: segment.businessId,
    }

    if (criteria.type) {
      where.type = Array.isArray(criteria.type) 
        ? { in: criteria.type }
        : criteria.type
    }

    if (criteria.status) {
      where.status = Array.isArray(criteria.status)
        ? { in: criteria.status }
        : criteria.status
    }

    if (criteria.city) {
      where.city = criteria.city
    }

    if (criteria.tags && criteria.tags.length > 0) {
      where.tags = {
        hasSome: criteria.tags,
      }
    }

    if (criteria.minActivityScore !== undefined) {
      where.activityScore = { 
        ...where.activityScore, 
        gte: criteria.minActivityScore 
      }
    }

    if (criteria.maxActivityScore !== undefined) {
      where.activityScore = { 
        ...where.activityScore, 
        lte: criteria.maxActivityScore 
      }
    }

    if (criteria.lastActivityBefore) {
      const date = new Date(criteria.lastActivityBefore)
      where.OR = [
        { lastActivityAt: { lt: date } },
        { lastActivityAt: null },
      ]
    }

    if (criteria.lastActivityAfter) {
      where.lastActivityAt = { 
        ...where.lastActivityAt, 
        gte: new Date(criteria.lastActivityAfter) 
      }
    }

    const count = await prisma.contact.count({ where })

    await prisma.contactSegment.update({
      where: { id: segmentId },
      data: {
        memberCount: count,
        lastUpdated: new Date(),
      },
    })

    return count
  }

  static async getSegmentMembers(
    businessId: string,
    segmentId: string,
    page = 1,
    limit = 50
  ) {
    const segment = await prisma.contactSegment.findFirst({
      where: { id: segmentId, businessId },
    })

    if (!segment) {
      throw new Error('Segment not found')
    }

    const criteria = segment.criteria as any
    const where: any = {
      businessId: segment.businessId,
    }

    if (criteria.type) {
      where.type = Array.isArray(criteria.type) 
        ? { in: criteria.type }
        : criteria.type
    }

    if (criteria.status) {
      where.status = Array.isArray(criteria.status)
        ? { in: criteria.status }
        : criteria.status
    }

    if (criteria.city) {
      where.city = criteria.city
    }

    if (criteria.tags && criteria.tags.length > 0) {
      where.tags = {
        hasSome: criteria.tags,
      }
    }

    if (criteria.minActivityScore !== undefined) {
      where.activityScore = { 
        ...where.activityScore, 
        gte: criteria.minActivityScore 
      }
    }

    if (criteria.maxActivityScore !== undefined) {
      where.activityScore = { 
        ...where.activityScore, 
        lte: criteria.maxActivityScore 
      }
    }

    if (criteria.lastActivityBefore) {
      const date = new Date(criteria.lastActivityBefore)
      where.OR = [
        { lastActivityAt: { lt: date } },
        { lastActivityAt: null },
      ]
    }

    if (criteria.lastActivityAfter) {
      where.lastActivityAt = { 
        ...where.lastActivityAt, 
        gte: new Date(criteria.lastActivityAfter) 
      }
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
        orderBy: [
          { activityScore: 'desc' },
          { lastActivityAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return {
      segment,
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async getDefaultSegments(businessId: string) {
    const segments = [
      {
        name: 'Active Clients',
        description: 'All active client contacts',
        criteria: { type: ContactType.CLIENT, status: ContactStatus.ACTIVE },
        color: '#10b981',
        icon: 'Users',
      },
      {
        name: 'Active Suppliers',
        description: 'All active supplier contacts',
        criteria: { type: ContactType.SUPPLIER, status: ContactStatus.ACTIVE },
        color: '#3b82f6',
        icon: 'Truck',
      },
      {
        name: 'Staff Members',
        description: 'All staff contacts',
        criteria: { type: ContactType.STAFF, status: ContactStatus.ACTIVE },
        color: '#8b5cf6',
        icon: 'Briefcase',
      },
      {
        name: 'Leads',
        description: 'Potential clients',
        criteria: { status: ContactStatus.LEAD },
        color: '#f59e0b',
        icon: 'Target',
      },
      {
        name: 'Inactive (30+ days)',
        description: 'Contacts with no activity in 30+ days',
        criteria: { 
          status: ContactStatus.ACTIVE,
          lastActivityBefore: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        color: '#ef4444',
        icon: 'AlertCircle',
      },
      {
        name: 'High Engagement',
        description: 'Contacts with activity score > 70',
        criteria: { minActivityScore: 70 },
        color: '#06b6d4',
        icon: 'TrendingUp',
      },
    ]

    const created = []
    for (const segmentData of segments) {
      const existing = await prisma.contactSegment.findFirst({
        where: {
          businessId,
          name: segmentData.name,
        },
      })

      if (!existing) {
        const segment = await this.createSegment(businessId, segmentData)
        created.push(segment)
      }
    }

    return created
  }

  static async refreshAllSegments(businessId: string) {
    const segments = await prisma.contactSegment.findMany({
      where: { 
        businessId,
        isAutoUpdate: true,
      },
    })

    for (const segment of segments) {
      await this.updateSegmentMembers(segment.id)
    }

    return segments.length
  }
}
