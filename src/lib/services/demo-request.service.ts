import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { DemoRequestStatus } from '@prisma/client'

/**
 * Demo Request Service
 * GROWTH LAYER - Lead generation only
 * NO integration with revenue/wallet/payout systems
 */

export class DemoRequestService {
  /**
   * Create a new demo request
   */
  static async createRequest(params: {
    name: string
    businessName: string
    contact: string
    message?: string
  }) {
    try {
      const request = await prisma.demoRequest.create({
        data: {
          name: params.name,
          businessName: params.businessName,
          contact: params.contact,
          message: params.message,
          status: 'PENDING'
        }
      })

      logger.info('Demo request created', { id: request.id, name: params.name })
      return request
    } catch (error) {
      logger.error('Failed to create demo request', { error })
      throw new Error('Failed to create demo request')
    }
  }

  /**
   * Get all demo requests (admin)
   */
  static async getAllRequests(params?: {
    status?: DemoRequestStatus
    limit?: number
    offset?: number
  }) {
    try {
      const where: any = {}
      if (params?.status) where.status = params.status

      const [requests, total] = await Promise.all([
        prisma.demoRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: params?.limit || 50,
          skip: params?.offset || 0
        }),
        prisma.demoRequest.count({ where })
      ])

      return { requests, total }
    } catch (error) {
      logger.error('Failed to get demo requests', { error })
      throw new Error('Failed to get demo requests')
    }
  }

  /**
   * Update demo request status (admin)
   */
  static async updateStatus(params: {
    id: string
    status: DemoRequestStatus
    contactedBy?: string
    notes?: string
  }) {
    try {
      const data: any = {
        status: params.status,
        notes: params.notes
      }

      if (params.status === 'CONTACTED') {
        data.contactedAt = new Date()
        data.contactedBy = params.contactedBy
      }

      if (params.status === 'COMPLETED') {
        data.completedAt = new Date()
      }

      const request = await prisma.demoRequest.update({
        where: { id: params.id },
        data
      })

      logger.info('Demo request status updated', { id: params.id, status: params.status })
      return request
    } catch (error) {
      logger.error('Failed to update demo request', { error })
      throw new Error('Failed to update demo request')
    }
  }

  /**
   * Get stats (admin)
   */
  static async getStats() {
    try {
      const [total, pending, contacted, completed] = await Promise.all([
        prisma.demoRequest.count(),
        prisma.demoRequest.count({ where: { status: 'PENDING' } }),
        prisma.demoRequest.count({ where: { status: 'CONTACTED' } }),
        prisma.demoRequest.count({ where: { status: 'COMPLETED' } })
      ])

      return { total, pending, contacted, completed }
    } catch (error) {
      logger.error('Failed to get demo stats', { error })
      throw new Error('Failed to get demo stats')
    }
  }
}
