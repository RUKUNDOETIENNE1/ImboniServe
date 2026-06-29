import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { resolveBusinessContext } from '@/lib/api/business-context'

/**
 * Setup Status API
 * Returns progress for onboarding steps and first value detection for a business.
 * Steps considered (restaurants only):
 * - hasMenu: at least 1 MenuItem
 * - hasTables: at least 1 Table
 * - hasStaff: more than 1 User assigned to the business
 * - hasFirstSale: at least 1 Sale with paymentStatus COMPLETED
 *
 * Percent complete counts hasMenu + hasTables + hasStaff (0-3 steps) equally.
 * First value is reported separately as `firstValueAchieved`.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return

  const { businessId, userId } = ctx

  try {
    const [menuCount, tableCount, userCount, firstSale] = await Promise.all([
      prisma.menuItem.count({ where: { businessId } }),
      prisma.table.count({ where: { businessId } }),
      prisma.user.count({ where: { businessId } }),
      prisma.sale.findFirst({ where: { businessId, paymentStatus: 'COMPLETED' }, orderBy: { createdAt: 'asc' }, select: { id: true, createdAt: true } }),
    ])

    const hasMenu = menuCount > 0
    const hasTables = tableCount > 0
    const hasStaff = userCount > 1 // owner + at least 1 staff

    const steps = [hasMenu, hasTables, hasStaff]
    const completedSteps = steps.filter(Boolean).length
    const percentComplete = Math.round((completedSteps / steps.length) * 100)

    const coreSetupComplete = hasMenu && hasTables
    const firstValueAchieved = Boolean(firstSale)

    // Pick next action
    const nextAction = !hasMenu
      ? { code: 'ADD_MENU', label: 'Add your first menu item', href: '/dashboard/menu-builder' }
      : !hasTables
      ? { code: 'ADD_TABLE', label: 'Add your first table', href: '/dashboard/tables' }
      : !hasStaff
      ? { code: 'INVITE_STAFF', label: 'Invite your first staff member', href: '/dashboard/staff' }
      : !firstValueAchieved
      ? { code: 'CREATE_SALE', label: 'Record your first sale', href: '/dashboard/sales' }
      : { code: 'DONE', label: 'Setup complete', href: '/dashboard' }

    return res.status(200).json({
      businessId,
      progress: {
        hasMenu,
        hasTables,
        hasStaff,
        completedSteps,
        totalSteps: steps.length,
        percentComplete,
      },
      firstValue: {
        achieved: firstValueAchieved,
        firstSaleAt: firstSale?.createdAt ?? null,
      },
      coreSetupComplete,
      nextAction,
    })
  } catch (error) {
    console.error('Setup status error:', error)
    return res.status(500).json({ error: 'Failed to compute setup status' })
  }
}
