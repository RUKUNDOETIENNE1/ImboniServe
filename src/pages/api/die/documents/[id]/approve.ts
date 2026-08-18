import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from '@/lib/die/services/document-lifecycle.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

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
      select: { id: true, businessId: true, status: true, lifecycleState: true, scanJobId: true },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const currentState = DocumentLifecycleService.normalizeState(document.lifecycleState || document.status)

    // Idempotent: already approved
    if (currentState === DocumentLifecycleState.APPROVED) {
      return res.status(200).json({ data: { id: document.id, status: 'APPROVED' }, message: 'Already approved' })
    }

    // Only ANALYZED/REVIEW_REQUIRED → APPROVED is valid in the canonical lifecycle
    if (
      currentState !== DocumentLifecycleState.ANALYZED &&
      currentState !== DocumentLifecycleState.REVIEW_REQUIRED
    ) {
      return res.status(409).json({
        error: `Cannot approve document in lifecycle state '${currentState}'. Must be in ANALYZED or REVIEW_REQUIRED.`,
      })
    }

    await DocumentLifecycleService.transitionDocumentLifecycle(id, DocumentLifecycleState.APPROVED, {
      approvedBy: ctx.userId,
      approvedAt: new Date().toISOString(),
    }, {
      expectedCurrentState: currentState,
      stage: 'approval',
    })

    return res.status(200).json({ data: { id: document.id, status: 'APPROVED' } })
  } catch (error: any) {
    console.error('[DIE] document approve error:', error)
    return res.status(500).json({ error: 'Failed to approve document' })
  }
}
