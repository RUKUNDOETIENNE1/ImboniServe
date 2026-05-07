import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { realtimeService } from '@/lib/realtime'

/**
 * Waiter Call Management API
 * PATCH - Acknowledge or resolve a waiter call
 * DELETE - Cancel a waiter call
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (req.method === 'PATCH') {
    return handleUpdateWaiterCall(req, res, session)
  }

  if (req.method === 'DELETE') {
    return handleDeleteWaiterCall(req, res, session)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleUpdateWaiterCall(
  req: NextApiRequest, 
  res: NextApiResponse,
  session: any
) {
  try {
    const { id } = req.query
    const { action } = req.body // 'acknowledge' or 'resolve'

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Call ID is required' })
    }

    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }

    // Get current call
    const call = await prisma.waiterCall.findUnique({
      where: { id },
      include: {
        table: {
          select: {
            number: true,
            businessId: true
          }
        }
      }
    })

    if (!call) {
      return res.status(404).json({ error: 'Waiter call not found' })
    }

    // Verify user has access to this business (if authenticated)
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { businessId: true }
      })

      if (user?.businessId !== call.table.businessId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Update call based on action
    const updateData: any = {}
    
    if (action === 'acknowledge') {
      updateData.status = 'acknowledged'
      updateData.acknowledgedAt = new Date()
      updateData.acknowledgedBy = session?.user?.id || 'staff'
    } else if (action === 'resolve') {
      updateData.status = 'resolved'
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = session?.user?.id || 'staff'
    }

    const updatedCall = await prisma.waiterCall.update({
      where: { id },
      data: updateData
    })

    // Notify staff of status change
    await realtimeService.emit(
      `business-${call.table.businessId}`,
      'waiter-call-updated',
      {
        id: updatedCall.id,
        status: updatedCall.status,
        tableNumber: call.table.number,
        action
      }
    )

    return res.status(200).json({
      success: true,
      call: updatedCall
    })
  } catch (error) {
    console.error('Update waiter call error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDeleteWaiterCall(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Call ID is required' })
    }

    // Get call to verify ownership
    const call = await prisma.waiterCall.findUnique({
      where: { id },
      include: {
        table: {
          select: {
            businessId: true
          }
        }
      }
    })

    if (!call) {
      return res.status(404).json({ error: 'Waiter call not found' })
    }

    // Verify access (if authenticated)
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { businessId: true }
      })

      if (user?.businessId !== call.table.businessId) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Delete call
    await prisma.waiterCall.delete({
      where: { id }
    })

    // Notify staff
    await realtimeService.emit(
      `business-${call.table.businessId}`,
      'waiter-call-deleted',
      { id, tableId: call.tableId }
    )

    return res.status(200).json({
      success: true,
      message: 'Waiter call deleted'
    })
  } catch (error) {
    console.error('Delete waiter call error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
