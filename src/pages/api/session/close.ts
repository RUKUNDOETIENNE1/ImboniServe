/**
 * Session Close API
 * Close an active table session
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ error: 'Session already closed' });
    }

    const updatedSession = await prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({ error: 'Failed to close session' });
  }
}
