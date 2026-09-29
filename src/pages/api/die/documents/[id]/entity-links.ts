import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

const bodySchema = z.object({
  links: z.array(
    z.object({
      entityType: z.enum(['SUPPLIER', 'PO', 'GRN', 'INVENTORY_ITEM']),
      entityId: z.string().min(1),
      previousEntityId: z.string().optional(),
    })
  ).min(1).max(20),
})

// Normalize a string for alias learning
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
        supplierId: true,
        invoiceNumber: true,
        items: { select: { id: true, productName: true, productId: true } },
      },
    })

    if (!document) return res.status(404).json({ error: 'Document not found' })
    if (document.businessId !== ctx.businessId) return res.status(404).json({ error: 'Document not found' })

    const results: any[] = []

    for (const link of parsed.data.links) {
      // Remove previous link if exists for this entityType
      if (link.previousEntityId) {
        await p.documentEntityLink.deleteMany({
          where: {
            scannedDocumentId: id,
            entityType: link.entityType,
            entityId: link.previousEntityId,
          },
        })
      }

      // Upsert new link (idempotent via unique constraint)
      const newLink = await p.documentEntityLink.upsert({
        where: {
          scannedDocumentId_entityType_entityId: {
            scannedDocumentId: id,
            entityType: link.entityType,
            entityId: link.entityId,
          },
        },
        update: { linkType: 'USER_CONFIRMED', confidence: 1.0 },
        create: {
          scannedDocumentId: id,
          entityType: link.entityType,
          entityId: link.entityId,
          linkType: 'USER_CONFIRMED',
          confidence: 1.0,
        },
      })

      results.push(newLink)

      // Learn aliases automatically
      if (link.entityType === 'SUPPLIER') {
        // Update document supplierId
        await p.scannedDocument.update({ where: { id }, data: { supplierId: link.entityId } })

        // Learn supplier alias from invoice supplier name if available
        const supplierName = await getSupplierNameFromHeaders(p, id)
        if (supplierName) {
          const normalizedName = normalize(supplierName)
          await p.supplierAlias.upsert({
            where: { supplierId_normalized: { supplierId: link.entityId, normalized: normalizedName } },
            update: {},
            create: { supplierId: link.entityId, alias: supplierName, normalized: normalizedName },
          })
        }
      }

      if (link.entityType === 'INVENTORY_ITEM') {
        // Find the item with the matching product and learn alias
        for (const item of document.items) {
          if (item.productName && !item.productId) {
            const normalizedName = normalize(item.productName)
            await p.productAlias.upsert({
              where: { inventoryItemId_normalized: { inventoryItemId: link.entityId, normalized: normalizedName } },
              update: {},
              create: { inventoryItemId: link.entityId, alias: item.productName, normalized: normalizedName },
            })
            // Update item's productId
            await p.scannedDocumentItem.update({
              where: { id: item.id },
              data: { productId: link.entityId },
            })
            break // Only update first unlinked item
          }
        }
      }

      if (link.entityType === 'PO') {
        await p.scannedDocument.update({ where: { id }, data: { matchedPurchaseOrderId: link.entityId } })
      }

      if (link.entityType === 'GRN') {
        await p.scannedDocument.update({ where: { id }, data: { matchedGoodsReceivedNoteId: link.entityId } })
      }
    }

    // Audit log
    await p.documentProcessingLog.create({
      data: {
        scanJobId: document.scanJobId,
        stage: 'entity-link-override',
        level: 'info',
        message: `Entity links updated (${parsed.data.links.length} changes)`,
        payload: {
          updatedBy: ctx.userId,
          updatedAt: new Date().toISOString(),
          links: parsed.data.links,
        },
      },
    })

    return res.status(200).json({ data: { updated: results.length, links: results } })
  } catch (error: any) {
    console.error('[DIE] entity-links error:', error)
    return res.status(500).json({ error: 'Failed to update entity links' })
  }
}

async function getSupplierNameFromHeaders(p: any, scannedDocumentId: string): Promise<string | null> {
  const header = await p.extractedDocumentHeaderField.findFirst({
    where: { scannedDocumentId, fieldName: 'supplierName' },
    select: { fieldValue: true },
  })
  return header?.fieldValue || null
}
