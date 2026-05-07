/**
 * Update Participant Name API
 * Persists participant name changes to the database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participantId, name } = req.body;

    if (!participantId || typeof participantId !== 'string') {
      return res.status(400).json({ error: 'participantId is required' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const participant = await prisma.sessionParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const updated = await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { name: name.trim() },
    });

    return res.status(200).json({
      success: true,
      participant: { id: updated.id, name: updated.name },
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return res.status(500).json({ error: 'Failed to update participant' });
  }
}
