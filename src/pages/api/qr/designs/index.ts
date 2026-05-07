import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { randomBytes, randomUUID } from 'crypto'
import { QRGeneratorService } from '@/lib/services/qr-generator.service'

function shortToken(length = 8) {
  return randomBytes(length).toString('base64url').slice(0, length)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' })

  try {
    // Resolve current business
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { business: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    let businessId: string | null = user.business?.id ?? null
    if (!businessId) {
      const owned = await prisma.business.findFirst({ where: { ownerId: user.id }, select: { id: true } })
      if (owned) {
        businessId = owned.id
        if (!user.businessId) {
          await prisma.user.update({ where: { id: user.id }, data: { businessId } })
        }
      } else {
        const created = await prisma.business.create({ data: { name: user.name || 'My Business', phone: user.phone || '0780000000', ownerId: user.id } })
        await prisma.user.update({ where: { id: user.id }, data: { businessId: created.id } })
        businessId = created.id
      }
    }

    if (req.method === 'GET') {
      const rows: any[] = await prisma.$queryRaw`SELECT d."id", d."name", d."customData", d."createdAt", t."name" as "templateName", t."category" as "templateCategory", c."token", c."type" as "qrType", c."scanCount", c."lastScannedAt" FROM "QrDesign" d LEFT JOIN "QrTemplate" t ON t."id" = d."templateId" LEFT JOIN "QrCode" c ON c."designId" = d."id" WHERE d."businessId" = ${businessId} ORDER BY d."createdAt" DESC`
      return res.status(200).json({ designs: rows })
    }

    if (req.method === 'POST') {
      const { templateId, qrType, primaryColor, message, tableId, mode } = req.body || {}
      if (!templateId || !qrType) return res.status(400).json({ error: 'templateId and qrType are required' })

      // Validate qrType and determine mode
      let orderMode: 'invenue' | 'preorder' | 'pickup' = 'invenue'
      let targetTableId: string | undefined

      if (qrType === 'table') {
        if (!tableId) return res.status(400).json({ error: 'tableId is required for table QR codes' })
        targetTableId = tableId
        orderMode = 'invenue'
      } else if (qrType === 'branch') {
        orderMode = 'invenue'
      } else if (qrType === 'preorder') {
        orderMode = 'preorder'
      } else if (qrType === 'pickup') {
        orderMode = 'pickup'
      } else {
        return res.status(400).json({ error: 'Invalid qrType. Use: table, branch, preorder, or pickup' })
      }

      // Override with explicit mode if provided
      if (mode && ['invenue', 'preorder', 'pickup'].includes(mode)) {
        orderMode = mode as 'invenue' | 'preorder' | 'pickup'
      }

      // Generate signed order URL using QRGeneratorService
      const targetUrl = QRGeneratorService.generateURL({
        branchId: businessId!,
        tableId: targetTableId,
        mode: orderMode
      })

      // Create design (use node-generated UUID to avoid DB extensions)
      const designId = randomUUID()

      const customData = {
        primaryColor: primaryColor || '#0ea5e9',
        message: message || 'Scan to order',
        tableId: targetTableId,
        qrType,
        mode: orderMode
      }

      await prisma.$executeRaw`INSERT INTO "QrDesign" ("id", "businessId", "templateId", "name", "customData") VALUES (${designId}, ${businessId!}, ${templateId}, ${'QR Design'}, ${customData as any})`

      // Create QR code linked to design
      const token = shortToken(10)
      const qrId = randomUUID()
      const metadata = targetTableId ? { tableId: targetTableId, mode: orderMode } : { mode: orderMode }
      await prisma.$executeRaw`INSERT INTO "QrCode" ("id", "businessId", "designId", "token", "type", "targetUrl", "metadata") VALUES (${qrId}, ${businessId!}, ${designId}, ${token}, ${qrType}, ${targetUrl}, ${metadata as any})`

      const shortUrl = `/q/${token}`
      return res.status(201).json({ id: designId, token, shortUrl, targetUrl, mode: orderMode })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('QR designs handler error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
