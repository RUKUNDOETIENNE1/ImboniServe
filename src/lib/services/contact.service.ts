import { prisma } from '@/lib/prisma'
import { ContactType, ContactStatus, Prisma } from '@prisma/client'

export interface CreateContactInput {
  name: string
  phone?: string
  email?: string
  alternatePhone?: string
  whatsappNumber?: string
  type: ContactType
  status?: ContactStatus
  role?: string
  jobTitle?: string
  city?: string
  district?: string
  country?: string
  address?: string
  tags?: string[]
  notes?: string
  profileImageUrl?: string
  createdBy?: string
  assignedTo?: string
  source?: string
  sourceId?: string
  customFields?: any
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  id: string
}

export interface ContactSearchFilters {
  type?: ContactType | ContactType[]
  status?: ContactStatus | ContactStatus[]
  city?: string
  tags?: string[]
  search?: string
  assignedTo?: string
  createdAfter?: Date
  createdBefore?: Date
  lastActivityAfter?: Date
  lastActivityBefore?: Date
  minActivityScore?: number
  maxActivityScore?: number
}

export class ContactService {
  
  static async createContact(businessId: string, input: CreateContactInput) {
    const contact = await prisma.contact.create({
      data: {
        ...input,
        businessId,
        tags: input.tags || [],
        country: input.country || 'RW',
        status: input.status || ContactStatus.ACTIVE,
      },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
        activities: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    await this.logActivity(contact.id, businessId, {
      activityType: 'SYSTEM_EVENT',
      description: `Contact created: ${contact.name}`,
      source: 'system',
      performedBy: input.createdBy,
    })

    return contact
  }

  static async updateContact(businessId: string, input: UpdateContactInput) {
    const { id, ...updateData } = input

    const contact = await prisma.contact.update({
      where: { 
        id,
        businessId,
      },
      data: updateData,
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
        activities: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    await this.updateActivityScore(id)

    return contact
  }

  static async deleteContact(businessId: string, contactId: string) {
    await prisma.contact.delete({
      where: { 
        id: contactId,
        businessId,
      },
    })
  }

  static async getContact(businessId: string, contactId: string) {
    return prisma.contact.findFirst({
      where: { 
        id: contactId,
        businessId,
      },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
          },
        },
        relationshipsFrom: {
          include: {
            toContact: true,
            organization: true,
          },
        },
        relationshipsTo: {
          include: {
            fromContact: true,
            organization: true,
          },
        },
        activities: {
          take: 50,
          orderBy: { timestamp: 'desc' },
        },
      },
    })
  }

  static async listContacts(
    businessId: string,
    filters: ContactSearchFilters = {},
    page = 1,
    limit = 50
  ) {
    const where: Prisma.ContactWhereInput = {
      businessId,
    }

    if (filters.type) {
      where.type = Array.isArray(filters.type) 
        ? { in: filters.type }
        : filters.type
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status
    }

    if (filters.city) {
      where.city = filters.city
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { role: { contains: filters.search, mode: 'insensitive' } },
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.createdAfter) {
      where.createdAt = { ...(where.createdAt as any), gte: filters.createdAfter }
    }

    if (filters.createdBefore) {
      where.createdAt = { ...(where.createdAt as any), lte: filters.createdBefore }
    }

    if (filters.lastActivityAfter) {
      where.lastActivityAt = { ...(where.lastActivityAt as any), gte: filters.lastActivityAfter }
    }

    if (filters.lastActivityBefore) {
      where.lastActivityAt = { ...(where.lastActivityAt as any), lte: filters.lastActivityBefore }
    }

    if (filters.minActivityScore !== undefined) {
      where.activityScore = { ...(where.activityScore as any), gte: filters.minActivityScore }
    }

    if (filters.maxActivityScore !== undefined) {
      where.activityScore = { ...(where.activityScore as any), lte: filters.maxActivityScore }
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
          activities: {
            take: 3,
            orderBy: { timestamp: 'desc' },
          },
        },
        orderBy: [
          { lastActivityAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async searchContacts(businessId: string, query: string, limit = 20) {
    return prisma.contact.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { role: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [
        { activityScore: 'desc' },
        { lastActivityAt: 'desc' },
      ],
    })
  }

  static async logActivity(
    contactId: string,
    businessId: string,
    activity: {
      activityType: any
      description: string
      title?: string
      source?: string
      sourceId?: string
      performedBy?: string
      metadata?: any
      attachments?: string[]
    }
  ) {
    const contactActivity = await prisma.contactActivity.create({
      data: {
        contactId,
        businessId,
        ...activity,
        attachments: activity.attachments || [],
      },
    })

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        lastActivityAt: new Date(),
      },
    })

    await this.updateActivityScore(contactId)

    return contactActivity
  }

