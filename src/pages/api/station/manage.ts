/**
 * Station Management API
 * Create, update, and manage stations
 * Phase 2: Station Execution Layer
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  // GET - List all stations (including inactive)
  if (req.method === 'GET') {
    try {
      const stations = await prisma.station.findMany({
        where: {
          businessId: ctx.businessId!,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      })

      return res.status(200).json({
        success: true,
        stations,
      })
    } catch (error) {
      console.error('Error fetching stations:', error)
      return res.status(500).json({ error: 'Failed to fetch stations' })
    }
  }

  // POST - Create new station
  if (req.method === 'POST') {
    try {
      const { name, code, type } = req.body

      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' })
      }

      // Check if code already exists
      const existing = await prisma.station.findFirst({
        where: {
          businessId: ctx.businessId!,
          code: code.toUpperCase(),
        },
      })

      if (existing) {
        return res.status(400).json({ error: 'Station code already exists' })
      }

      // Get max display order
      const maxOrder = await prisma.station.findFirst({
        where: { businessId: ctx.businessId! },
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      })

      const station = await prisma.station.create({
        data: {
          businessId: ctx.businessId!,
          name,
          code: code.toUpperCase(),
          type: type || 'OTHER',
          displayOrder: (maxOrder?.displayOrder || 0) + 1,
          isActive: true,
        },
      })

      return res.status(201).json({
        success: true,
        station,
      })
    } catch (error) {
      console.error('Error creating station:', error)
      return res.status(500).json({ error: 'Failed to create station' })
    }
  }

  // PATCH - Update station (toggle active, etc.)
  if (req.method === 'PATCH') {
    try {
      const { stationId, isActive, name } = req.body

      if (!stationId) {
        return res.status(400).json({ error: 'stationId is required' })
      }

      // Verify station belongs to business
      const station = await prisma.station.findUnique({
        where: { id: stationId },
        select: { businessId: true },
      })

      if (!station || station.businessId !== ctx.businessId) {
        return res.status(404).json({ error: 'Station not found' })
      }

      const updateData: any = {}
      if (typeof isActive === 'boolean') updateData.isActive = isActive
      if (name) updateData.name = name

      const updated = await prisma.station.update({
        where: { id: stationId },
        data: updateData,
      })

      return res.status(200).json({
        success: true,
        station: updated,
      })
    } catch (error) {
      console.error('Error updating station:', error)
      return res.status(500).json({ error: 'Failed to update station' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requirePermission('settings.manage')(handler)
