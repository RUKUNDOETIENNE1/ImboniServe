import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { EditorialService } from '@/lib/content/editorial.service'
import { hasEditorialAccess, getEditorialUser } from '@/lib/content/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!hasEditorialAccess(session)) return res.status(403).json({ error: 'Editorial access required' })

  const { id } = req.query as { id: string }
  const editorialUser = getEditorialUser(session)!

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { toStatus, note, scheduledAt } = req.body || {}

  if (!toStatus) return res.status(400).json({ error: 'toStatus is required' })

  if (!EditorialService.hasRoleForTransition(
    editorialUser.roles,
    editorialUser.editorialRoles,
    '', // will be checked inside service after fetching article
    toStatus
  )) {
    // We don't know fromStatus yet, but we can pre-check role generically
    // The service will do the authoritative check
  }

  try {
    const article = await EditorialService.getArticle(id)
    if (!article) return res.status(404).json({ error: 'Article not found' })

    if (!EditorialService.hasRoleForTransition(
      editorialUser.roles,
      editorialUser.editorialRoles,
      article.status,
      toStatus
    )) {
      return res.status(403).json({ error: `Insufficient role for transition from ${article.status} to ${toStatus}` })
    }

    const updated = await EditorialService.transition(id, toStatus, editorialUser.id, {
      note,
      scheduledAt,
    })

    const transitions = await (await import('@/lib/prisma')).prisma.$queryRawUnsafe(
      `SELECT * FROM "ContentTransition" WHERE "articleId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      id
    )

    return res.status(200).json({ article: updated, transition: (transitions as any[])?.[0] || null })
  } catch (err: any) {
    const msg = err.message
    if (msg.includes('not found')) return res.status(404).json({ error: msg })
    if (msg.includes('Invalid transition') || msg.includes('already in'))
      return res.status(400).json({ error: msg })
    if (msg.includes('Note is required') || msg.includes('scheduledAt is required'))
      return res.status(400).json({ error: msg })
    return res.status(500).json({ error: msg })
  }
}
