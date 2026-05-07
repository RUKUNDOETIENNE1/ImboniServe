import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export interface BusinessContext {
  userId: string
  businessId: string
  roles: string[]
  email: string
}

/**
 * Resolves the authenticated user's business context for an API route.
 *
 * - Returns a populated BusinessContext on success.
 * - Returns null after writing the appropriate error response (401/400) when
 *   context cannot be resolved. Callers should `return` immediately when null.
 * - For OWNER users with no session businessId, bootstraps by finding or
 *   creating their business record (mirrors the pattern used in tables, staff,
 *   and payout-summary routes).
 */
export async function resolveBusinessContext(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<BusinessContext | null> {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
    return null
  }

  const user = session.user as any
  const userId: string | undefined = user.id
  const email: string | undefined = user.email
  const roles: string[] = (user.roles as string[]) || []

  if (!userId || !email) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_USER_ID' })
    return null
  }

  let businessId: string | null = (user.businessId as string | undefined) ?? null

  if (!businessId && roles.includes('OWNER')) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })
    businessId = (dbUser as any)?.business?.id ?? (dbUser as any)?.businessId ?? null

    if (!businessId) {
      const owned = await prisma.business.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      })
      if (owned) {
        businessId = owned.id
        if (!(dbUser as any)?.businessId) {
          await prisma.user.update({ where: { id: userId }, data: { businessId } })
        }
      } else {
        const created = await prisma.business.create({
          data: {
            name: (dbUser as any)?.name || 'My Business',
            phone: (dbUser as any)?.phone || '0780000000',
            ownerId: userId,
          },
          select: { id: true },
        })
        await prisma.user.update({ where: { id: userId }, data: { businessId: created.id } })
        businessId = created.id
      }
    }
  }

  if (!businessId) {
    res.status(400).json({ error: 'No business associated with account', code: 'NO_BUSINESS' })
    return null
  }

  return { userId, businessId, roles, email }
}
