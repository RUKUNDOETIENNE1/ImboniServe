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
      include: {
        items: true,
        reconciliation: true,
        scanJob: { select: { id: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const currentState = DocumentLifecycleService.normalizeState(document.lifecycleState || document.status)

    // Idempotent: already applied
    if (currentState === DocumentLifecycleState.APPLIED) {
      return res.status(200).json({ data: { id: document.id, status: 'APPLIED' }, message: 'Already applied' })
    }

    // Only APPROVED → APPLIED
    if (currentState !== DocumentLifecycleState.APPROVED) {
      return res.status(409).json({
        error: `Cannot apply document in lifecycle state '${currentState}'. Must be APPROVED first.`,
      })
    }

    // Transaction: apply document effects
    await p.$transaction(async (tx: any) => {
      // 1. Update inventory for matched items
      for (const item of document.items) {
        if (item.productId && item.quantity) {
          await tx.inventoryItem.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          })
        }
      }

      // 2. Update linked PO status if matched
      if (document.matchedPurchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: document.matchedPurchaseOrderId },
          data: { status: 'RECEIVED' },
        })
      }

      // 3. Update linked GRN status if matched
      if (document.matchedGoodsReceivedNoteId) {
        await tx.goodsReceivedNote.update({
          where: { id: document.matchedGoodsReceivedNoteId },
          data: { status: 'COMPLETE' },
        })
      }

      // 4. Mark document as APPLIED using the canonical lifecycle helper
      await DocumentLifecycleService.transitionDocumentLifecycleOnTransaction(
        tx,
        id,
        DocumentLifecycleState.APPLIED,
        {
          appliedBy: ctx.userId,
          appliedAt: new Date().toISOString(),
          itemsUpdated: document.items.filter((i: any) => i.productId).length,
          poUpdated: !!document.matchedPurchaseOrderId,
          grnUpdated: !!document.matchedGoodsReceivedNoteId,
        },
        {
          expectedCurrentState: currentState,
          stage: 'application',
        },
      )
    })

    return res.status(200).json({ data: { id: document.id, status: 'APPLIED' } })
  } catch (error: any) {
    console.error('[DIE] document apply error:', error)
    return res.status(500).json({ error: 'Failed to apply document' })
  }
}
