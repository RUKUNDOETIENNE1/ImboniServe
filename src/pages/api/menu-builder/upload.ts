import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { Fields, Files, File as FormidableFile } from 'formidable'
import fs from 'fs'
import crypto from 'crypto'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { StorageService } from '@/lib/services/storage.service'
import { SmartMenuBuilderService } from '@/lib/services/smart-menu-builder.service'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware/error-handler.middleware'
import { successResponse, errorResponse } from '@/lib/api/response-helpers'

// Disable Next.js body parser — formidable handles multipart parsing
export const config = {
  api: { bodyParser: false },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = parseInt(process.env.MENU_UPLOAD_MAX_MB || '25', 10) * 1024 * 1024

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed'))
  }

  // Resolve authenticated business context
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return
  const { businessId } = ctx

  // Parse multipart form
  const form = formidable({
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
  })

  let fields: Fields
  let files: Files
  try {
    [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: any, f: Fields, fls: Files) =>
        err ? reject(err) : resolve([f, fls])
      )
    })
  } catch (err: any) {
    return res.status(400).json(errorResponse(`Upload parsing failed: ${err.message}`))
  }

  // Extract the uploaded file
  const fileArray = files.file as FormidableFile[]
  const file = fileArray?.[0]
  if (!file) {
    return res.status(400).json(errorResponse('No file uploaded. Send a file in the "file" field.'))
  }

  const fileBuffer = fs.readFileSync(file.filepath)
  const filename = file.originalFilename || 'menu-upload'
  const mimeType = file.mimetype || 'application/octet-stream'

  // Validate file type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    fs.unlinkSync(file.filepath)
    return res.status(400).json(
      errorResponse(`Unsupported file type: ${mimeType}. Allowed: JPG, PNG, WebP, PDF.`)
    )
  }

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    fs.unlinkSync(file.filepath)
    return res.status(400).json(
      errorResponse(`File too large. Maximum ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB.`)
    )
  }

  try {
    // Compute SHA-256 hash for idempotency
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Check if this file was already uploaded
    const existing = await prisma.menuSourceDocument.findUnique({
      where: { fileHash },
      include: { candidates: { select: { id: true, status: true } } },
    })

    if (existing) {
      fs.unlinkSync(file.filepath)
      return res.status(200).json(
        successResponse(
          {
            sourceDocumentId: existing.id,
            status: existing.status,
            candidatesCount: existing.candidates.length,
            message: 'This file was already uploaded. Showing existing candidates.',
          },
          'File already processed'
        )
      )
    }

    // Upload to private storage
    const uploaded = await StorageService.uploadPrivateDocument(
      fileBuffer,
      filename,
      mimeType,
      businessId
    )

    // Create MenuSourceDocument record
    const sourceDocument = await prisma.menuSourceDocument.create({
      data: {
        businessId,
        filename,
        fileUrl: uploaded.storageKey,
        fileType: mimeType,
        fileHash,
        status: 'UPLOADED',
      },
    })

    // Clean up the temp file from formidable
    fs.unlinkSync(file.filepath)

    // Process the document: extract items and create candidates
    // This runs the full AI extraction pipeline
    try {
      await SmartMenuBuilderService.processDocument(sourceDocument.id)
    } catch (processingError: any) {
      // The document status is already set to FAILED by processDocument
      // We still return 200 so the UI can show the error state
      return res.status(200).json(
        successResponse(
          {
            sourceDocumentId: sourceDocument.id,
            status: 'FAILED',
            error: processingError.message || 'AI extraction failed',
            candidatesCount: 0,
          },
          'Upload succeeded but AI extraction failed'
        )
      )
    }

    // Fetch the created candidates
    const candidates = await SmartMenuBuilderService.getCandidates(businessId, 'PENDING')

    return res.status(201).json(
      successResponse(
        {
          sourceDocumentId: sourceDocument.id,
          status: 'COMPLETED',
          candidatesCount: candidates.length,
          candidates: candidates.filter(c => c.sourceDocumentId === sourceDocument.id),
        },
        `Upload successful. AI extracted ${candidates.filter(c => c.sourceDocumentId === sourceDocument.id).length} menu items.`
      )
    )
  } catch (error: any) {
    // Clean up temp file if it still exists
    try {
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath)
    } catch {
      // ignore
    }

    console.error('[menu-builder/upload] error', error)
    return res.status(500).json(errorResponse(error.message || 'Upload failed'))
  }
}

export default withErrorHandler(baseHandler)
