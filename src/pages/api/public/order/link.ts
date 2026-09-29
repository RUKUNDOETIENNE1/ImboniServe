import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { QRGeneratorService } from '@/lib/services/qr-generator.service';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint to generate signed order links.
 *
 * Authorization model (Phase 3R — P1-4):
 *   - Staff session for the same business: full link generation (QR builder).
 *   - Anonymous: physical-QR flow only — in-venue mode AND a valid
 *     business-owned tableId (the `/t/{tableId}` short-URL flow).
 *     Anonymous preorder/pickup links and business-level links are rejected.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { branchId, tableId, seatId, outletId, mode } = req.query;

    if (!branchId || typeof branchId !== 'string') {
      return res.status(400).json({ error: 'branchId is required' });
    }

    // Session lookup failure degrades to anonymous — the safe direction
    // (anonymous can only mint physical-table in-venue links).
    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const sessionBusinessId = (session?.user as any)?.businessId as string | undefined;
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const isStaffForBusiness = !!session?.user && (isAdmin || sessionBusinessId === branchId);

    const orderMode = mode as 'invenue' | 'preorder' | 'pickup' | undefined;
    const isRemote = orderMode === 'preorder' || orderMode === 'pickup';

    if (!isStaffForBusiness) {
      // Anonymous callers may only mint in-venue links bound to a real table.
      // Remote ordering needs staff (it requires a phone/contact anyway), and
      // business-level links must never be mintable without the printed QR.
      if (isRemote) {
        return res.status(403).json({ error: 'Remote ordering links require staff authorization' });
      }
      if (seatId || outletId || !tableId || typeof tableId !== 'string') {
        return res.status(403).json({ error: 'Order links require a valid table' });
      }
    }

    // Validate business exists
    const business = await prisma.business.findUnique({
      where: { id: branchId },
      select: { id: true, enableQRInVenue: true, enableQRRemote: true }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (isRemote && !business.enableQRRemote) {
      return res.status(403).json({ error: 'Remote ordering not enabled' });
    }

    if (!isRemote && !business.enableQRInVenue) {
      return res.status(403).json({ error: 'In-venue ordering not enabled' });
    }

    // Validate the requested entity belongs to this business
    if (tableId && typeof tableId === 'string') {
      const table = await prisma.table.findFirst({
        where: { id: tableId, businessId: branchId }
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }

    if (seatId && typeof seatId === 'string') {
      const seat = await prisma.seat.findFirst({
        where: { id: seatId, table: { businessId: branchId } }
      });

      if (!seat) {
        return res.status(404).json({ error: 'Seat not found' });
      }
    }

    if (outletId && typeof outletId === 'string') {
      const outlet = await prisma.outlet.findFirst({
        where: { id: outletId, businessId: branchId }
      });

      if (!outlet) {
        return res.status(404).json({ error: 'Outlet not found' });
      }
    }

    // Generate signed URL
    const url = QRGeneratorService.generateURL({
      branchId,
      tableId: typeof tableId === 'string' ? tableId : undefined,
      seatId: typeof seatId === 'string' ? seatId : undefined,
      outletId: typeof outletId === 'string' ? outletId : undefined,
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
