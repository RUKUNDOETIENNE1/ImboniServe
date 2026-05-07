import { NextApiRequest, NextApiResponse } from 'next';
import { calculateConvenienceFee } from '@/lib/pricing/fee-calculator';
import { PaymentMethod } from '@/lib/pricing/fee-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subtotal, paymentMethod, tipsAmount = 0 } = req.body;

    if (!subtotal || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: subtotal, paymentMethod' });
    }

    const feeCalc = calculateConvenienceFee(
      parseFloat(subtotal),
      paymentMethod as PaymentMethod,
      true,
      parseFloat(tipsAmount)
    );

    return res.status(200).json(feeCalc);
  } catch (error) {
    console.error('Error calculating fee:', error);
    return res.status(500).json({ error: 'Failed to calculate fee' });
  }
}
