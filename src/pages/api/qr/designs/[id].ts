import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { randomBytes, randomUUID } from 'crypto'

function shortToken(length = 8) {
  return randomBytes(length).toString('base64url').slice(0, length)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { business: true } })
    if (!user?.business) return res.status(404).json({ error: 'Business not found' })
    const businessId = user.business.id

    // DELETE design
    if (req.method === 'DELETE') {
      // Verify ownership
      const rows: any[] = await prisma.$queryRaw`SELECT "businessId" FROM "QrDesign" WHERE "id" = ${id} LIMIT 1`
      if (!rows[0] || rows[0].businessId !== businessId) {
        return res.status(404).json({ error: 'Design not found' })
      }
      // Delete QR code first (cascade will handle it, but explicit is safer)
      await prisma.$executeRaw`DELETE FROM "QrCode" WHERE "designId" = ${id}`
      await prisma.$executeRaw`DELETE FROM "QrDesign" WHERE "id" = ${id}`
      return res.status(200).json({ success: true })
    }

    // DUPLICATE design (POST)
    if (req.method === 'POST') {
      // Fetch original design
      const rows: any[] = await prisma.$queryRaw`SELECT d."businessId", d."templateId", d."name", d."customData" FROM "QrDesign" d WHERE d."id" = ${id} LIMIT 1`
      if (!rows[0] || rows[0].businessId !== businessId) {
        return res.status(404).json({ error: 'Design not found' })
      }
      const original = rows[0]
      const customData = original.customData || {}
      const qrType = customData.qrType || 'menu'
      const tableNumber = customData.tableNumber

      // Get slug
      const bpRows: any[] = await prisma.$queryRaw`SELECT "slug" FROM "BusinessProfile" WHERE "businessId" = ${businessId} LIMIT 1`
      const slug = bpRows[0]?.slug as string | undefined

      // Build target URL
      let targetUrl: string
      if (qrType === 'menu') targetUrl = slug ? `/menu/${slug}` : `/menu?b=${businessId}`
      else if (qrType === 'store') targetUrl = slug ? `/store/${slug}` : `/store?b=${businessId}`
      else if (qrType === 'table') {
        const tn = tableNumber ?? '1'
        targetUrl = slug ? `/menu/${slug}?table=${tn}` : `/menu?b=${businessId}&table=${tn}`
      } else {
        targetUrl = slug ? `/menu/${slug}` : `/menu?b=${businessId}`
      }

      // Create duplicate design
      const newDesignId = randomUUID()
      const newName = `${original.name || 'QR Design'} (Copy)`
      await prisma.$executeRaw`INSERT INTO "QrDesign" ("id", "businessId", "templateId", "name", "customData") VALUES (${newDesignId}, ${businessId}, ${original.templateId}, ${newName}, ${customData as any})`

      // Create new QR code
      const token = shortToken(10)
      const qrId = randomUUID()
      await prisma.$executeRaw`INSERT INTO "QrCode" ("id", "businessId", "designId", "token", "type", "targetUrl", "metadata") VALUES (${qrId}, ${businessId}, ${newDesignId}, ${token}, ${qrType}, ${targetUrl}, ${qrType === 'table' ? ({ tableNumber: String(tableNumber ?? '1') } as any) : null})`

      const shortUrl = `/q/${token}`
      return res.status(201).json({ id: newDesignId, token, shortUrl, targetUrl })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('QR design [id] handler error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
