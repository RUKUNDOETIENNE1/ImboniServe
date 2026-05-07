import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  dailyReportEnabled: z.boolean().optional(),
  dailyReportLocalTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().min(1).max(64).optional(),
  whatsappOwnerReportsEnabled: z.boolean().optional(),
  whatsappClientSlipsEnabled: z.boolean().optional(),
  whatsappDailyCapClient: z.number().int().min(1).max(500).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const businessId = (session?.user as any)?.businessId
  if (!session?.user || !businessId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        dailyReportEnabled: true,
        dailyReportLocalTime: true,
        timezone: true,
        whatsappOwnerReportsEnabled: true,
        whatsappClientSlipsEnabled: true,
        whatsappDailyCapClient: true,
        whatsappNumber: true,
        lastDailyReportSentForDate: true,
      },
    })
    return res.status(200).json(business)
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues })

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: parsed.data as any,
      select: {
        dailyReportEnabled: true,
        dailyReportLocalTime: true,
        timezone: true,
        whatsappOwnerReportsEnabled: true,
        whatsappClientSlipsEnabled: true,
        whatsappDailyCapClient: true,
      },
    })
    return res.status(200).json(updated)
  }

  return res.status(405).end()
}
