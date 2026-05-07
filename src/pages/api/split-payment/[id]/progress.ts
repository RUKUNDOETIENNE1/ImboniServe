import type { NextApiRequest, NextApiResponse } from 'next';
import { getSplitPaymentSummary } from '@/lib/services/split-payment.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Sale ID required' });
  }

  try {
    const result = await getSplitPaymentSummary(id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting split payment progress:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
