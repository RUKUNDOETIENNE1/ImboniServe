import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getAllActiveFees, updateFeeConfig, FeeType } from '@/lib/services/platform-fee.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Check if user is admin
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const fees = await getAllActiveFees();
      return res.status(200).json({ fees });
    } catch (error) {
      console.error('Error fetching fees:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    const { feeType, feePercent } = req.body;

    if (!feeType || typeof feePercent !== 'number') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (feePercent < 0 || feePercent > 100) {
      return res.status(400).json({ error: 'Fee percent must be between 0 and 100' });
    }

    try {
      await updateFeeConfig(feeType as FeeType, feePercent);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating fee:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
