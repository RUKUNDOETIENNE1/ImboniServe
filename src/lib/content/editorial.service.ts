import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { slugify, ensureUniqueSlug } from './slug'
import type { ArticleType, ArticleStatus, EditorialRole } from './constants'
import { ARTICLE_TYPES, ARTICLE_STATUSES } from './constants'

export interface CreateArticleInput {
  type: string
  title: string
  subtitle?: string
  excerpt?: string
  body: string
  bodyFormat?: string
  topicId?: string
  tags?: string[]
  coverImageId?: string
  seoMeta?: any
  metadata?: any
  authorId?: string
}

export interface UpdateArticleInput {
  type?: string
  title?: string
  subtitle?: string
  slug?: string
  excerpt?: string
  body?: string
  bodyFormat?: string
  topicId?: string
  tags?: string[]
  coverImageId?: string
  seoMeta?: any
  metadata?: any
}

export interface ListArticlesOpts {
  status?: string
  type?: string
  topicId?: string
  q?: string
  page?: number
  pageSize?: number
}

interface TransitionRule {
  to: ArticleStatus
  requiredRoles: EditorialRole[]
  requiresNote?: boolean
  requiresScheduledAt?: boolean
}

const TRANSITIONS: Record<string, TransitionRule[]> = {
  DRAFT: [
    { to: 'REVIEW', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
    { to: 'ARCHIVED', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
  ],
  REVIEW: [
    { to: 'APPROVED', requiredRoles: ['REVIEWER', 'PUBLISHER'] },
    { to: 'REJECTED', requiredRoles: ['REVIEWER', 'PUBLISHER'], requiresNote: true },
    { to: 'DRAFT', requiredRoles: ['REVIEWER', 'PUBLISHER'] },
  ],
  APPROVED: [
    { to: 'SCHEDULED', requiredRoles: ['PUBLISHER'], requiresScheduledAt: true },
    { to: 'PUBLISHED', requiredRoles: ['PUBLISHER'] },
  ],
  SCHEDULED: [
    { to: 'PUBLISHED', requiredRoles: ['PUBLISHER'] },
    { to: 'APPROVED', requiredRoles: ['PUBLISHER'] },
  ],
  PUBLISHED: [
    { to: 'UPDATED', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
    { to: 'ARCHIVED', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
  ],
  UPDATED: [
    { to: 'REVIEW', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
    { to: 'PUBLISHED', requiredRoles: ['PUBLISHER'] },
  ],
  ARCHIVED: [
    { to: 'DRAFT', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
  ],
  REJECTED: [
    { to: 'DRAFT', requiredRoles: ['EDITOR', 'REVIEWER', 'PUBLISHER'] },
  ],
}

const EDITABLE_STATUSES: ArticleStatus[] = ['DRAFT', 'UPDATED']
const SEO_EDITABLE_STATUSES: ArticleStatus[] = ['DRAFT', 'UPDATED', 'APPROVED', 'SCHEDULED']
const DELETABLE_STATUSES: ArticleStatus[] = ['DRAFT', 'REJECTED']

export class EditorialService {
  static validateType(type: string): void {
    if (!ARTICLE_TYPES.includes(type as ArticleType)) {
      throw new Error(`Invalid article type: ${type}`)
    }
  }

  static validateStatus(status: string): void {
    if (!ARTICLE_STATUSES.includes(status as ArticleStatus)) {
      throw new Error(`Invalid article status: ${status}`)
    }
  }

  static getValidTransitions(fromStatus: string): TransitionRule[] {
    return TRANSITIONS[fromStatus] || []
  }

  static canTransition(fromStatus: string, toStatus: string): boolean {
    const rules = TRANSITIONS[fromStatus] || []
    return rules.some((r) => r.to === toStatus)
  }

  static getTransitionRule(
    fromStatus: string,
    toStatus: string
  ): TransitionRule | undefined {
    const rules = TRANSITIONS[fromStatus] || []
    return rules.find((r) => r.to === toStatus)
  }

  static hasRoleForTransition(
    userRoles: string[],
    userEditorialRoles: string[],
    fromStatus: string,
    toStatus: string
  ): boolean {
    if (userRoles.includes('ADMIN')) return true
    const rule = this.getTransitionRule(fromStatus, toStatus)
    if (!rule) return false
    return rule.requiredRoles.some((r) => userEditorialRoles.includes(r))
  }

  static isBodyEditable(status: string): boolean {
    return EDITABLE_STATUSES.includes(status as ArticleStatus)
  }

  static isSeoEditable(status: string): boolean {
    return SEO_EDITABLE_STATUSES.includes(status as ArticleStatus)
  }

  static isDeletable(status: string): boolean {
    return DELETABLE_STATUSES.includes(status as ArticleStatus)
  }

  static async createArticle(actorId: string, input: CreateArticleInput) {
    this.validateType(input.type)

    const baseSlug = slugify(input.title)
    if (!baseSlug) throw new Error('Title must produce a valid slug')

    const existingSlugs = await (prisma as any).editorialArticle.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    })
    const slug = ensureUniqueSlug(
      baseSlug,
      existingSlugs.map((a: any) => a.slug)
    )

    const tagNames = input.tags || []
    const article = await (prisma as any).editorialArticle.create({
      data: {
        type: input.type,
        title: input.title,
        subtitle: input.subtitle || null,
        slug,
        excerpt: input.excerpt || null,
        body: input.body,
        bodyFormat: input.bodyFormat || 'MARKDOWN',
        status: 'DRAFT',
        authorId: input.authorId || actorId,
        topicId: input.topicId || null,
        coverImageId: input.coverImageId || null,
        tags: tagNames,
        seoMeta: input.seoMeta || null,
        metadata: input.metadata || null,
      },
    })

    await this.createTransition(article.id, '', 'DRAFT', actorId)

    if (tagNames.length > 0) {
      await this.syncTags(article.id, tagNames)
    }

    logger.info('Editorial article created', { articleId: article.id, slug, actorId })
    return article
  }

  static async getArticle(id: string) {
    return (prisma as any).editorialArticle.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
        topic: true,
        transitions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        articleTags: { include: { tag: true } },
        productLinks: { orderBy: { sortOrder: 'asc' } },
      },
    })
  }

  static async getArticleBySlug(slug: string) {
    return (prisma as any).editorialArticle.findUnique({
      where: { slug },
    })
  }

  static async updateArticle(
    id: string,
    input: UpdateArticleInput,
    actorId: string
  ) {
    const article = await (prisma as any).editorialArticle.findUnique({
      where: { id },
    })
    if (!article) throw new Error('Article not found')

    if (!this.isBodyEditable(article.status)) {
      throw new Error(`Cannot edit article in ${article.status} status`)
    }

    const data: any = {}
    if (input.type) {
      this.validateType(input.type)
      data.type = input.type
    }
    if (input.title !== undefined) data.title = input.title
    if (input.subtitle !== undefined) data.subtitle = input.subtitle || null
    if (input.excerpt !== undefined) data.excerpt = input.excerpt || null
    if (input.body !== undefined) data.body = input.body
    if (input.bodyFormat !== undefined) data.bodyFormat = input.bodyFormat
    if (input.topicId !== undefined) data.topicId = input.topicId || null
    if (input.coverImageId !== undefined) data.coverImageId = input.coverImageId || null
    if (input.metadata !== undefined) data.metadata = input.metadata || null

    if (input.seoMeta !== undefined && this.isSeoEditable(article.status)) {
      data.seoMeta = input.seoMeta || null
    }

    if (input.slug && input.slug !== article.slug) {
      if (article.status === 'PUBLISHED') {
        throw new Error('Cannot change slug of published article')
      }
      const existing = await (prisma as any).editorialArticle.findUnique({
        where: { slug: input.slug },
      })
      if (existing) throw new Error('Slug already exists')
      data.slug = input.slug
    }

    if (input.tags !== undefined) {
      data.tags = input.tags
    }

    const updated = await (prisma as any).editorialArticle.update({
      where: { id },
      data,
    })

    if (input.tags !== undefined) {
      await (prisma as any).articleTag.deleteMany({ where: { articleId: id } })
      if (input.tags.length > 0) {
        await this.syncTags(id, input.tags)
      }
    }

    logger.info('Editorial article updated', { articleId: id, actorId })
    return updated
  }

  static async deleteArticle(id: string) {
    const article = await (prisma as any).editorialArticle.findUnique({
      where: { id },
    })
    if (!article) throw new Error('Article not found')

    if (!this.isDeletable(article.status)) {
      throw new Error(`Cannot delete article in ${article.status} status. Archive first.`)
    }

    await (prisma as any).editorialArticle.delete({ where: { id } })
    logger.info('Editorial article deleted', { articleId: id })
    return { success: true }
  }

  static async transition(
    articleId: string,
    toStatus: string,
    actorId: string,
    options?: { note?: string; scheduledAt?: string }
  ) {
    this.validateStatus(toStatus)

    const article = await (prisma as any).editorialArticle.findUnique({
      where: { id: articleId },
    })
    if (!article) throw new Error('Article not found')

    if (article.status === toStatus) {
      throw new Error(`Article is already in ${toStatus} status`)
    }

    if (!this.canTransition(article.status, toStatus)) {
      throw new Error(`Invalid transition from ${article.status} to ${toStatus}`)
    }

    const rule = this.getTransitionRule(article.status, toStatus)
    if (rule?.requiresNote && !options?.note) {
      throw new Error(`Note is required for transition to ${toStatus}`)
    }
    if (rule?.requiresScheduledAt && !options?.scheduledAt) {
      throw new Error(`scheduledAt is required for transition to SCHEDULED`)
    }

    const data: any = { status: toStatus }

    if (toStatus === 'REVIEW') {
      data.reviewerId = null
    }
    if (toStatus === 'APPROVED' || toStatus === 'REJECTED') {
      data.reviewerId = actorId
    }
    if (toStatus === 'SCHEDULED') {
      data.scheduledAt = new Date(options!.scheduledAt!)
    }
    if (toStatus === 'PUBLISHED') {
      data.publishedAt = new Date()
      data.publisherId = actorId
      data.scheduledAt = null
    }
    if (toStatus === 'ARCHIVED') {
      data.archivedAt = new Date()
    }
    if (toStatus === 'DRAFT' && article.status === 'ARCHIVED') {
      data.archivedAt = null
      data.publishedAt = null
    }
    if (toStatus === 'DRAFT' && article.status === 'REJECTED') {
      data.reviewerId = null
    }
    if (toStatus === 'UPDATED') {
      // Keep original publishedAt
    }

    const updated = await (prisma as any).editorialArticle.update({
      where: { id: articleId },
      data,
    })

    await this.createTransition(
      articleId,
      article.status,
      toStatus,
      actorId,
      options?.note
    )

    logger.info('Editorial article transitioned', {
      articleId,
      from: article.status,
      to: toStatus,
      actorId,
    })

    return updated
  }

  static async listArticles(opts: ListArticlesOpts) {
    const take = Math.min(opts?.pageSize || 20, 100)
    const skip = Math.max(((opts?.page || 1) - 1) * take, 0)

    const where: any = {}
    if (opts?.status) where.status = opts.status
    if (opts?.type) where.type = opts.type
    if (opts?.topicId) where.topicId = opts.topicId
    if (opts?.q) {
      where.OR = [
        { title: { contains: opts.q, mode: 'insensitive' } },
        { excerpt: { contains: opts.q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      (prisma as any).editorialArticle.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
        include: {
          author: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true, slug: true } },
        },
      }),
      (prisma as any).editorialArticle.count({ where }),
    ])

    return { items, total, page: opts?.page || 1, pageSize: take }
  }

  static async listPublished(opts: {
    type?: string
    types?: string[]
    topicId?: string
    tag?: string
    page?: number
    pageSize?: number
  }) {
    const take = Math.min(opts?.pageSize || 12, 50)
    const skip = Math.max(((opts?.page || 1) - 1) * take, 0)

    const where: any = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
    }

    if (opts?.type) where.type = opts.type
    if (opts?.types && opts.types.length > 0) where.type = { in: opts.types }
    if (opts?.topicId) where.topicId = opts.topicId
    if (opts?.tag) where.tags = { has: opts.tag }

    const [items, total] = await Promise.all([
      (prisma as any).editorialArticle.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }],
        take,
        skip,
        include: {
          author: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true, slug: true } },
        },
      }),
      (prisma as any).editorialArticle.count({ where }),
    ])

    return { items, total, page: opts?.page || 1, pageSize: take }
  }

  static async getPublishedBySlug(slug: string) {
    const article = await (prisma as any).editorialArticle.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
      },
      include: {
        author: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true, slug: true } },
        articleTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        productLinks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!article) return null

    let relatedArticles: any[] = []
    if (article.topicId) {
      relatedArticles = await (prisma as any).editorialArticle.findMany({
        where: {
          topicId: article.topicId,
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          id: { not: article.id },
        },
        orderBy: [{ publishedAt: 'desc' }],
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          excerpt: true,
          coverImageId: true,
          publishedAt: true,
        },
      })
    }

    return { article, relatedArticles }
  }

  static async getDashboardStats() {
    const [total, published, review, drafts] = await Promise.all([
      (prisma as any).editorialArticle.count(),
      (prisma as any).editorialArticle.count({ where: { status: 'PUBLISHED' } }),
      (prisma as any).editorialArticle.count({ where: { status: 'REVIEW' } }),
      (prisma as any).editorialArticle.count({ where: { status: 'DRAFT' } }),
    ])

    const recentTransitions = await (prisma as any).contentTransition.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        article: { select: { id: true, title: true, slug: true, type: true } },
      },
    })

    return { total, published, review, drafts, recentTransitions }
  }

  static async setProductLinks(
    articleId: string,
    links: Array<{
      productKey: string
      productLabel?: string
      linkType: string
      sortOrder: number
    }>
  ) {
    await (prisma as any).articleProductLink.deleteMany({
      where: { articleId },
    })

    if (links.length === 0) return []

    const created = await (prisma as any).articleProductLink.createMany({
      data: links.map((l) => ({
        articleId,
        productKey: l.productKey,
        productLabel: l.productLabel || null,
        linkType: l.linkType || 'MENTIONED',
        sortOrder: l.sortOrder || 0,
      })),
    })

    return (prisma as any).articleProductLink.findMany({
      where: { articleId },
      orderBy: { sortOrder: 'asc' },
    })
  }

  static async publishScheduled() {
    const due = await (prisma as any).editorialArticle.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
    })

    const results: Array<{ id: string; slug: string; success: boolean }> = []

    for (const article of due) {
      try {
        await this.transition(article.id, 'PUBLISHED', 'system', {})
        results.push({ id: article.id, slug: article.slug, success: true })
      } catch (err) {
        logger.error('Failed to auto-publish scheduled article', {
          articleId: article.id,
          error: (err as Error).message,
        })
        results.push({ id: article.id, slug: article.slug, success: false })
      }
    }

    return results
  }

  private static async createTransition(
    articleId: string,
    fromStatus: string,
    toStatus: string,
    actorId: string,
    note?: string
  ) {
    return (prisma as any).contentTransition.create({
      data: {
        articleId,
        fromStatus,
        toStatus,
        actorId,
        note: note || null,
      },
    })
  }

  private static async syncTags(articleId: string, tagNames: string[]) {
    for (const name of tagNames) {
      const slug = slugify(name)
      if (!slug) continue

      let tag = await (prisma as any).tag.findUnique({ where: { slug } })
      if (!tag) {
        tag = await (prisma as any).tag.create({
          data: { name, slug },
        })
      }

      const existing = await (prisma as any).articleTag.findUnique({
        where: { articleId_tagId: { articleId, tagId: tag.id } },
      })
      if (!existing) {
        await (prisma as any).articleTag.create({
          data: { articleId, tagId: tag.id },
        })
      }
    }
  }
}
