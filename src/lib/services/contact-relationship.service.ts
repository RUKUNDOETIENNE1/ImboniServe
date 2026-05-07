import { prisma } from '@/lib/prisma'
import { RelationshipType, Prisma } from '@prisma/client'

export interface CreateRelationshipInput {
  fromContactId?: string
  toContactId?: string
  fromOrgId?: string
  toOrgId?: string
  relationshipType: RelationshipType
  strength?: number
  organizationId?: string
  notes?: string
  metadata?: any
  isActive?: boolean
  startDate?: Date
  endDate?: Date
}

export interface UpdateRelationshipInput extends Partial<CreateRelationshipInput> {
  id: string
}

export interface RelationshipQuery {
  contactId?: string
  organizationId?: string
  relationshipType?: RelationshipType | RelationshipType[]
  isActive?: boolean
}

export class ContactRelationshipService {
  
  static async createRelationship(businessId: string, input: CreateRelationshipInput) {
    if (!input.fromContactId && !input.fromOrgId) {
      throw new Error('Either fromContactId or fromOrgId must be provided')
    }

    if (!input.toContactId && !input.toOrgId) {
      throw new Error('Either toContactId or toOrgId must be provided')
    }

    return prisma.contactRelationship.create({
      data: {
        ...input,
        businessId,
        strength: input.strength || 50,
        isActive: input.isActive !== false,
      },
      include: {
        fromContact: true,
        toContact: true,
        organization: true,
      },
    })
  }

  static async updateRelationship(businessId: string, input: UpdateRelationshipInput) {
    const { id, ...updateData } = input

    return prisma.contactRelationship.update({
      where: { 
        id,
        businessId,
      },
      data: updateData,
      include: {
        fromContact: true,
        toContact: true,
        organization: true,
      },
    })
  }

  static async deleteRelationship(businessId: string, relationshipId: string) {
    await prisma.contactRelationship.delete({
      where: { 
        id: relationshipId,
        businessId,
      },
    })
  }

  static async getRelationship(businessId: string, relationshipId: string) {
    return prisma.contactRelationship.findFirst({
      where: { 
        id: relationshipId,
        businessId,
      },
      include: {
        fromContact: {
          include: {
            organizationMemberships: {
              include: {
                organization: true,
              },
            },
          },
        },
        toContact: {
          include: {
            organizationMemberships: {
              include: {
                organization: true,
              },
            },
          },
        },
        organization: true,
      },
    })
  }

