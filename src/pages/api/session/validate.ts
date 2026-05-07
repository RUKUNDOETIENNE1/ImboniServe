/**
 * Session Validate API
 * Check if a session is still active
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, closedAt: true },
    });

    if (!session) {
      return res.status(404).json({ isActive: false, error: 'Session not found' });
    }

    const isActive = session.status === 'active' && !session.closedAt;

    return res.status(200).json({ isActive, status: session.status });
  } catch (error) {
    console.error('Error validating session:', error);
    return res.status(500).json({ error: 'Failed to validate session' });
  }
}
