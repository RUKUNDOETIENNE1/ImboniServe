import { prisma } from '@/lib/prisma'
import { slugify } from './slug'

export class TopicService {
  static async listTopics(includeInactive = false) {
    const where: any = {}
    if (!includeInactive) where.isActive = true

    const topics = await (prisma as any).topic.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return this.buildTree(topics)
  }

  static async createTopic(input: {
    name: string
    description?: string
    parentId?: string
    color?: string
    icon?: string
    sortOrder?: number
  }) {
    const slug = slugify(input.name)
    if (!slug) throw new Error('Name must produce a valid slug')

    const existing = await (prisma as any).topic.findUnique({ where: { slug } })
    if (existing) throw new Error('Topic slug already exists')

    if (input.parentId) {
      const parent = await (prisma as any).topic.findUnique({
        where: { id: input.parentId },
      })
      if (!parent) throw new Error('Parent topic not found')
    }

    return (prisma as any).topic.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        parentId: input.parentId || null,
        color: input.color || null,
        icon: input.icon || null,
        sortOrder: input.sortOrder || 0,
      },
    })
  }

  static async updateTopic(
    id: string,
    input: {
      name?: string
      description?: string
      parentId?: string
      color?: string
      icon?: string
      sortOrder?: number
      isActive?: boolean
    }
  ) {
    const topic = await (prisma as any).topic.findUnique({ where: { id } })
    if (!topic) throw new Error('Topic not found')

    const data: any = {}
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description || null
    if (input.parentId !== undefined) {
      if (input.parentId === id) throw new Error('Topic cannot be its own parent')
      data.parentId = input.parentId || null
    }
    if (input.color !== undefined) data.color = input.color || null
    if (input.icon !== undefined) data.icon = input.icon || null
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder
    if (input.isActive !== undefined) data.isActive = input.isActive

    return (prisma as any).topic.update({ where: { id }, data })
  }

  static async deleteTopic(id: string) {
    const articleCount = await (prisma as any).editorialArticle.count({
      where: { topicId: id },
    })

    if (articleCount > 0) {
      await (prisma as any).topic.update({
        where: { id },
        data: { isActive: false },
      })
      return { success: true, deactivated: true }
    }

    await (prisma as any).topic.delete({ where: { id } })
    return { success: true, deactivated: false }
  }

  private static buildTree(topics: any[], parentId: string | null = null): any[] {
    return topics
      .filter((t) => t.parentId === parentId)
      .map((t) => ({
        ...t,
        children: this.buildTree(topics, t.id),
      }))
  }
}
