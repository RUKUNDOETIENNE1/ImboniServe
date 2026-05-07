import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { QRGeneratorService } from '@/lib/services/qr-generator.service'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  
  if (!session?.user || !businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { tableId, seatId, outletId, format } = req.body

    if (!tableId && !seatId && !outletId) {
      return res.status(400).json({ error: 'Table, seat, or outlet ID required' })
    }

    // Check QR code limit
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        qrCodesCount: true,
        plan: {
          select: {
            qrCodesLimit: true
          }
        }
      }
    });

    const limit = business?.plan?.qrCodesLimit;
    if (limit && business && business.qrCodesCount >= limit) {
      return res.status(402).json({ 
        error: 'QR code limit reached',
        limit: limit,
        current: business.qrCodesCount,
        message: `You've reached your QR code limit of ${limit}. Upgrade your plan for more.`
      });
    }

    const options = {
      branchId: businessId,
      ...(tableId && { tableId }),
      ...(seatId && { seatId }),
      ...(outletId && { outletId }),
      mode: 'invenue' as const
    }

    let result;
    if (format === 'image') {
      const qrImage = await QRGeneratorService.generateQRCodeImage(options)
      result = { qrCode: qrImage, format: 'dataURL' };
    } else if (format === 'buffer') {
      const buffer = await QRGeneratorService.generateQRCodeBuffer(options)
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="qr-${tableId || seatId || outletId}.png"`)
      
      // Increment counter before sending buffer
      await prisma.business.update({
        where: { id: businessId },
        data: { qrCodesCount: { increment: 1 } }
      });
      
      return res.send(buffer);
    } else {
      const url = QRGeneratorService.generateURL(options)
      result = { qrCode: url, format: 'url' };
    }

    // Increment QR code counter (Phase 2 usage tracking)
    await prisma.business.update({
      where: { id: businessId },
      data: {
        qrCodesCount: { increment: 1 }
      }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('QR generation error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
