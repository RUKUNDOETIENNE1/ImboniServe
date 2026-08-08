/**
 * DIE Document Apply API
 * Applies scanned/OCR'd invoice documents to inventory
 * 
 * NOTE: This is for SUPPLIER DELIVERIES (ADD operations), NOT kitchen consumption.
 * Kitchen consumption flows through:
 *   SaleItemStatusService → ConsumptionEngineService → InventoryLedgerService
 * 
 * The two paths are intentionally separate:
 * - DIE Apply: Receiving inventory from suppliers (invoices, deliveries)
 * - InventoryLedgerService: Automated consumption from kitchen execution
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import {
  DocumentLifecycleService,
  DocumentLifecycleState,
} from '@/lib/die/services/document-lifecycle.service'
import { UnitNormalizationService } from '@/lib/services/unit-normalization.service'

type ApplyBody = {
  applyItemIds?: string[]
  confirmOutliers?: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' })
    }

    const body = (req.body || {}) as ApplyBody

    const p: any = prisma
    const document = await p.scannedDocument.findUnique({
      where: { id },
      include: {
        items: true,
        reconciliation: true,
        scanJob: { select: { id: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const currentState = DocumentLifecycleService.normalizeState(document.lifecycleState || document.status)

    if (currentState === DocumentLifecycleState.APPLIED) {
      return res.status(200).json({ data: { id: document.id, status: 'APPLIED' }, message: 'Already applied' })
    }

    if (currentState !== DocumentLifecycleState.APPROVED) {
      return res.status(409).json({
        error: `Cannot apply document in lifecycle state '${currentState}'. Must be APPROVED first.`,
      })
    }

    const errors: Array<{ itemId: string; lineNo: number; code: string; message: string; details?: any }> = []
    const warnings: Array<{ itemId: string; lineNo: number; code: string; message: string; details?: any }> = []

    const applyItemIdSet = new Set(
      Array.isArray(body.applyItemIds) && body.applyItemIds.length > 0
        ? body.applyItemIds
        : document.items.filter((i: any) => !!i.productId).map((i: any) => i.id)
    )

    const itemsToApply = document.items.filter((i: any) => applyItemIdSet.has(i.id))

    if (itemsToApply.length === 0) {
      return res.status(400).json({ error: 'No line items selected for apply.' })
    }

    const itemProductIds = Array.from(new Set(itemsToApply.map((i: any) => i.productId).filter(Boolean)))
    const inventoryItems = await p.inventoryItem.findMany({
      where: { id: { in: itemProductIds }, businessId: ctx.businessId },
      select: { id: true, unit: true, currentStock: true, unitCostCents: true, name: true },
    })
    const inventoryById = new Map(inventoryItems.map((it: any) => [it.id, it]))

    for (const item of itemsToApply) {
      const lineNo = item.lineNo || 0

      if (!item.productId) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'MISSING_PRODUCT_MATCH',
          message: 'Line item is not matched to an inventory item. Select a product before applying.',
        })
        continue
      }

      const inv = inventoryById.get(item.productId)
      if (!inv) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'INVALID_PRODUCT',
          message: 'Matched inventory item not found (or not in this business).',
          details: { productId: item.productId },
        })
        continue
      }

      const qty = Number(item.quantity)
      if (!Number.isFinite(qty) || qty <= 0) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a number greater than 0.',
          details: { quantity: item.quantity },
        })
        continue
      }

      if (qty >= 10_000) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'QUANTITY_TOO_LARGE',
          message: 'Quantity exceeds maximum allowed (10,000).',
          details: { quantity: qty, max: 10_000 },
        })
        continue
      }

      if (qty > 1_000) {
        warnings.push({
          itemId: item.id,
          lineNo,
          code: 'QUANTITY_OUTLIER',
          message: 'Large quantity detected. Confirm before applying.',
          details: { quantity: qty, threshold: 1_000 },
        })
      }

      const extractedUnit = UnitNormalizationService.normalizeUnit(String(item.unit || ''))
      const inventoryUnit = UnitNormalizationService.normalizeUnit(String(inv.unit || ''))
      if (!extractedUnit || !inventoryUnit) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'MISSING_UNIT',
          message: 'Unit is missing. Enter a unit before applying.',
          details: { extractedUnit: item.unit, inventoryUnit: inv.unit },
        })
        continue
      }

      if (extractedUnit !== inventoryUnit) {
        errors.push({
          itemId: item.id,
          lineNo,
          code: 'UNIT_MISMATCH',
          message: 'Unit does not match the inventory item unit. Fix the unit or change the matched product.',
          details: { extractedUnit, inventoryUnit },
        })
        continue
      }

      const unitPriceCents = item.unitPriceCents === null || item.unitPriceCents === undefined ? null : Number(item.unitPriceCents)
      const totalPriceCents = item.totalPriceCents === null || item.totalPriceCents === undefined ? null : Number(item.totalPriceCents)

      const checkMoney = (v: number | null, label: string) => {
        if (v === null) return
        if (!Number.isFinite(v) || !Number.isInteger(v) || v < 0) {
          errors.push({
            itemId: item.id,
            lineNo,
            code: 'INVALID_PRICE',
            message: `${label} must be a non-negative integer (cents).`,
            details: { value: item[label], parsed: v },
          })
        } else if (v > 1_000_000_000) {
          errors.push({
            itemId: item.id,
            lineNo,
            code: 'PRICE_TOO_LARGE',
            message: `${label} is unreasonably large.`,
            details: { value: v },
          })
        }
      }

      checkMoney(unitPriceCents, 'unitPriceCents')
      checkMoney(totalPriceCents, 'totalPriceCents')

      if (unitPriceCents !== null && totalPriceCents !== null) {
        const expected = Math.round(unitPriceCents * qty)
        const delta = Math.abs(totalPriceCents - expected)
        const denom = Math.max(1, expected)
        if (delta / denom > 0.25) {
          warnings.push({
            itemId: item.id,
            lineNo,
            code: 'PRICE_INCONSISTENT',
            message: 'Line total does not match unit price × quantity. Review before applying.',
            details: { qty, unitPriceCents, totalPriceCents, expectedTotalCents: expected },
          })
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors, warnings })
    }

    if (warnings.some((w) => w.code === 'QUANTITY_OUTLIER') && body.confirmOutliers !== true) {
      return res.status(409).json({
        error: 'Outlier confirmation required',
        warnings,
        message: 'One or more line items have unusually large quantities. Re-submit with confirmOutliers=true to proceed.',
      })
    }

    await p.$transaction(async (tx: any) => {
      const invoiceNo = document.invoiceNumber || null
      const supplierName = document.supplier?.name || null

      for (const item of itemsToApply) {
        if (!item.productId) continue

        const beforeState = await tx.inventoryItem.findUnique({
          where: { id: item.productId },
          select: { currentStock: true, unitCostCents: true },
        })

        if (!beforeState) {
          throw new Error(`Inventory item ${item.productId} not found during apply transaction`)
        }

        const newStock = beforeState.currentStock + item.quantity
        const newCost = typeof item.unitPriceCents === 'number' && item.unitPriceCents >= 0 && item.unitPriceCents <= 1_000_000_000
          ? item.unitPriceCents
          : beforeState.unitCostCents

        await tx.inventoryItem.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock,
            ...(newCost !== beforeState.unitCostCents ? { unitCostCents: newCost } : {}),
          },
        })

        await tx.inventoryUpdate.create({
          data: {
            inventoryItemId: item.productId,
            userId: ctx.userId,
            businessId: ctx.businessId,
            type: 'ADD',
            quantity: item.quantity,
            reason: invoiceNo ? `Receipt OCR (${invoiceNo})` : 'Receipt OCR',
            notes: [
              `documentId=${document.id}`,
              `scannedDocumentItemId=${item.id}`,
              supplierName ? `supplier=${supplierName}` : null,
              `lineNo=${item.lineNo}`,
              `beforeStock=${beforeState.currentStock}`,
              `afterStock=${newStock}`,
              `beforeCostCents=${beforeState.unitCostCents}`,
              `afterCostCents=${newCost}`,
            ].filter(Boolean).join(' | '),
          },
        })
      }

      if (document.matchedPurchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: document.matchedPurchaseOrderId },
          data: { status: 'RECEIVED' },
        })
      }

      if (document.matchedGoodsReceivedNoteId) {
        await tx.goodsReceivedNote.update({
          where: { id: document.matchedGoodsReceivedNoteId },
          data: { status: 'COMPLETE' },
        })
      }

      await tx.documentProcessingLog.create({
        data: {
          scanJobId: document.scanJob.id,
          stage: 'application',
          level: warnings.length > 0 ? 'warn' : 'info',
          message: 'Receipt applied to inventory',
          payload: {
            warnings,
            appliedBy: ctx.userId,
            appliedAt: new Date().toISOString(),
            itemsUpdated: itemsToApply.length,
          },
        },
      })

      await DocumentLifecycleService.transitionDocumentLifecycleOnTransaction(
        tx,
        id,
        DocumentLifecycleState.APPLIED,
        {
          appliedBy: ctx.userId,
          appliedAt: new Date().toISOString(),
          itemsUpdated: itemsToApply.length,
          poUpdated: !!document.matchedPurchaseOrderId,
          grnUpdated: !!document.matchedGoodsReceivedNoteId,
          warnings,
        },
        {
          expectedCurrentState: currentState,
          stage: 'application',
        },
      )
    })

    return res.status(200).json({ data: { id: document.id, status: 'APPLIED' }, warnings })
  } catch (error: any) {
    console.error('[DIE] document apply error:', error)
    return res.status(500).json({ error: 'Failed to apply document' })
  }
}