  static async listRelationships(
    businessId: string,
    query: RelationshipQuery = {},
    page = 1,
    limit = 50
  ) {
    const where: Prisma.ContactRelationshipWhereInput = {
      businessId,
    }

    if (query.contactId) {
      where.OR = [
        { fromContactId: query.contactId },
        { toContactId: query.contactId },
      ]
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId
    }

    if (query.relationshipType) {
      where.relationshipType = Array.isArray(query.relationshipType)
        ? { in: query.relationshipType }
        : query.relationshipType
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    const [relationships, total] = await Promise.all([
      prisma.contactRelationship.findMany({
        where,
        include: {
          fromContact: true,
          toContact: true,
          organization: true,
        },
        orderBy: [
          { strength: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactRelationship.count({ where }),
    ])

    return {
      relationships,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  static async getContactNetwork(businessId: string, contactId: string, depth = 2) {
    const visited = new Set<string>()
    const network: any = {
      nodes: [],
      edges: [],
    }

    const explore = async (currentContactId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentContactId)) {
        return
      }

      visited.add(currentContactId)

      const contact = await prisma.contact.findFirst({
        where: { id: currentContactId, businessId },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      })

      if (!contact) return

      network.nodes.push({
        id: contact.id,
        name: contact.name,
        type: contact.type,
        status: contact.status,
        role: contact.role,
        organizations: contact.organizationMemberships.map(m => ({
          id: m.organization.id,
          name: m.organization.name,
          type: m.organization.type,
        })),
        depth: currentDepth,
      })

      const relationships = await prisma.contactRelationship.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { fromContactId: currentContactId },
            { toContactId: currentContactId },
          ],
        },
        include: {
          fromContact: true,
          toContact: true,
        },
      })

      for (const rel of relationships) {
        network.edges.push({
          id: rel.id,
          from: rel.fromContactId,
          to: rel.toContactId,
          type: rel.relationshipType,
          strength: rel.strength,
        })

        const nextContactId = rel.fromContactId === currentContactId 
          ? rel.toContactId 
          : rel.fromContactId

        if (nextContactId && currentDepth < depth) {
          await explore(nextContactId, currentDepth + 1)
        }
      }
    }

    await explore(contactId, 0)

    return network
  }

  static async findPath(
    businessId: string,
    fromContactId: string,
    toContactId: string,
    maxDepth = 5
  ) {
    const visited = new Set<string>()
    const queue: Array<{ contactId: string; path: string[] }> = [
      { contactId: fromContactId, path: [fromContactId] },
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      
      if (current.contactId === toContactId) {
        const pathDetails = []
        for (let i = 0; i < current.path.length - 1; i++) {
          const relationship = await prisma.contactRelationship.findFirst({
            where: {
              businessId,
              OR: [
                { fromContactId: current.path[i], toContactId: current.path[i + 1] },
                { fromContactId: current.path[i + 1], toContactId: current.path[i] },
              ],
            },
            include: {
              fromContact: true,
              toContact: true,
            },
          })
          if (relationship) {
            pathDetails.push(relationship)
          }
        }
        return pathDetails
      }

      if (current.path.length >= maxDepth) {
        continue
      }

      if (visited.has(current.contactId)) {
        continue
      }

      visited.add(current.contactId)

      const relationships = await prisma.contactRelationship.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { fromContactId: current.contactId },
            { toContactId: current.contactId },
          ],
        },
      })

      for (const rel of relationships) {
        const nextContactId = rel.fromContactId === current.contactId 
          ? rel.toContactId 
          : rel.fromContactId

        if (nextContactId && !visited.has(nextContactId)) {
          queue.push({
            contactId: nextContactId,
            path: [...current.path, nextContactId],
          })
        }
      }
    }

    return null
  }

  static async getRelationshipStats(businessId: string) {
    const [
      totalRelationships,
      activeRelationships,
      byType,
      strongRelationships,
    ] = await Promise.all([
      prisma.contactRelationship.count({ where: { businessId } }),
      prisma.contactRelationship.count({ 
        where: { businessId, isActive: true } 
      }),
      prisma.contactRelationship.groupBy({
        by: ['relationshipType'],
        where: { businessId, isActive: true },
        _count: true,
      }),
      prisma.contactRelationship.count({
        where: { businessId, isActive: true, strength: { gte: 75 } },
      }),
    ])

    const typeBreakdown = byType.reduce((acc, item) => {
      acc[item.relationshipType] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      totalRelationships,
      activeRelationships,
      typeBreakdown,
      strongRelationships,
    }
  }

  static async updateRelationshipStrength(
    relationshipId: string,
    strength: number
  ) {
    return prisma.contactRelationship.update({
      where: { id: relationshipId },
      data: { strength: Math.max(0, Math.min(100, strength)) },
    })
  }

  static async getSupplierRelationships(businessId: string) {
    return prisma.contactRelationship.findMany({
      where: {
        businessId,
        relationshipType: RelationshipType.SUPPLIES_TO,
        isActive: true,
      },
      include: {
        fromContact: {
          include: {
            organizationMemberships: {
              include: {
                organization: true,
              },
            },
          },
        },
        toContact: true,
      },
      orderBy: {
        strength: 'desc',
      },
    })
  }

  static async getStaffHierarchy(businessId: string) {
    return prisma.contactRelationship.findMany({
      where: {
        businessId,
        relationshipType: RelationshipType.REPORTS_TO,
        isActive: true,
      },
      include: {
        fromContact: true,
        toContact: true,
      },
    })
  }
}
