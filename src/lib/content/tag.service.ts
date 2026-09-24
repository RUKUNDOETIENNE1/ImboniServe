import { prisma } from '@/lib/prisma'
import { slugify } from './slug'

export class TagService {
  static async listTags(q?: string) {
    const where: any = {}
    if (q) {
      where.name = { contains: q, mode: 'insensitive' }
    }

    const tags = await (prisma as any).tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { articleTags: true } },
      },
    })

    return tags.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      articleCount: t._count?.articleTags || 0,
    }))
  }

  static async createTag(input: { name: string; description?: string }) {
    const slug = slugify(input.name)
    if (!slug) throw new Error('Name must produce a valid slug')

    const existing = await (prisma as any).tag.findUnique({ where: { slug } })
    if (existing) throw new Error('Tag already exists')

    return (prisma as any).tag.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
      },
    })
  }

  static async deleteTag(id: string) {
    await (prisma as any).tag.delete({ where: { id } })
    return { success: true }
  }
}
