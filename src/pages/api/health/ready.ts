import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, boolean> = { database: false }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch {
    checks.database = false
  }

  const allOk = Object.values(checks).every(Boolean)
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  })
}
