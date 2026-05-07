import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage.service'
import formidable, { Fields, Files, File as FormidableFile } from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = session.user as any
    const businessId = user.businessId

    if (!businessId) {
      return res.status(400).json({ error: 'No business associated with user' })
    }

    // Check storage limit (Phase 2)
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        storageUsedBytes: true,
        plan: {
          select: {
            storageGBLimit: true
          }
        }
      }
    });

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    })

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: any, fields: Fields, files: Files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const fileArray = files.file as FormidableFile[]
    const file = fileArray?.[0]
    const mediaType = (fields.type as string[])?.[0] || 'IMAGE'

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath)
    const filename = file.originalFilename || 'upload'
    const mimeType = file.mimetype || 'application/octet-stream'
    const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : ''
    
    // Check if file size would exceed storage limit (Phase 2)
    const storageLimit = (business?.plan?.storageGBLimit || 5) * 1024 * 1024 * 1024; // Convert GB to bytes
    const currentUsage = Number(business?.storageUsedBytes || 0);
    const fileSize = fileBuffer.length;
    
    if (currentUsage + fileSize > storageLimit) {
      fs.unlinkSync(file.filepath);
      return res.status(402).json({
        error: 'Storage limit exceeded',
        limit: storageLimit,
        current: currentUsage,
        fileSize: fileSize,
        message: `Upload would exceed your storage limit. Used: ${(currentUsage / (1024 * 1024)).toFixed(1)}MB, Limit: ${(storageLimit / (1024 * 1024 * 1024)).toFixed(1)}GB`
      });
    }

    let durationSec: number | null = null
    let thumbnailKey: string | null = null
    let probeWidth: number | undefined
    let probeHeight: number | undefined

    if (mediaType === 'VIDEO') {
      // Server-side duration validation via ffprobe
      const probe = await StorageService.probeVideo(fileBuffer, ext || '.mp4')
      durationSec = probe.durationSec
      probeWidth = probe.width
      probeHeight = probe.height

      const maxDuration = parseInt(process.env.MAX_VIDEO_DURATION_SEC || '30', 10)
      if (durationSec > maxDuration) {
        fs.unlinkSync(file.filepath)
        return res.status(400).json({
          error: `Video too long. Maximum duration is ${maxDuration} seconds (your video is ${durationSec}s).`,
        })
      }

      // Generate thumbnail via ffmpeg
      const thumbBuffer = await StorageService.generateThumbnailBuffer(fileBuffer, ext || '.mp4')
      if (thumbBuffer) {
        const thumbResult = await StorageService.uploadImage(
          thumbBuffer,
          `${filename}-thumb.jpg`,
          'image/jpeg',
          businessId
        )
        thumbnailKey = thumbResult.storageKey
      }
    }

    // Upload main file
    let uploadResult
    if (mediaType === 'VIDEO') {
      uploadResult = await StorageService.uploadVideo(fileBuffer, filename, mimeType, businessId)
    } else {
      uploadResult = await StorageService.uploadImage(fileBuffer, filename, mimeType, businessId)
    }

    // Clean up temp file
    fs.unlinkSync(file.filepath)

    // Create MediaAsset record
    const mediaAsset = await (prisma as any).mediaAsset.create({
      data: {
        businessId,
        type: mediaType,
        storageKey: uploadResult.storageKey,
        width: probeWidth ?? uploadResult.width,
        height: probeHeight ?? uploadResult.height,
        durationSec,
        thumbnailKey,
        sizeBytes: uploadResult.sizeBytes,
        mimeType: uploadResult.mimeType,
      },
    })

    // Increment storage usage (Phase 2 usage tracking)
    const totalSize = uploadResult.sizeBytes + (thumbnailKey ? fileSize * 0.1 : 0); // Estimate thumbnail ~10% of original
    await prisma.business.update({
      where: { id: businessId },
      data: {
        storageUsedBytes: { increment: Math.round(totalSize) }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: mediaAsset.id,
        type: mediaAsset.type,
        storageKey: mediaAsset.storageKey,
        publicUrl: StorageService.getPublicUrl(mediaAsset.storageKey),
        thumbnailUrl: thumbnailKey ? StorageService.getPublicUrl(thumbnailKey) : null,
        width: mediaAsset.width,
        height: mediaAsset.height,
        durationSec: mediaAsset.durationSec,
        sizeBytes: mediaAsset.sizeBytes,
      },
    })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
