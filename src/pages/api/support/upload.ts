import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { StorageService } from '@/lib/services/storage.service'
import formidable, { Fields, Files, File as FormidableFile } from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

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

    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
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

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileBuffer = fs.readFileSync(file.filepath)
    const filename = file.originalFilename || 'upload'
    const mimeType = file.mimetype || 'application/octet-stream'

    if (!ALLOWED_TYPES.includes(mimeType)) {
      fs.unlinkSync(file.filepath)
      return res.status(400).json({
        error: `File type not allowed. Allowed types: images, PDF, Word, text`,
      })
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      fs.unlinkSync(file.filepath)
      return res.status(400).json({
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      })
    }

    let uploadResult
    if (mimeType.startsWith('image/')) {
      uploadResult = await StorageService.uploadImage(fileBuffer, filename, mimeType, businessId)
    } else {
      const hash = require('crypto').randomBytes(16).toString('hex')
      const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : ''
      const storageKey = `support/${businessId}/${Date.now()}-${hash}${ext}`

      if (StorageService['supabase']) {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads'
        const { data, error } = await (StorageService as any).supabase.storage
          .from(bucket)
          .upload(storageKey, fileBuffer, {
            contentType: mimeType,
            upsert: false,
          })

        if (error) {
          throw new Error(`Storage upload failed: ${error.message}`)
        }

        uploadResult = {
          storageKey: data.path,
          sizeBytes: fileBuffer.length,
          mimeType,
        }
      } else {
        const path = require('path')
        const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey)
        const dir = path.dirname(localPath)

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(localPath, fileBuffer)

        uploadResult = {
          storageKey: `/uploads/${storageKey}`,
          sizeBytes: fileBuffer.length,
          mimeType,
        }
      }
    }

    fs.unlinkSync(file.filepath)

    return res.status(200).json({
      success: true,
      url: StorageService.getPublicUrl(uploadResult.storageKey),
      mimeType: uploadResult.mimeType,
      sizeBytes: uploadResult.sizeBytes,
      filename,
    })
  } catch (error: any) {
    console.error('Support file upload error:', error)
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
