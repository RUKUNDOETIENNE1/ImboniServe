import type { NextApiRequest, NextApiResponse } from 'next';
import { validateQRSignature, generateAccessToken } from '@/lib/services/qr-token.service';
import { prisma } from '@/lib/prisma';

import { withRateLimit } from '@/lib/middleware/withRateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, tableId, version, signature, mode } = req.body;

    if (!branchId || !signature) {
      return res.status(400).json({ error: 'branchId and signature are required' });
    }

    // Validate HMAC signature
    const isValid = validateQRSignature(branchId, tableId, version || '1', signature);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid QR signature' });
    }

    // Check if branch exists and QR ordering is enabled
    const business = await prisma.business.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        enableQRInVenue: true,
        enableQRRemote: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Determine order source
    const isRemote = mode === 'pickup' || mode === 'preorder';
    const source = isRemote ? 'QR_REMOTE' : 'QR_IN_VENUE';

    // Check if appropriate QR mode is enabled
    if (source === 'QR_REMOTE' && !business.enableQRRemote) {
      return res.status(403).json({ error: 'Remote ordering not enabled for this business' });
    }

    if (source === 'QR_IN_VENUE' && !business.enableQRInVenue) {
      return res.status(403).json({ error: 'In-venue QR ordering not enabled for this business' });
    }

    // Validate table exists if provided
    if (tableId) {
      const table = await prisma.table.findFirst({
        where: {
          id: tableId,
          businessId: branchId
        }
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }

    // Generate access token
    const accessToken = await generateAccessToken(branchId, source, tableId);

    return res.status(200).json({
      accessToken,
      branchId,
      branchName: business.name,
      tableId: tableId || null,
      source,
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withRateLimit(handler, { windowMs: 60 * 1000, maxRequests: 10 });