  static async updateActivityScore(contactId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivities = await prisma.contactActivity.count({
      where: {
        contactId,
        timestamp: { gte: thirtyDaysAgo },
      },
    })

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { lastActivityAt: true },
    })

    let score = 0

    if (contact?.lastActivityAt) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - contact.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const recencyScore = Math.max(0, 50 - daysSinceLastActivity)
      const frequencyScore = Math.min(50, recentActivities * 5)
      
      score = recencyScore + frequencyScore
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: { activityScore: score },
    })

    return score
  }

  static async getContactStats(businessId: string) {
    const [
      totalContacts,
      activeContacts,
      inactiveContacts,
      leads,
      byType,
      recentActivities,
    ] = await Promise.all([
      prisma.contact.count({ where: { businessId } }),
      prisma.contact.count({ 
        where: { businessId, status: ContactStatus.ACTIVE } 
      }),
      prisma.contact.count({ 
        where: { businessId, status: ContactStatus.INACTIVE } 
      }),
      prisma.contact.count({ 
        where: { businessId, status: ContactStatus.LEAD } 
      }),
      prisma.contact.groupBy({
        by: ['type'],
        where: { businessId },
        _count: true,
      }),
      prisma.contactActivity.count({
        where: {
          businessId,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const typeBreakdown = byType.reduce((acc, item) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      totalContacts,
      activeContacts,
      inactiveContacts,
      leads,
      typeBreakdown,
      recentActivities,
    }
  }

  static async bulkImport(
    businessId: string,
    contacts: CreateContactInput[],
    createdBy?: string
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const contactData of contacts) {
      try {
        await this.createContact(businessId, {
          ...contactData,
          createdBy,
          source: 'import',
        })
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${contactData.name}: ${error.message}`)
      }
    }

    return results
  }

  static async getInactiveContacts(businessId: string, daysSinceActivity = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceActivity)

    return prisma.contact.findMany({
      where: {
        businessId,
        status: ContactStatus.ACTIVE,
        OR: [
          { lastActivityAt: { lt: cutoffDate } },
          { lastActivityAt: null },
        ],
      },
      orderBy: { lastActivityAt: 'asc' },
    })
  }

  static async mergeContacts(
    businessId: string,
    primaryContactId: string,
    duplicateContactId: string
  ) {
    const [primary, duplicate] = await Promise.all([
      prisma.contact.findFirst({ where: { id: primaryContactId, businessId } }),
      prisma.contact.findFirst({ where: { id: duplicateContactId, businessId } }),
    ])

    if (!primary || !duplicate) {
      throw new Error('Contact not found')
    }

    await prisma.$transaction([
      prisma.contactActivity.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      }),
      prisma.contactRelationship.updateMany({
        where: { fromContactId: duplicateContactId },
        data: { fromContactId: primaryContactId },
      }),
      prisma.contactRelationship.updateMany({
        where: { toContactId: duplicateContactId },
        data: { toContactId: primaryContactId },
      }),
      prisma.organizationMember.updateMany({
        where: { contactId: duplicateContactId },
        data: { contactId: primaryContactId },
      }),
      prisma.contact.delete({
        where: { id: duplicateContactId },
      }),
    ])

    await this.updateActivityScore(primaryContactId)

    return primary
  }
}
