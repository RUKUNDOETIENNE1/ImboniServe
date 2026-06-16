import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { realtimeService } from '@/lib/realtime'

/**
 * Waiter Call API
 * POST - Create new waiter call (public endpoint - works without auth)
 * GET - List waiter calls for business (requires auth)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleCreateWaiterCall(req, res)
  }

  if (req.method === 'GET') {
    return handleListWaiterCalls(req, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleCreateWaiterCall(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tableId, sessionId, reason, customMessage } = req.body

    if (!tableId || !reason) {
      return res.status(400).json({ error: 'tableId and reason are required' })
    }

    // Validate reason
    const validReasons = ['water', 'assistance', 'bill', 'other']
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' })
    }

    // Validate table exists and get business info
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }

    if (table.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Table is not active' })
    }

    // Create waiter call
    const call = await prisma.waiterCall.create({
      data: {
        tableId,
        sessionId: sessionId || null,
        businessId: table.businessId,
        reason,
        customMessage: reason === 'other' ? customMessage : null,
        status: 'pending',
        priority: reason === 'bill' ? 2 : 1 // Bill requests are higher priority
      }
    })

    // Send real-time notification to staff
    const reasonLabels = {
      water: '💧 Water',
      assistance: '🙋 Assistance',
      bill: '💰 Bill',
      other: '✏️ Custom Request'
    }

    await realtimeService.emit(
      `business-${table.businessId}`,
      'waiter-call',
      {
        id: call.id,
        tableId: table.id,
        tableNumber: table.number,
        reason: call.reason,
        reasonLabel: reasonLabels[call.reason as keyof typeof reasonLabels],
        customMessage: call.customMessage,
        priority: call.priority,
        timestamp: call.createdAt,
        businessName: table.business.name
      }
    )

    // Track event
    try {
      await fetch(`${req.headers.origin || ''}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waiter_called',
          entityType: 'WaiterCall',
          entityId: call.id,
          metadata: { 
            reason: call.reason,
            tableId: table.id,
            tableNumber: table.number
          },
          sessionId: sessionId || null,
        }),
      })
    } catch {}

    return res.status(201).json({
      success: true,
      callId: call.id,
      message: 'Waiter has been notified',
      estimatedResponseTime: '2-5 minutes'
    })
  } catch (error) {
    console.error('Create waiter call error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleListWaiterCalls(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { businessId, status } = req.query

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ error: 'businessId is required' })
    }

    // Verify user has access to this business
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { businessId: true }
    })

    if (user?.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const where: any = { businessId }
    
    if (status && typeof status === 'string') {
      where.status = status
    }

    const calls = await prisma.waiterCall.findMany({
      where,
      include: {
        table: {
          select: {
            number: true,
            capacity: true
          }
        },
        session: {
          select: {
            id: true,
            participants: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50 // Limit to recent 50 calls
    })

    return res.status(200).json({ calls })
  } catch (error) {
    console.error('List waiter calls error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
