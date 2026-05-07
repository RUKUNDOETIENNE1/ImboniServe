import { prisma } from '@/lib/prisma'
import { FeatureFlagService, FEATURE_FLAGS } from '@/lib/services/feature-flag.service'

export type PostType = 'MICROBLOG' | 'PHOTO' | 'SHORT_VIDEO' | 'PROMO' | 'COMBO'
export type PostStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'REJECTED'

export interface CreatePostInput {
  type: PostType
  title?: string
  body?: string
  mediaIds?: string[]
  comboItems?: any
  promoMeta?: any
  publishAt?: string | null
  expireAt?: string | null
  targeting?: any
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  status?: PostStatus
}

export class CmsService {
  static async assertCmsEnabled(businessId: string) {
    const enabled = await FeatureFlagService.isEnabled(FEATURE_FLAGS.CMS_V1, businessId)
    if (!enabled) throw new Error('CMS feature is not enabled for this business')
  }

  static async createPost(businessId: string, userId: string, input: CreatePostInput) {
    await this.assertCmsEnabled(businessId)

    const now = new Date()
    const publishAt = input.publishAt ? new Date(input.publishAt) : null
    const expireAt = input.expireAt ? new Date(input.expireAt) : null

    const post = await (prisma as any).contentPost.create({
      data: {
        businessId,
        type: input.type,
        title: input.title || null,
        body: input.body || null,
        mediaIds: input.mediaIds || [],
        comboItems: input.comboItems || null,
        promoMeta: input.promoMeta || null,
        status: 'DRAFT',
        publishAt: publishAt || null,
        expireAt: expireAt || null,
        targeting: input.targeting || null,
        createdBy: userId,
        createdAt: now,
      } as any,
    })

    return post
  }

  static async updatePost(businessId: string, postId: string, input: UpdatePostInput) {
    await this.assertCmsEnabled(businessId)

    const data: any = {}
    if (input.type) data.type = input.type
    if (typeof input.title !== 'undefined') data.title = input.title
    if (typeof input.body !== 'undefined') data.body = input.body
    if (typeof input.mediaIds !== 'undefined') data.mediaIds = input.mediaIds
    if (typeof input.comboItems !== 'undefined') data.comboItems = input.comboItems
    if (typeof input.promoMeta !== 'undefined') data.promoMeta = input.promoMeta
    if (typeof input.publishAt !== 'undefined') data.publishAt = input.publishAt ? new Date(input.publishAt) : null
    if (typeof input.expireAt !== 'undefined') data.expireAt = input.expireAt ? new Date(input.expireAt) : null
    if (typeof input.targeting !== 'undefined') data.targeting = input.targeting
    if (typeof input.status !== 'undefined') data.status = input.status

    const post = await (prisma as any).contentPost.update({
      where: { id: postId },
      data,
    })
    return post
  }

  static async submitForReview(businessId: string, postId: string) {
    await this.assertCmsEnabled(businessId)
    const post = await (prisma as any).contentPost.update({ where: { id: postId }, data: { status: 'PENDING_REVIEW' } as any })
    return post
  }

  static async approvePost(actor: { roles: string[]; businessId?: string }, targetBusinessId: string, postId: string) {
    await this.assertCmsEnabled(targetBusinessId)

    const isAdmin = actor.roles.includes('ADMIN') || actor.roles.includes('PLATFORM_ADMIN')
    let allowed = isAdmin

    if (!allowed && actor.businessId === targetBusinessId) {
      const canSelfApprove = await FeatureFlagService.isEnabled(FEATURE_FLAGS.CMS_SELF_APPROVE_V1, targetBusinessId)
      if (canSelfApprove && actor.roles.includes('MANAGER')) allowed = true
    }

    if (!allowed) throw new Error('Not authorized to approve posts')

    const post = await (prisma as any).contentPost.update({ where: { id: postId }, data: { status: 'APPROVED' } as any })
    return post
  }

  static async listPosts(businessId: string, opts?: { status?: string; q?: string; page?: number; pageSize?: number }) {
    await this.assertCmsEnabled(businessId)
    const take = Math.min(opts?.pageSize || 20, 100)
    const skip = Math.max(((opts?.page || 1) - 1) * take, 0)

    const where: any = { businessId }
    if (opts?.status) where.status = opts.status
    if (opts?.q) {
      where.OR = [
        { title: { contains: opts.q, mode: 'insensitive' } },
        { body: { contains: opts.q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      (prisma as any).contentPost.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
      }),
      (prisma as any).contentPost.count({ where }),
    ])

    return { items, total, page: opts?.page || 1, pageSize: take }
  }
}
