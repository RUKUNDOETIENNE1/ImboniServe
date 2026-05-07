/**
 * Session Join API
 * Join or create a table session for group ordering
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface JoinRequest {
  tableId: string;
  branchId: string;
  tempId: string;
  name?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tableId, branchId, tempId, name } = req.body as JoinRequest;

    if (!tableId || !branchId || !tempId) {
      return res.status(400).json({ error: 'tableId, branchId, and tempId are required' });
    }

    // Verify table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, number: true, businessId: true },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Auto-close stale sessions for this table (older than 6 hours)
    const staleThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000);
    await prisma.tableSession.updateMany({
      where: {
        tableId,
        status: 'active',
        createdAt: { lt: staleThreshold },
      },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    // Find or create active session for this table (enforce only ONE active)
    let session = await prisma.tableSession.findFirst({
      where: {
        tableId,
        status: 'active',
      },
      include: {
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      // Create new session
      session = await prisma.tableSession.create({
        data: {
          tableId,
          businessId: table.businessId,
          status: 'active',
        },
        include: {
          participants: true,
        },
      });
    }

    // Check if participant already exists with this tempId
    let participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_tempId: {
          sessionId: session.id,
          tempId,
        },
      },
    });

    if (!participant) {
      // Create new participant
      participant = await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          tempId,
          name: name || `Guest ${session.participants.length + 1}`,
        },
      });

      // Check if they came via invite
      const inviteCode = req.body.inviteCode
      if (inviteCode) {
        try {
          const { TableInviteService } = await import('@/lib/services/table-invite.service')
          
          // Accept the invite
          const inviteResult = await TableInviteService.acceptInvite({
            inviteCode,
            inviteeId: participant.id
          })

          if (inviteResult.success) {
            // Check if inviter qualifies for reward
            const invite = await prisma.tableSessionInvite.findUnique({
              where: { inviteCode }
            })

            if (invite) {
              await TableInviteService.checkInviteReward(invite.inviterId)
            }
          }
        } catch (error) {
          console.error('Error processing invite:', error)
          // Don't fail the join if invite processing fails
        }
      }
    }

    return res.status(200).json({
      sessionId: session.id,
      participantId: participant.id,
      tableName: `Table ${table.number}`,
      participantName: participant.name,
      isNewSession: session.participants.length === 0,
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return res.status(500).json({ error: 'Failed to join session' });
  }
}
