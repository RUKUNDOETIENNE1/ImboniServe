import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { TranslationService, SUPPORTED_LOCALES } from '@/lib/services/translation.service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requiresFeature } from '@/lib/middleware/withFeatureCheck'

const upsertSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  name: z.string().min(1),
  description: z.string().optional(),
})

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  const { id: menuItemId } = req.query
  if (!menuItemId || typeof menuItemId !== 'string') return res.status(400).json({ error: 'menuItemId required' })

  // Tenant isolation: the menu item must belong to the caller's business.
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, businessId },
    select: { id: true },
  })
  if (!menuItem) return res.status(404).json({ error: 'Menu item not found' })

  if (req.method === 'GET') {
    const translations = await TranslationService.getTranslations(menuItemId)
    return res.status(200).json({ translations })
  }

  if (req.method === 'PUT') {
    const parsed = upsertSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })
    const t = await TranslationService.upsertTranslation({ menuItemId, businessId, ...parsed.data })
    return res.status(200).json({ translation: t })
  }

  if (req.method === 'DELETE') {
    const { locale } = req.query
    if (!locale || typeof locale !== 'string') return res.status(400).json({ error: 'locale required' })
    await TranslationService.deleteTranslation(menuItemId, locale)
    return res.status(204).end()
  }

  return res.status(405).end()
}

// Apply commercial enforcement: Menu Translations require Professional plan or higher
export default requiresFeature('hasMultiLanguageMenus')(baseHandler)
