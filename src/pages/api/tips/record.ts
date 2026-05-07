import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { recordTipChoice } from '@/lib/services/digital-tipping.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { saleId, accepted, tipAmountCents, staffId } = req.body;

  if (!saleId) {
    return res.status(400).json({ error: 'Sale ID required' });
  }

  if (typeof accepted !== 'boolean') {
    return res.status(400).json({ error: 'Accepted flag required' });
  }

  if (accepted && (!tipAmountCents || !staffId)) {
    return res.status(400).json({ 
      error: 'Tip amount and staff ID required when accepting tip' 
    });
  }

  try {
    await recordTipChoice(saleId, accepted, tipAmountCents, staffId);

    return res.status(200).json({
      success: true,
      message: accepted ? 'Tip recorded successfully' : 'Tip skipped'
    });
  } catch (error) {
    console.error('Error recording tip choice:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
