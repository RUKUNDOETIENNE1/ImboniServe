import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const requestedCode = String(req.body?.code || '').trim().toUpperCase()
  if (!requestedCode) {
    return res.status(400).json({ error: 'Currency code is required' })
  }

  const userEmail = String((session.user as any).email || '')
  if (!userEmail) {
    return res.status(400).json({ error: 'Session missing user email' })
  }

  const supported = await prisma.supportedCurrency.findUnique({
    where: { code: requestedCode },
    select: { code: true, isActive: true, displayEnabled: true },
  })
  if (!supported || !supported.isActive || !supported.displayEnabled) {
    return res.status(400).json({ error: `Unsupported default currency: ${requestedCode}` })
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, business: { select: { id: true } } },
  })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { preferredCurrency: requestedCode },
  })

  if (user.business?.id) {
    await prisma.business.update({
      where: { id: user.business.id },
      data: { currency: requestedCode },
    })
  }

  return res.status(200).json({
    success: true,
    defaultCurrency: requestedCode,
    persisted: {
      userPreferredCurrency: true,
      businessCurrency: Boolean(user.business?.id),
    },
  })
}
