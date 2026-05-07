import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { token } = req.query
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' })
  }

  try {
    const rows: any[] = await prisma.$queryRaw`SELECT q."id", q."targetUrl", q."isActive", b."isActive" as "businessActive" FROM "QrCode" q JOIN "Restaurant" b ON b."id" = q."businessId" WHERE q."token" = ${token} LIMIT 1`
    const qr = rows[0]

    if (!qr) return res.status(404).json({ error: 'QR code not found' })
    if (!qr.isActive) return res.status(410).json({ error: 'QR code is no longer active' })
    if (!qr.businessActive) return res.status(410).json({ error: 'Business is no longer active' })

    await prisma.$executeRaw`UPDATE "QrCode" SET "scanCount" = "scanCount" + 1, "lastScannedAt" = NOW() WHERE "id" = ${qr.id}`

    return res.redirect(302, qr.targeturl || qr.targetUrl)
  } catch (error) {
    console.error('QR resolver error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
