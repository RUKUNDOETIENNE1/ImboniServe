import type { NextApiRequest, NextApiResponse } from 'next';
import { getAvailableSlots } from '@/lib/services/qr-order.service';
import { prisma } from '@/lib/prisma';

/**
 * Get available time slots for remote orders
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, startTime } = req.query;

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Validate business exists and has remote ordering enabled
    const business = await prisma.business.findUnique({
      where: { id: branchId },
      select: { enableQRRemote: true }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (!business.enableQRRemote) {
      return res.status(403).json({ error: 'Remote ordering not enabled' });
    }

    // Parse start time or use current time
    const start = startTime && typeof startTime === 'string'
      ? new Date(startTime)
      : new Date();

    // Get next 6 available slots
    const slots = await getAvailableSlots(branchId, start, 6);

    return res.status(200).json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
