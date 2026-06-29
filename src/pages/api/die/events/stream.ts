import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveBusinessContext } from '@/lib/api/business-context'
import { prisma } from '@/lib/prisma'

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// Server-side connection cap to prevent DB overload from many simultaneous SSE clients
const MAX_SSE_CONNECTIONS = 50
let activeSSEConnections = 0

// Minimum allowed poll interval (ms) — enforced server-side regardless of setInterval value
const MIN_POLL_INTERVAL_MS = 5000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (activeSSEConnections >= MAX_SSE_CONNECTIONS) {
    return res.status(503).json({ error: 'Too many active SSE connections. Please retry shortly.' })
  }

  const ctx = await resolveBusinessContext(req, res)
  if (!ctx) return
  const { businessId } = ctx

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  activeSSEConnections++
  let closed = false

  const p: any = prisma

  // Send initial state
  const sendUpdate = async () => {
    if (closed) return
    try {
      const [processing, review, approved, anomalies, applied, failed] = await Promise.all([
        p.scanJob.count({ where: { businessId, status: { in: ['UPLOADED', 'OCR_PROCESSING', 'EXTRACTED'] } } }),
        p.scannedDocument.count({ where: { businessId, status: { in: ['INTELLIGENCE_DONE', 'REVIEW'] } } }),
        p.scannedDocument.count({ where: { businessId, status: 'APPROVED' } }),
        p.anomalyAlert.count({ where: { businessId, status: 'OPEN' } }),
        p.scannedDocument.count({ where: { businessId, status: 'APPLIED' } }),
        p.scannedDocument.count({ where: { businessId, status: 'FAILED' } }),
      ])

      const [extractWaiting, extractActive, extractCompleted, extractFailed] = await Promise.all([
        p.scanJob.count({ where: { businessId, status: 'UPLOADED' } }),
        p.scanJob.count({ where: { businessId, status: 'OCR_PROCESSING' } }),
        p.scanJob.count({ where: { businessId, status: 'EXTRACTED' } }),
        p.scanJob.count({ where: { businessId, status: 'FAILED' } }),
      ])

      const [intelWaiting, intelCompleted, intelFailed] = await Promise.all([
        p.scannedDocument.count({ where: { businessId, status: 'EXTRACTED' } }),
        p.scannedDocument.count({ where: { businessId, status: { in: ['INTELLIGENCE_DONE', 'REVIEW', 'APPROVED', 'APPLIED'] } } }),
        p.scannedDocument.count({ where: { businessId, status: 'FAILED' } }),
      ])

      const recentJobs = await p.scanJob.findMany({
        where: { businessId, status: { in: ['UPLOADED', 'OCR_PROCESSING', 'EXTRACTED', 'INTELLIGENCE_DONE'] } },
        select: { id: true, status: true, documentType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      const recentEvents = await p.documentProcessingLog.findMany({
        where: { scanJob: { businessId } },
        select: { id: true, stage: true, level: true, message: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      const todayStart = startOfDay()
      const hourStart = new Date(Date.now() - 60 * 60 * 1000)

      const [ocrProcessingCount, extractedCount, reviewCount, approvedCount, appliedCount, failedCount] = await Promise.all([
        p.scanJob.count({ where: { businessId, status: 'OCR_PROCESSING' } }),
        p.scannedDocument.count({ where: { businessId, status: 'EXTRACTED' } }),
        p.scannedDocument.count({ where: { businessId, status: { in: ['INTELLIGENCE_DONE', 'REVIEW'] } } }),
        p.scannedDocument.count({ where: { businessId, status: 'APPROVED' } }),
        p.scannedDocument.count({ where: { businessId, status: 'APPLIED' } }),
        p.scannedDocument.count({ where: { businessId, status: 'FAILED' } }),
      ])

      const completedExtracts = await p.scanJob.findMany({
        where: { businessId, status: 'EXTRACTED', updatedAt: { gte: hourStart } },
        select: { createdAt: true, updatedAt: true },
        take: 500,
      })

      const avgProcessingTimeMinutes = (() => {
        if (completedExtracts.length === 0) return null
        const totalMs = completedExtracts.reduce(
          (acc: number, j: any) => acc + (new Date(j.updatedAt).getTime() - new Date(j.createdAt).getTime()),
          0,
        )
        return Math.max(0, Math.round(totalMs / completedExtracts.length / 60000))
      })()

      const [repairedToday, replayedToday, failedRepairsToday] = await Promise.all([
        p.documentProcessingLog.count({
          where: {
            createdAt: { gte: todayStart },
            stage: 'repair',
            level: 'info',
            message: { contains: 'Repair completed', mode: 'insensitive' },
            scanJob: { businessId },
          },
        }),
        p.documentEventTimeline.count({
          where: {
            createdAt: { gte: todayStart },
            stage: { contains: 'replay', mode: 'insensitive' },
            scannedDocument: { businessId },
          },
        }),
        p.documentProcessingLog.count({
          where: {
            createdAt: { gte: todayStart },
            stage: 'repair',
            level: 'error',
            scanJob: { businessId },
          },
        }),
      ])

      const [anomOpen, anomAck, anomResolved] = await Promise.all([
        p.anomalyAlert.count({ where: { businessId, status: 'OPEN' } }),
        p.anomalyAlert.count({ where: { businessId, status: 'ACKNOWLEDGED' } }),
        p.anomalyAlert.count({ where: { businessId, status: 'RESOLVED' } }),
      ])

      const data = {
        processing,
        review,
        approved,
        applied,
        failed,
        anomalies,
        queues: {
          extraction: {
            waiting: extractWaiting,
            active: extractActive,
            completed: extractCompleted,
            failed: extractFailed,
          },
          intelligence: {
            waiting: intelWaiting,
            active: 0,
            completed: intelCompleted,
            failed: intelFailed,
          },
        },
        recentJobs,
        recentEvents: recentEvents.map((e: any) => ({
          id: e.id,
          type: e.stage?.toUpperCase() || 'EVENT',
          level: e.level,
          message: e.message,
          timestamp: e.createdAt,
        })),
        opsMetrics: {
          lifecycleDistribution: {
            OCR_PROCESSING: ocrProcessingCount,
            EXTRACTED: extractedCount,
            REVIEW: reviewCount,
            APPROVED: approvedCount,
            APPLIED: appliedCount,
            FAILED: failedCount,
          },
          throughput: {
            docsPerHour: completedExtracts.length,
            avgProcessingTimeMinutes,
            queueLatencyMinutes: null,
          },
          repairMetrics: {
            repairedToday,
            replayedToday,
            failedRepairsToday,
          },
          anomalyMetrics: {
            open: anomOpen,
            acknowledged: anomAck,
            resolved: anomResolved,
          },
        },
        ts: Date.now(),
      }
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch {
      // Connection may have closed
    }
  }

  // Initial push
  await sendUpdate()

  // Poll at minimum MIN_POLL_INTERVAL_MS regardless of client expectations
  const interval = setInterval(() => { void sendUpdate() }, MIN_POLL_INTERVAL_MS)

  // Cleanup on close — decrement connection counter and stop interval
  req.on('close', () => {
    closed = true
    activeSSEConnections = Math.max(0, activeSSEConnections - 1)
    clearInterval(interval)
    res.end()
  })
}
