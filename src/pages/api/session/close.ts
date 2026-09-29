/**
 * Session Close API
 * Close an active table session
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ingestDiningSlipShadowEvent } from '@/lib/die/business-as-plugin/dining-slips/slips.shadow'
import { requireTableSessionAccess } from '@/lib/api/table-session-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Session-bound capability required: participant tempId, seat session
    // token, or staff of the owning business.
    const access = await requireTableSessionAccess(req, res, sessionId)
    if (!access) return

    const session = access.session;

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

    // Shadow: SESSION_CLOSED (feature-flagged inside ingestor)
    try {
      await ingestDiningSlipShadowEvent({ type: 'SESSION_CLOSED', businessId: session.businessId, sessionId }).catch(() => {})
    } catch {}

    return res.status(200).json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({ error: 'Failed to close session' });
  }
}
