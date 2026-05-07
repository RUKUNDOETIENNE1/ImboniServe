import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getTipSuggestionForSale } from '@/lib/services/digital-tipping.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { saleId } = req.query;

  if (!saleId || typeof saleId !== 'string') {
    return res.status(400).json({ error: 'Sale ID required' });
  }

  try {
    const suggestion = await getTipSuggestionForSale(saleId);

    if (!suggestion) {
      return res.status(200).json({
        enabled: false,
        reason: 'Digital tipping not enabled for this business'
      });
    }

    return res.status(200).json({
      enabled: true,
      suggestion
    });
  } catch (error) {
    console.error('Error getting tip suggestion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
