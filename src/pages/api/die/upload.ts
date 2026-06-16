import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import formidable, { Fields, Files, File as FormidableFile } from 'formidable'
import fs from 'fs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage.service'
import { extractQueue } from '@/lib/die/queue/queues'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from '@/lib/die/services/document-lifecycle.service'

export const config = {
  api: { bodyParser: false },
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = parseInt(process.env.DIE_MAX_DOC_MB || '25', 10) * 1024 * 1024

type DocType = 'SUPPLIER_INVOICE' | 'DELIVERY_NOTE' | 'GENERIC'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

    const user = session.user as any
    const businessId = user.businessId as string | undefined
    if (!businessId) return res.status(400).json({ error: 'No business associated with user' })

    const form = formidable({ maxFileSize: MAX_FILE_SIZE, keepExtensions: true })
    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: any, f: Fields, fls: Files) => (err ? reject(err) : resolve([f, fls])))
    })

    const fileArray = files.file as FormidableFile[]
    const file = fileArray?.[0]
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    const fileBuffer = fs.readFileSync(file.filepath)
    const filename = file.originalFilename || 'upload'
    const mimeType = file.mimetype || 'application/octet-stream'

    if (!ALLOWED_TYPES.includes(mimeType)) {
      fs.unlinkSync(file.filepath)
      return res.status(400).json({ error: 'Unsupported file type' })
    }
    if (fileBuffer.length > MAX_FILE_SIZE) {
      fs.unlinkSync(file.filepath)
      return res.status(400).json({ error: `File too large. Max ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB` })
    }

    const dtRaw = fields.documentType as string | string[] | undefined
    const dtResolved = Array.isArray(dtRaw) ? dtRaw[0] : dtRaw
    const documentType = (dtResolved as DocType) || 'GENERIC'

    // Optional priority (1=high,5=normal,10=low)
    const prRaw = fields.priority as string | string[] | undefined
    const prResolved = Array.isArray(prRaw) ? prRaw[0] : prRaw
    const parsedPriority = prResolved ? parseInt(prResolved, 10) : 5
    const priority = [1, 5, 10].includes(parsedPriority) ? parsedPriority : 5

    // Compute SHA-256 hash for idempotency
    const sourceHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Idempotency check
    const p: any = prisma as any
    const existing = await p.scanJob.findFirst({ where: { businessId, sourceHash } })
    if (existing) {
      fs.unlinkSync(file.filepath)
      const existingDoc = await p.scannedDocument.findUnique({ where: { scanJobId: existing.id }, select: { id: true } })
      return res.status(200).json({ scanJobId: existing.id, scannedDocumentId: existingDoc?.id, status: existing.status })
    }

    // Store privately
    const uploaded = await StorageService.uploadPrivateDocument(fileBuffer, filename, mimeType, businessId)

    // Create ScanJob + canonical document skeleton in a single transaction
    const { scanJob, scannedDocument } = await p.$transaction(async (tx: any) => {
      const createdScanJob = await tx.scanJob.create({
        data: {
          businessId,
          createdByUserId: user.id,
          documentType: documentType as any,
          sourceFileKey: uploaded.storageKey,
          sourceMime: mimeType,
          sourceHash,
          status: 'UPLOADED' as any,
        },
      })

      const createdDocument = await tx.scannedDocument.create({
        data: {
          scanJobId: createdScanJob.id,
          businessId,
          documentType: documentType as any,
          status: 'UPLOADED' as any,
          lifecycleState: DocumentLifecycleState.UPLOADED,
        },
      })

      await tx.documentEventTimeline.create({
        data: {
          scannedDocumentId: createdDocument.id,
          stage: DocumentLifecycleService.stageForState(DocumentLifecycleState.UPLOADED),
          status: DocumentLifecycleState.UPLOADED,
          metadata: {
            documentType,
            priority,
            mimeType,
            sourceHash,
            uploadedAt: new Date().toISOString(),
          },
        },
      })

      await tx.documentProcessingLog.create({
        data: { scanJobId: createdScanJob.id, stage: 'upload', level: 'info', message: 'File uploaded' },
      })

      return { scanJob: createdScanJob, scannedDocument: createdDocument }
    })

    // Enqueue extraction (idempotent by jobId)
    await extractQueue.add(
      'extract',
      { scanJobId: scanJob.id, fileKey: uploaded.storageKey, mime: mimeType, documentType },
      { jobId: scanJob.id, priority }
    )

    fs.unlinkSync(file.filepath)

    return res.status(201).json({ scanJobId: scanJob.id, scannedDocumentId: scannedDocument.id, status: 'UPLOADED' })
  } catch (error: any) {
    console.error('[DIE] upload error', error)
    return res.status(500).json({ error: error.message || 'Upload failed' })
  }
}
