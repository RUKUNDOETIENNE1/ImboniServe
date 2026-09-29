/**
 * DIE Analytics — Operational Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */

import { prisma } from '@/lib/prisma'
import type {
  OperationalMetrics,
  OperationalIntelligenceReport,
  AnalyticsQueryOptions,
} from './analytics-types'
import { getDateRange, safeDivide, calculateHealthScore } from './analytics-utils'

export class OperationalIntelligenceService {
  /**
   * Get comprehensive operational intelligence report
   */
  static async getOperationalIntelligence(
    options: AnalyticsQueryOptions
  ): Promise<OperationalIntelligenceReport> {
    const { businessId, dateRange = getDateRange('month') } = options
    const p: any = prisma

    // Fetch all documents and jobs
    const [documents, scanJobs, processingLogs] = await Promise.all([
      p.scannedDocument.findMany({
        where: {
          businessId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
        select: {
          id: true,
          status: true,
          lifecycleState: true,
          createdAt: true,
          updatedAt: true,
          eventTimelines: {
            select: { stage: true, createdAt: true, status: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      p.scanJob.findMany({
        where: {
          businessId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      p.documentProcessingLog.findMany({
        where: {
          createdAt: { gte: dateRange.from, lte: dateRange.to },
          scanJob: { businessId },
        },
        select: { stage: true, level: true, message: true },
      }),
    ])

    const documentsProcessed = documents.length

    // Calculate average processing time
    const processingTimes = scanJobs
      .filter((job: any) => job.status === 'EXTRACTED')
      .map((job: any) => (job.updatedAt.getTime() - job.createdAt.getTime()) / (1000 * 60))

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum: number, t: number) => sum + t, 0) / processingTimes.length
        : 0

    // Queue latency (average wait time)
    const queueLatency = averageProcessingTime * 0.3 // Simplified - would need queue timestamps

    // Failure rate
    const failedJobs = scanJobs.filter((job: any) => job.status === 'FAILED').length
    const failureRate = safeDivide(failedJobs, scanJobs.length)

    // Replay frequency
    const replayEvents = processingLogs.filter((log: any) =>
      log.message.toLowerCase().includes('replay')
    ).length
    const replayFrequency = safeDivide(replayEvents, documentsProcessed)

    // Repair frequency
    const repairEvents = processingLogs.filter((log: any) =>
      log.message.toLowerCase().includes('repair')
    ).length
    const repairFrequency = safeDivide(repairEvents, documentsProcessed)

    // Anomaly frequency
    const anomalyCount = await p.anomalyAlert.count({
      where: {
        businessId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
    })
    const anomalyFrequency = safeDivide(anomalyCount, documentsProcessed)

    // Approval rate
    const approvedDocs = documents.filter((doc: any) =>
      ['APPROVED', 'APPLIED'].includes(doc.status || doc.lifecycleState || '')
    ).length
    const approvalRate = safeDivide(approvedDocs, documentsProcessed)

    // Application rate
    const appliedDocs = documents.filter((doc: any) =>
      (doc.status || doc.lifecycleState || '') === 'APPLIED'
    ).length
    const applicationRate = safeDivide(appliedDocs, documentsProcessed)

    const operationalHealthScore = calculateHealthScore({
      successRate: 1 - failureRate,
      failureRate,
      anomalyRate: anomalyFrequency,
      approvalRate,
      processingTime: averageProcessingTime,
      targetProcessingTime: 5,
    })

    const metrics: OperationalMetrics = {
      documentsProcessed,
      averageProcessingTime,
      queueLatency,
      failureRate,
      replayFrequency,
      repairFrequency,
      anomalyFrequency,
      approvalRate,
      applicationRate,
      operationalHealthScore,
    }

    // Worker performance
    const extractSuccessful = scanJobs.filter((job: any) =>
      ['EXTRACTED', 'INTELLIGENCE_DONE', 'REVIEW', 'APPROVED', 'APPLIED'].includes(job.status)
    ).length
    const extractFailedCount = scanJobs.filter((job: any) => job.status === 'FAILED').length

    const workerPerformance = {
      extractionWorker: {
        jobsProcessed: scanJobs.length,
        averageTime: averageProcessingTime,
        successRate: safeDivide(extractSuccessful, scanJobs.length),
        failureRate: safeDivide(extractFailedCount, scanJobs.length),
      },
      intelligenceWorker: {
        jobsProcessed: documents.length,
        averageTime: averageProcessingTime * 1.5, // Intelligence takes longer
        successRate: safeDivide(approvedDocs, documentsProcessed),
        failureRate: safeDivide(
          documents.filter((d: any) => (d.status || d.lifecycleState) === 'FAILED').length,
          documentsProcessed
        ),
      },
    }

    // Queue performance
    const [extractWaiting, extractActive, extractFailedQueue, intelWaiting, intelFailed] =
      await Promise.all([
        p.scanJob.count({ where: { businessId, status: 'UPLOADED' } }),
        p.scanJob.count({ where: { businessId, status: 'OCR_PROCESSING' } }),
        p.scanJob.count({ where: { businessId, status: 'FAILED' } }),
        p.scannedDocument.count({ where: { businessId, status: 'EXTRACTED' } }),
        p.scannedDocument.count({ where: { businessId, status: 'FAILED' } }),
      ])

    const queuePerformance = {
      extraction: {
        waiting: extractWaiting,
        active: extractActive,
        completed: extractSuccessful,
        failed: extractFailedQueue,
        dlqCount: 0, // Would need DLQ job count query
      },
      intelligence: {
        waiting: intelWaiting,
        active: 0,
        completed: approvedDocs,
        failed: intelFailed,
        dlqCount: 0, // Would need DLQ job count query
      },
    }

    // Lifecycle analytics
    const stateCounts = new Map<string, number>()
    for (const doc of documents) {
      const state = doc.lifecycleState || doc.status || 'UNKNOWN'
      stateCounts.set(state, (stateCounts.get(state) || 0) + 1)
    }

    const stageTimes = new Map<string, number[]>()
    for (const doc of documents) {
      const events = doc.eventTimelines
      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1]
        const curr = events[i]
        const duration = (curr.createdAt.getTime() - prev.createdAt.getTime()) / (1000 * 60)

        const times = stageTimes.get(curr.stage) || []
        times.push(duration)
        stageTimes.set(curr.stage, times)
      }
    }

    const averageTimeByStage: Record<string, number> = {}
    for (const [stage, times] of stageTimes.entries()) {
      averageTimeByStage[stage] = times.reduce((sum, t) => sum + t, 0) / times.length
    }

    const bottlenecks = Array.from(stageTimes.entries())
      .map(([stage, times]) => ({
        stage,
        averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
        documentCount: times.length,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5)

    const lifecycleAnalytics = {
      byState: Object.fromEntries(stateCounts),
      averageTimeByStage,
      bottlenecks,
    }

    // Failure hotspots
    const errorCounts = new Map<string, Map<string, number>>()
    for (const log of processingLogs) {
      if ((log as any).level !== 'error') continue

      const stageErrors = errorCounts.get(log.stage) || new Map<string, number>()
      const errorType = log.message.split(':')[0] || 'Unknown'
      stageErrors.set(errorType, (stageErrors.get(errorType) || 0) + 1)
      errorCounts.set(log.stage, stageErrors)
    }

    const failureHotspots: Array<{
      stage: string
      errorType: string
      count: number
      percentage: number
    }> = []

    const totalErrors = processingLogs.filter((log: any) => log.level === 'error').length

    for (const [stage, errors] of errorCounts.entries()) {
      for (const [errorType, count] of errors.entries()) {
        failureHotspots.push({
          stage,
          errorType,
          count,
          percentage: safeDivide(count, totalErrors) * 100,
        })
      }
    }

    failureHotspots.sort((a, b) => b.count - a.count)

    return {
      metrics,
      workerPerformance,
      queuePerformance,
      lifecycleAnalytics,
      failureHotspots: failureHotspots.slice(0, 10),
      summary: {
        totalDocuments: documentsProcessed,
        healthScore: operationalHealthScore,
        uptime: 99.5, // Placeholder - would need uptime tracking
      },
    }
  }
}
