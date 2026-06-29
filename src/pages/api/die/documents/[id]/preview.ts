import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { StorageService } from '@/lib/services/storage.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' })
    }

    const p: any = prisma
    const document = await p.scannedDocument.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        scanJob: { select: { sourceFileKey: true, sourceMime: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const storageKey = document.scanJob?.sourceFileKey
    const mimeType = document.scanJob?.sourceMime || 'application/octet-stream'
    if (!storageKey) return res.status(400).json({ error: 'Document has no source file' })

    const signedUrl = await StorageService.getPrivateSignedUrl(storageKey).catch(() => '')

    if (signedUrl) {
      res.setHeader('Cache-Control', 'private, max-age=600')
      res.setHeader('Location', signedUrl)
      return res.status(302).end()
    }

    const buffer = await StorageService.downloadPrivate(storageKey)

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'private, max-age=600')
    res.status(200).end(buffer)
  } catch (error: any) {
    console.error('[DIE] document preview error:', error)
    return res.status(500).json({ error: 'Failed to retrieve document preview' })
  }
}
