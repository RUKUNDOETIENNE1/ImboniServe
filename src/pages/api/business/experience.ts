import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { ExperienceService, ExperienceAreaOverride } from '@/lib/services/experience.service'

/**
 * Owner/staff-facing management endpoint for the Digital Business
 * Experience. GET returns the dashboard state; POST toggles publish and
 * saves high-level area overrides.
 *
 * Authorization: resolveBusinessContext enforces session + business
 * membership — same boundary as tables/staff/settings routes.
 */

// Only the standardized scene areas may be configured — arbitrary keys rejected.
const CONFIGURABLE_AREAS = ['entrance', 'dining-area', 'kitchen', 'bar', 'terrace']
const MANAGE_ROLES = ['OWNER', 'ADMIN', 'MANAGER']

function sanitizeAreas(raw: unknown): Record<string, ExperienceAreaOverride> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, ExperienceAreaOverride> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!CONFIGURABLE_AREAS.includes(key) || !value || typeof value !== 'object') continue
    const v = value as any
    out[key] = {
      ...(typeof v.enabled === 'boolean' ? { enabled: v.enabled } : {}),
      ...(typeof v.label === 'string' && v.label.trim()
        ? { label: v.label.trim().slice(0, 60) }
        : {}),
      ...(typeof v.description === 'string' && v.description.trim()
        ? { description: v.description.trim().slice(0, 200) }
        : {}),
    }
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  try {
    if (req.method === 'GET') {
      const state = await ExperienceService.getDashboardState(ctx.businessId)
      return res.status(200).json(state)
    }

    if (req.method === 'POST') {
      if (!ctx.roles.some((r) => MANAGE_ROLES.includes(r))) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      const { enabled, areas } = req.body || {}

      const profile = await prisma.businessProfile.findUnique({
        where: { businessId: ctx.businessId },
      })
      if (!profile) {
        return res.status(409).json({
          error: 'Publish your business profile before enabling the experience',
          code: 'NO_PROFILE',
        })
      }

      const updates: Record<string, unknown> = {}
      if (typeof enabled === 'boolean') {
        if (enabled && !profile.isPublished) {
          return res.status(409).json({
            error: 'Your public business profile must be published first',
            code: 'PROFILE_UNPUBLISHED',
          })
        }
        updates.experienceEnabled = enabled
      }
      if (areas !== undefined) {
        updates.experienceConfig = { areas: sanitizeAreas(areas) }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nothing to update' })
      }

      await prisma.businessProfile.update({ where: { businessId: ctx.businessId }, data: updates })
      const state = await ExperienceService.getDashboardState(ctx.businessId)
      return res.status(200).json(state)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Experience settings error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
