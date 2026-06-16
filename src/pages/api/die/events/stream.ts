import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const user = session.user as any
  const businessId = user.businessId as string | undefined
  if (!businessId) return res.status(400).json({ error: 'No business' })

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const p: any = prisma

  // Send initial state
  const sendUpdate = async () => {
    try {
      const [processing, review, approved, anomalies] = await Promise.all([
        p.scanJob.count({ where: { businessId, status: { in: ['UPLOADED', 'OCR_PROCESSING', 'EXTRACTED'] } } }),
        p.scannedDocument.count({ where: { businessId, status: { in: ['INTELLIGENCE_DONE', 'REVIEW'] } } }),
        p.scannedDocument.count({ where: { businessId, status: 'APPROVED' } }),
        p.anomalyAlert.count({ where: { businessId, status: 'OPEN' } }),
      ])

      const recentJobs = await p.scanJob.findMany({
        where: { businessId, status: { in: ['UPLOADED', 'OCR_PROCESSING', 'EXTRACTED', 'INTELLIGENCE_DONE'] } },
        select: { id: true, status: true, documentType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const data = { processing, review, approved, anomalies, recentJobs, ts: Date.now() }
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch {
      // Connection may have closed
    }
  }

  // Initial push
  await sendUpdate()

  // Poll every 3 seconds
  const interval = setInterval(sendUpdate, 3000)

  // Cleanup on close
  req.on('close', () => {
    clearInterval(interval)
    res.end()
  })
}
