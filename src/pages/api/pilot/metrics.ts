/**
 * Pilot Metrics API
 * Returns real-world adoption metrics for observer dashboard
 * Phase 5: Live Pilot Validation
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/middleware/permission.middleware'
import { resolveBusinessContext } from '@/lib/api/business-context'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const ctx = await resolveBusinessContext(req, res)
    if (!ctx) return

    const { since } = req.query
    const sinceDate = since && typeof since === 'string' ? new Date(since) : null

    // Calculate metrics from TicketEvent log
    const events = await prisma.ticketEvent.findMany({
      where: {
        sale: {
          businessId: ctx.businessId!,
        },
        ...(sinceDate && {
          createdAt: { gte: sinceDate },
        }),
      },
      include: {
        saleItem: {
          select: {
            stationId: true,
            itemStatus: true,
          },
        },
        actor: {
          select: {
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Initialize metrics
    let totalUpdates = 0
    let stationOriginatedUpdates = 0
    let crossStationUpdates = 0
    let managerOverrides = 0
    let offSystemActions = 0
    let totalItems = 0
    let canonicalPathCompletions = 0
    let invalidTransitions = 0
    let hesitationEvents = 0
    let wrongStationAttempts = 0

    const workflowDrifts = new Map<string, { frequency: number; impact: string; description: string }>()

    // Analyze events
    for (const event of events) {
      // Count updates
      if (['ITEM_PREPARING', 'ITEM_READY', 'ITEM_DELIVERED'].includes(event.eventType)) {
        totalUpdates++
        totalItems++

        // Approximate station-originated updates: if saleItem has a station assignment
        if (event.saleItem?.stationId) {
          stationOriginatedUpdates++
        }

        // Check for manager overrides
        if (event.actor?.roles?.includes('ADMIN') || event.actor?.roles?.includes('MANAGER')) {
          managerOverrides++
        }

        // Approximate canonical completion: count delivered events
        if (event.eventType === 'ITEM_DELIVERED') {
          canonicalPathCompletions++
        }
      }

      // Count invalid transitions
      if (event.eventType === 'INVALID_TRANSITION') {
        invalidTransitions++
      }

      // Count wrong station attempts
      if (event.metadata && typeof event.metadata === 'object') {
        const meta = event.metadata as any
        if (meta.wrongStation) {
          wrongStationAttempts++
        }
      }

      // Detect workflow drifts
      if (event.eventType === 'CONFLICT_DETECTED') {
        const driftName = 'Concurrent Updates'
        const existing = workflowDrifts.get(driftName)
        if (existing) {
          existing.frequency++
        } else {
          workflowDrifts.set(driftName, {
            frequency: 1,
            impact: 'medium',
            description: 'Multiple staff updating same item simultaneously',
          })
        }
      }
    }

    // Calculate scores
    const trustScore = totalUpdates > 0
      ? Math.max(0, Math.min(100,
          (stationOriginatedUpdates / totalUpdates) * 100 -
          managerOverrides * 5 -
          offSystemActions * 10
        ))
      : 0

    const complianceScore = totalItems > 0
      ? Math.max(0, Math.min(100,
          (canonicalPathCompletions / totalItems) * 100 -
          invalidTransitions * 3
        ))
      : 0

    const confusionScore = hesitationEvents * 2 + wrongStationAttempts * 5

    const adoptionReadinessScore =
      trustScore * 0.4 +
      complianceScore * 0.25 +
      Math.max(0, 100 - confusionScore) * 0.15 +
      (totalItems > 0 ? (canonicalPathCompletions / totalItems) * 100 : 0) * 0.2

    // Format drifts
    const drifts = Array.from(workflowDrifts.entries()).map(([name, data]) => ({
      name,
      description: data.description,
      frequency: data.frequency,
      impact: data.impact,
    }))

    return res.status(200).json({
      success: true,
      metrics: {
        trustScore,
        complianceScore,
        confusionScore,
        adoptionReadinessScore,
        totalUpdates,
        stationOriginatedUpdates,
        crossStationUpdates,
        managerOverrides,
        offSystemActions,
        totalItems,
        canonicalPathCompletions,
        invalidTransitions,
        hesitationEvents,
        wrongStationAttempts,
        abandonedActions: 0, // Would need client-side tracking
      },
      drifts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching pilot metrics:', error)
    return res.status(500).json({ error: 'Failed to fetch pilot metrics' })
  }
}

function isCanonicalTransition(from: string | null, to: string | null): boolean {
  const canonicalPaths: Record<string, string[]> = {
    NEW: ['PREPARING'],
    PREPARING: ['READY'],
    READY: ['DELIVERED'],
  }

  if (!from || !to) return false

  const allowedNext = canonicalPaths[from]
  return allowedNext ? allowedNext.includes(to) : false
}

export default requirePermission('orders.view')(handler)
