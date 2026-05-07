import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission.middleware';

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: requestedId } = req.query;
  if (!requestedId || typeof requestedId !== 'string') {
    return res.status(400).json({ error: 'Business ID required' });
  }

  const sessionBusinessId = (session.user as any).businessId as string | null;
  if (!sessionBusinessId || requestedId !== sessionBusinessId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: sessionBusinessId },
      select: {
        id: true,
        taxMode: true,
        taxRate: true,
        currency: true,
        splitPaymentConvenienceFeeEnabled: true,
        splitPaymentConvenienceFeePercent: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.status(200).json(business);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function putHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: requestedId } = req.query;
  if (!requestedId || typeof requestedId !== 'string') {
    return res.status(400).json({ error: 'Business ID required' });
  }

  const sessionBusinessId = (session.user as any).businessId as string | null;
  if (!sessionBusinessId || requestedId !== sessionBusinessId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const {
      taxMode,
      taxRate,
      currency,
      splitPaymentConvenienceFeeEnabled,
      splitPaymentConvenienceFeePercent
    } = req.body;

    // Validate inputs
    if (taxMode && !['INCLUSIVE', 'EXCLUSIVE'].includes(taxMode)) {
      return res.status(400).json({ error: 'Invalid tax mode' });
    }

    if (taxRate !== undefined && (taxRate < 0 || taxRate > 100)) {
      return res.status(400).json({ error: 'Tax rate must be between 0 and 100' });
    }

    if (splitPaymentConvenienceFeePercent !== undefined && 
        (splitPaymentConvenienceFeePercent < 0 || splitPaymentConvenienceFeePercent > 5)) {
      return res.status(400).json({ error: 'Convenience fee must be between 0 and 5%' });
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: sessionBusinessId },
      data: {
        ...(taxMode && { taxMode }),
        ...(taxRate !== undefined && { taxRate }),
        ...(currency && { currency }),
        ...(splitPaymentConvenienceFeeEnabled !== undefined && { splitPaymentConvenienceFeeEnabled }),
        ...(splitPaymentConvenienceFeePercent !== undefined && { splitPaymentConvenienceFeePercent })
      },
      select: {
        id: true,
        taxMode: true,
        taxRate: true,
        currency: true,
        splitPaymentConvenienceFeeEnabled: true,
        splitPaymentConvenienceFeePercent: true
      }
    });

    return res.status(200).json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requirePermission('settings.read')(getHandler)(req, res);
  }

  if (req.method === 'PUT') {
    return requirePermission('settings.manage')(putHandler)(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
