import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage.service'
import { logger } from '@/lib/logger'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ALLOWED_DOC_TYPES = ['application/pdf']
const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 50
const MAX_DOC_MB = 15

export class PlatformMediaService {
  static async upload(
    file: Buffer,
    filename: string,
    mimeType: string,
    uploadedById: string,
    meta?: { altText?: string; caption?: string; attribution?: string; tags?: string[] }
  ) {
    let type: string
    let sizeMB = file.length / (1024 * 1024)

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      type = 'IMAGE'
      if (sizeMB > MAX_IMAGE_MB) throw new Error(`Image too large. Maximum: ${MAX_IMAGE_MB}MB`)
    } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      type = 'VIDEO'
      if (sizeMB > MAX_VIDEO_MB) throw new Error(`Video too large. Maximum: ${MAX_VIDEO_MB}MB`)
    } else if (ALLOWED_DOC_TYPES.includes(mimeType)) {
      type = 'DOCUMENT'
      if (sizeMB > MAX_DOC_MB) throw new Error(`Document too large. Maximum: ${MAX_DOC_MB}MB`)
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }

    const storageKey = `platform/${type.toLowerCase()}s/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${filename}`

    let finalStorageKey = storageKey

    if (StorageService['supabase']) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { data, error } = await StorageService['supabase'].storage
        .from(bucket)
        .upload(storageKey, file, {
          contentType: mimeType,
          upsert: false,
        })

      if (error) throw new Error(`Storage upload failed: ${error.message}`)
      finalStorageKey = data.path
    } else {
      const fs = require('fs')
      const path = require('path')
      const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey)
      const dir = path.dirname(localPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(localPath, file)
      finalStorageKey = `/uploads/${storageKey}`
    }

    const asset = await (prisma as any).platformMediaAsset.create({
      data: {
        type,
        storageKey: finalStorageKey,
        filename,
        altText: meta?.altText || null,
        caption: meta?.caption || null,
        attribution: meta?.attribution || null,
        sizeBytes: file.length,
        mimeType,
        tags: meta?.tags || [],
        uploadedById,
      },
    })

    logger.info('Platform media uploaded', { mediaId: asset.id, type, filename })
    return asset
  }

  static async listMedia(opts: {
    type?: string
    q?: string
    page?: number
    pageSize?: number
  }) {
    const take = Math.min(opts?.pageSize || 24, 100)
    const skip = Math.max(((opts?.page || 1) - 1) * take, 0)

    const where: any = {}
    if (opts?.type) where.type = opts.type
    if (opts?.q) {
      where.OR = [
        { filename: { contains: opts.q, mode: 'insensitive' } },
        { altText: { contains: opts.q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      (prisma as any).platformMediaAsset.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
      }),
      (prisma as any).platformMediaAsset.count({ where }),
    ])

    return { items, total, page: opts?.page || 1, pageSize: take }
  }

  static async getMedia(id: string) {
    return (prisma as any).platformMediaAsset.findUnique({ where: { id } })
  }

  static async updateMedia(
    id: string,
    input: { altText?: string; caption?: string; attribution?: string; tags?: string[] }
  ) {
    const data: any = {}
    if (input.altText !== undefined) data.altText = input.altText || null
    if (input.caption !== undefined) data.caption = input.caption || null
    if (input.attribution !== undefined) data.attribution = input.attribution || null
    if (input.tags !== undefined) data.tags = input.tags

    return (prisma as any).platformMediaAsset.update({ where: { id }, data })
  }

  static async deleteMedia(id: string) {
    const media = await (prisma as any).platformMediaAsset.findUnique({
      where: { id },
    })
    if (!media) throw new Error('Media not found')

    try {
      await StorageService.deleteFile(media.storageKey)
    } catch (err) {
      logger.warn('Failed to delete storage file', { storageKey: media.storageKey })
    }

    await (prisma as any).platformMediaAsset.delete({ where: { id } })
    return { success: true }
  }

  static getPublicUrl(storageKey: string): string {
    return StorageService.getPublicUrl(storageKey)
  }
}
