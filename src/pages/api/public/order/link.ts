import type { NextApiRequest, NextApiResponse } from 'next';
import { QRGeneratorService } from '@/lib/services/qr-generator.service';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint to generate signed order links
 * Used by QR codes to create secure, HMAC-signed order URLs
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, tableId, mode } = req.query;

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: branchId },
      select: { id: true, enableQRInVenue: true, enableQRRemote: true }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Validate mode
    const orderMode = mode as 'invenue' | 'preorder' | 'pickup' | undefined;
    const isRemote = orderMode === 'preorder' || orderMode === 'pickup';

    // Check if mode is enabled
    if (isRemote && !business.enableQRRemote) {
      return res.status(403).json({ error: 'Remote ordering not enabled' });
    }

    if (!isRemote && !business.enableQRInVenue) {
      return res.status(403).json({ error: 'In-venue ordering not enabled' });
    }

    // Validate table if provided
    if (tableId && typeof tableId === 'string') {
      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId: branchId }
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }

    // Generate signed URL
    const url = QRGeneratorService.generateURL({
      branchId,
      tableId: typeof tableId === 'string' ? tableId : undefined,
      mode: orderMode
    });

    return res.status(200).json({
      url,
      branchId,
      tableId: tableId || null,
      mode: orderMode || 'invenue'
    });
  } catch (error) {
    console.error('Error generating order link:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
