import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { TranslationService, SUPPORTED_LOCALES } from '@/lib/services/translation.service'
import { z } from 'zod'

const upsertSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  name: z.string().min(1),
  description: z.string().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  const { id: menuItemId } = req.query
  if (!menuItemId || typeof menuItemId !== 'string') return res.status(400).json({ error: 'menuItemId required' })

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
