import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().cuid(),
        productId: z.string().cuid().nullable().optional(),
        quantity: z.number().finite().positive().max(9999.99).optional(),
        unit: z.string().min(1).max(10).optional(),
        unitPriceCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
        totalPriceCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
      })
    )
    .min(1)
    .max(200),
})

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

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

    const p: any = prisma
    const document = await p.scannedDocument.findUnique({
      where: { id },
      select: {
        id: true,
        businessId: true,
        scanJobId: true,
        items: { select: { id: true, productName: true, productId: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const itemById = new Map(document.items.map((it: any) => [it.id, it]))

    const updates: any[] = []

    await p.$transaction(async (tx: any) => {
      for (const patch of parsed.data.items) {
        const existing = itemById.get(patch.id)
        if (!existing) {
          throw new Error(`Item not found on document: ${patch.id}`)
        }

        if (patch.productId !== undefined && patch.productId !== null) {
          const inv = await tx.inventoryItem.findFirst({
            where: { id: patch.productId, businessId: ctx.businessId },
            select: { id: true },
          })
          if (!inv) {
            throw new Error(`Invalid inventory item: ${patch.productId}`)
          }
        }

        const data: any = {}
        if (patch.productId !== undefined) data.productId = patch.productId
        if (patch.quantity !== undefined) data.quantity = patch.quantity
        if (patch.unit !== undefined) data.unit = patch.unit.toUpperCase().slice(0, 10)
        if (patch.unitPriceCents !== undefined) data.unitPriceCents = patch.unitPriceCents
        if (patch.totalPriceCents !== undefined) data.totalPriceCents = patch.totalPriceCents

        const updated = await tx.scannedDocumentItem.update({
          where: { id: patch.id },
          data,
          select: {
            id: true,
            lineNo: true,
            productName: true,
            productId: true,
            quantity: true,
            unit: true,
            unitPriceCents: true,
            totalPriceCents: true,
          },
        })

        // Alias learning when user confirms a product match
        if (patch.productId !== undefined && patch.productId && existing.productName) {
          const normalizedName = normalize(existing.productName)
          if (normalizedName) {
            await tx.productAlias.upsert({
              where: {
                inventoryItemId_normalized: {
                  inventoryItemId: patch.productId,
                  normalized: normalizedName,
                },
              },
              update: {},
              create: {
                inventoryItemId: patch.productId,
                alias: existing.productName,
                normalized: normalizedName,
              },
            })
          }
        }

        updates.push(updated)
      }

      await tx.documentProcessingLog.create({
        data: {
          scanJobId: document.scanJobId,
          stage: 'review-edit',
          level: 'info',
          message: `Line items updated (${parsed.data.items.length} changes)`,
          payload: { updatedBy: ctx.userId, updatedAt: new Date().toISOString() },
        },
      })
    })

    return res.status(200).json({ data: { updated: updates.length, items: updates } })
  } catch (error: any) {
    console.error('[DIE] document items patch error:', error)
    return res.status(500).json({ error: error.message || 'Failed to update document items' })
  }
}
