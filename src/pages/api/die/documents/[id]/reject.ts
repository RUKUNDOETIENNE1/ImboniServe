import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from '@/lib/die/services/document-lifecycle.service'

const bodySchema = z.object({
  reason: z.string().min(1).max(1000),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' })
    }

    const parsed = bodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    }

    const { reason } = parsed.data
    const p: any = prisma

    const document = await p.scannedDocument.findUnique({
      where: { id },
      select: { id: true, businessId: true, status: true, lifecycleState: true, scanJobId: true },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const currentState = DocumentLifecycleService.normalizeState(document.lifecycleState || document.status)

    // Idempotent: already failed/rejected
    if (currentState === DocumentLifecycleState.FAILED) {
      return res.status(200).json({ data: { id: document.id, status: 'FAILED' }, message: 'Already rejected' })
    }

    // Canonical rejection is REVIEW_REQUIRED → FAILED
    if (currentState !== DocumentLifecycleState.REVIEW_REQUIRED) {
      return res.status(409).json({
        error: `Cannot reject document in lifecycle state '${currentState}'. Must be in REVIEW_REQUIRED.`,
      })
    }

    await DocumentLifecycleService.transitionDocumentLifecycle(id, DocumentLifecycleState.FAILED, {
      rejectedBy: ctx.userId,
      reason,
      rejectedAt: new Date().toISOString(),
    }, {
      expectedCurrentState: currentState,
      stage: 'rejection',
    })

    return res.status(200).json({ data: { id: document.id, status: 'FAILED', reason } })
  } catch (error: any) {
    console.error('[DIE] document reject error:', error)
    return res.status(500).json({ error: 'Failed to reject document' })
  }
}
