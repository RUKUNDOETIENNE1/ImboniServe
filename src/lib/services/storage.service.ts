import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import path from 'path'
import os from 'os'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

const MAX_VIDEO_DURATION_SEC = parseInt(process.env.MAX_VIDEO_DURATION_SEC || '30', 10)
const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '50', 10)
const MAX_IMAGE_SIZE_MB = 10
const MAX_FILE_SIZE_MB_GENERIC = 15

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export class StorageService {
  private static supabase = process.env.SUPABASE_STORAGE_URL && process.env.SUPABASE_STORAGE_KEY
    ? createClient(process.env.SUPABASE_STORAGE_URL, process.env.SUPABASE_STORAGE_KEY)
    : null

  /**
   * Upload video to storage
   * Returns: { storageKey, width, height, durationSec, sizeBytes, mimeType, thumbnailKey }
   */
  static async uploadVideo(
    file: Buffer,
    filename: string,
    mimeType: string,
    businessId: string
  ): Promise<{
    storageKey: string
    width?: number
    height?: number
    durationSec?: number
    sizeBytes: number
    mimeType: string
    thumbnailKey?: string
  }> {
    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      throw new Error(`Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`)
    }
    // Validate file size
    const sizeMB = file.length / (1024 * 1024)
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video too large. Maximum: ${MAX_VIDEO_SIZE_MB}MB`)
    }

    // Generate unique storage key
    const ext = path.extname(filename) || '.mp4'
    const hash = crypto.randomBytes(16).toString('hex')
    const storageKey = `videos/${businessId}/${Date.now()}-${hash}${ext}`

    if (this.supabase) {
      // Upload to Supabase Storage
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(storageKey, file, {
          contentType: mimeType,
          upsert: false,
        })

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      return {
        storageKey: data.path,
        sizeBytes: file.length,
        mimeType,
      }
    } else {
      // Local storage fallback (for development)
      const fs = require('fs')
      const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey)
      const dir = path.dirname(localPath)
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(localPath, file)

      return {
        storageKey: `/uploads/${storageKey}`,
        sizeBytes: file.length,
        mimeType,
      }
    }
  }

  /**
   * Upload image to storage
   */
  static async uploadImage(
    file: Buffer,
    filename: string,
    mimeType: string,
    businessId: string
  ): Promise<{
    storageKey: string
    width?: number
    height?: number
    sizeBytes: number
    mimeType: string
  }> {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
    }

    // Validate file size
    const sizeMB = file.length / (1024 * 1024)
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`Image too large. Maximum: ${MAX_IMAGE_SIZE_MB}MB`)
    }

    // Generate unique storage key
    const ext = path.extname(filename) || '.jpg'
    const hash = crypto.randomBytes(16).toString('hex')
    const storageKey = `images/${businessId}/${Date.now()}-${hash}${ext}`

    if (this.supabase) {
      // Upload to Supabase Storage
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(storageKey, file, {
          contentType: mimeType,
          upsert: false,
        })

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      return {
        storageKey: data.path,
        sizeBytes: file.length,
        mimeType,
      }
    } else {
      // Local storage fallback
      const fs = require('fs')
      const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey)
      const dir = path.dirname(localPath)
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(localPath, file)

      return {
        storageKey: `/uploads/${storageKey}`,
        sizeBytes: file.length,
        mimeType,
      }
    }
  }

  static async uploadFileGeneric(
    file: Buffer,
    filename: string,
    mimeType: string,
    businessId: string
  ): Promise<{
    storageKey: string
    sizeBytes: number
    mimeType: string
  }> {
    const sizeMB = file.length / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB_GENERIC) {
      throw new Error(`File too large. Maximum: ${MAX_FILE_SIZE_MB_GENERIC}MB`)
    }
    const ext = path.extname(filename) || ''
    const hash = crypto.randomBytes(16).toString('hex')
    const storageKey = `files/${businessId}/${Date.now()}-${hash}${ext}`
    if (this.supabase) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(storageKey, file, {
          contentType: mimeType,
          upsert: false,
        })
      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }
      return {
        storageKey: data.path,
        sizeBytes: file.length,
        mimeType,
      }
    } else {
      const fs = require('fs')
      const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey)
      const dir = path.dirname(localPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(localPath, file)
      return {
        storageKey: `/uploads/${storageKey}`,
        sizeBytes: file.length,
        mimeType,
      }
    }
  }

  /**
   * Get public URL for a storage key
   */
  static getPublicUrl(storageKey: string): string {
    if (this.supabase && !storageKey.startsWith('/uploads/')) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { data } = this.supabase.storage.from(bucket).getPublicUrl(storageKey)
      return data.publicUrl
    }
    
    // Local storage - already has /uploads/ prefix
    return storageKey
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(storageKey: string): Promise<void> {
    if (this.supabase && !storageKey.startsWith('/uploads/')) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
      const { error } = await this.supabase.storage.from(bucket).remove([storageKey])
      
      if (error) {
        throw new Error(`Storage delete failed: ${error.message}`)
      }
    } else {
      // Local storage
      const fs = require('fs')
      const localPath = path.join(process.cwd(), 'public', storageKey)
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath)
      }
    }
  }

  /**
   * Probe video duration and dimensions using ffprobe.
   * Writes buffer to a temp file, probes it, then cleans up.
   */
  static async probeVideo(fileBuffer: Buffer, ext: string = '.mp4'): Promise<{
    durationSec: number
    width?: number
    height?: number
  }> {
    const tmpPath = path.join(os.tmpdir(), `probe-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    fs.writeFileSync(tmpPath, fileBuffer)

    try {
      return await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tmpPath, (err, meta) => {
          if (err) return reject(err)
          const duration = meta.format.duration ?? 0
          const videoStream = meta.streams.find((s) => s.codec_type === 'video')
          resolve({
            durationSec: Math.ceil(duration),
            width: videoStream?.width,
            height: videoStream?.height,
          })
        })
      })
    } finally {
      fs.unlinkSync(tmpPath)
    }
  }

  /**
   * Generate a thumbnail from a video buffer at 1 second mark.
   * Returns the thumbnail as a Buffer (JPEG).
   */
  static async generateThumbnailBuffer(fileBuffer: Buffer, ext: string = '.mp4'): Promise<Buffer | null> {
    const tmpInput = path.join(os.tmpdir(), `thumb-in-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`)
    const tmpOutput = path.join(os.tmpdir(), `thumb-out-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`)
    fs.writeFileSync(tmpInput, fileBuffer)

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tmpInput)
          .seekInput(1)
          .frames(1)
          .size('480x?')
          .output(tmpOutput)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run()
      })
      const thumbBuffer = fs.readFileSync(tmpOutput)
      return thumbBuffer
    } catch {
      return null
    } finally {
      if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput)
      if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput)
    }
  }
}
