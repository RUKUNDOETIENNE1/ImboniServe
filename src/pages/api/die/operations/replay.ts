import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { DocumentReplayService, ReplayInProgressError, ReplayBlockedError } from '@/lib/die/services/document-replay.service'
import { DocumentLifecycleService } from '@/lib/die/services/document-lifecycle.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { documentId, stage, fullReplay, force } = req.body
  if (!documentId) {
    return res.status(400).json({ error: 'Missing documentId' })
  }

  try {
    const p: any = prisma
    const doc = await p.scannedDocument.findUnique({
      where: { id: documentId },
      select: { id: true, businessId: true, scanJobId: true },
    })

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' })
    }

    if (doc.businessId !== ctx.businessId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    let result
    if (fullReplay) {
      result = await DocumentReplayService.fullReplay(documentId, { force: force === true })
    } else if (stage) {
      result = await DocumentReplayService.replayFromStage(documentId, stage, { force: force === true })
    } else {
      const currentState = await DocumentLifecycleService.getDocumentSnapshot(documentId)
      if (!currentState) {
        return res.status(404).json({ error: 'Document state not found' })
      }
      result = await DocumentReplayService.replayFromStage(
        documentId, 
        currentState.lifecycleState || currentState.status,
        { force: force === true }
      )
    }

    return res.status(200).json({
      data: {
        message: 'Replay completed successfully',
        ...result,
      },
    })
  } catch (error: any) {
    if (error instanceof ReplayInProgressError) {
      return res.status(409).json({ error: 'Replay already in progress for this document' })
    }
    if (error instanceof ReplayBlockedError) {
      return res.status(403).json({ error: 'Replay blocked for finalized document' })
    }
    return res.status(500).json({ error: error.message || 'Replay failed' })
  }
}
