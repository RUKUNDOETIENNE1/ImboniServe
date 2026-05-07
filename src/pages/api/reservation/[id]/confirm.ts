import type { NextApiRequest, NextApiResponse } from 'next';
import { confirmReservation } from '@/lib/services/reservation-reminder.service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Reservation ID required' });
  }

  try {
    await confirmReservation(id);

    return res.status(200).json({
      success: true,
      message: 'Reservation confirmed successfully'
    });
  } catch (error: any) {
    console.error('Error confirming reservation:', error);
    
    if (error.message === 'Reservation not found') {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    if (error.message === 'Reservation is cancelled') {
      return res.status(400).json({ error: 'Reservation is cancelled' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
