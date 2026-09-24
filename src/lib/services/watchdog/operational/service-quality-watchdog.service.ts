/**
 * Service Quality Watchdog
 * Phase: 1.2E-B Foundation (Operational Intelligence Core)
 * 
 * Purpose: Detect customer experience deterioration before reputation damage
 * 
 * Monitors:
 * - Service delays
 * - Response times
 * - Unresolved issues
 * - Customer complaint trends
 * - Quality degradation signals
 * 
 * Trust Safeguards:
 * - Cooldown logic (prevent duplicate alerts)
 * - Urgency validation (avoid false CRITICAL)
 * - Explainability (why, evidence, impact, action)
 * 
 * Constraints:
 * - Deterministic rules only (NO ML, NO forecasting)
 * - Operational focus (NOT financial metrics)
 */

import { prisma } from '@/lib/prisma'
import { AlertDeliveryService } from '../../alert-delivery.service'
import { CooldownService } from '../cooldown.service'
import { SuppressionService } from '../suppression.service'
import type { WatchdogAlert, WatchdogResult } from '../types'
import { startOfDay, subDays, subHours } from 'date-fns'

export interface ServiceQualityAlert extends WatchdogAlert {
  locationId?: string
  locationName?: string
  customerImpact: string
  evidence: string[]
  why: string
}

export class ServiceQualityWatchdogService {
  /**
   * Run Service Quality Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: ServiceQualityAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Service response time degradation
      const responseTimeAlerts = await this.checkServiceResponseTime()
      alerts.push(...responseTimeAlerts)

      // Check 2: Customer complaint velocity
      const complaintAlerts = await this.checkComplaintVelocity()
      alerts.push(...complaintAlerts)

      // Check 3: Unresolved issue backlog
      const unresolvedAlerts = await this.checkUnresolvedIssues()
      alerts.push(...unresolvedAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[ServiceQualityWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
          continue
        }

        // Check cooldown
        const shouldSend = await CooldownService.shouldAlert(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (shouldSend) {
          await AlertDeliveryService.deliverWatchdogAlert(alert)
          
          // Register as root cause if CRITICAL or ERROR
          if (alert.severity === 'CRITICAL' || alert.severity === 'ERROR') {
            await SuppressionService.registerRootCause(alert.watchdog, alert.severity)
          }
        }
      }
    } catch (error: any) {
      errors.push(error?.message || String(error))
      console.error('[ServiceQualityWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'SERVICE_QUALITY' as any,
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check 1: Service Response Time Degradation
   * 
   * Detects: Service delays that impact customer experience
   * Urgency: IMMEDIATE (happening now)
   * 
   * Thresholds:
   * - CRITICAL: Response time >2x standard
   * - WARN: Response time 1.5-2x standard
   * 
   * Note: "Response time" varies by business type:
   * - Restaurant: Order to delivery time
   * - Hotel: Check-in to room ready time
   * - Service: Request to fulfillment time
   */
  private static async checkServiceResponseTime(): Promise<ServiceQualityAlert[]> {
    const alerts: ServiceQualityAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    // For each location, check service response time (last 4 hours)
    const fourHoursAgo = subHours(new Date(), 4)

    for (const location of locations) {
      // Get recent orders to calculate response time
      // Note: This uses MarketplaceOrder as a proxy for service delivery
      // In production, you might have dedicated service tracking
      const orders = await prisma.marketplaceOrder.findMany({
        where: {
          branchId: location.id,
          createdAt: { gte: fourHoursAgo },
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      })

      if (orders.length < 5) continue // Need minimum sample size

      // Calculate average response time (in minutes)
      const responseTimes = orders.map(order => {
        const responseMs = order.updatedAt.getTime() - order.createdAt.getTime()
        return responseMs / (1000 * 60) // Convert to minutes
      })

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      
      // Standard response time (configurable per location type)
      // For now, use 15 minutes as standard for restaurant orders
      const standardResponseTime = 15 // minutes

      const responseTimeRatio = avgResponseTime / standardResponseTime

      // CRITICAL: >2x standard response time
      if (responseTimeRatio > 2) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'SERVICE_QUALITY' as any,
          source: `response_time_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL service delays at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          customerImpact: 'Severe customer dissatisfaction. Negative reviews imminent. Revenue at risk.',
          why: `Service response time at ${avgResponseTime.toFixed(1)} minutes (standard: ${standardResponseTime} min). ${responseTimeRatio.toFixed(1)}x slower than normal.`,
          evidence: [
            `Average response time: ${avgResponseTime.toFixed(1)} minutes`,
            `Standard response time: ${standardResponseTime} minutes`,
            `Performance ratio: ${responseTimeRatio.toFixed(1)}x standard`,
            `Sample size: ${orders.length} orders (last 4 hours)`,
            `Slowest response: ${Math.max(...responseTimes).toFixed(1)} minutes`,
          ],
          recommendedAction: `IMMEDIATE INTERVENTION REQUIRED:
1. Investigate bottleneck (kitchen, staffing, equipment)
2. Reallocate staff to critical service points
3. Communicate delays to customers proactively
4. Reduce service scope if necessary (limit menu, close sections)
5. Activate service recovery protocol

Available actions:
- Check kitchen queue depth
- Review current staffing levels
- Inspect equipment status
- Activate delay communication protocol
- Implement service reduction plan`,
          threshold: standardResponseTime * 2,
          currentValue: avgResponseTime,
          cooldownMinutes: 120, // 2 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            avgResponseTime,
            standardResponseTime,
            responseTimeRatio,
            sampleSize: orders.length,
          },
        })
      }
      // WARN: 1.5-2x standard response time
      else if (responseTimeRatio > 1.5) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'SERVICE_QUALITY' as any,
          source: `response_time_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Service delays at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          customerImpact: 'Customer satisfaction at risk. Service quality degrading.',
          why: `Service response time at ${avgResponseTime.toFixed(1)} minutes (standard: ${standardResponseTime} min). ${responseTimeRatio.toFixed(1)}x slower than normal.`,
          evidence: [
            `Average response time: ${avgResponseTime.toFixed(1)} minutes`,
            `Standard response time: ${standardResponseTime} minutes`,
            `Performance ratio: ${responseTimeRatio.toFixed(1)}x standard`,
            `Sample size: ${orders.length} orders (last 4 hours)`,
          ],
          recommendedAction: `ACTION REQUIRED TODAY:
1. Identify cause of slowdown
2. Adjust staffing or processes to improve speed
3. Monitor for further degradation
4. Prepare contingency plan if worsens

Available actions:
- Review current operations
- Check for bottlenecks
- Optimize staff allocation
- Monitor service metrics`,
          threshold: standardResponseTime * 1.5,
          currentValue: avgResponseTime,
          cooldownMinutes: 240, // 4 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            avgResponseTime,
            standardResponseTime,
            responseTimeRatio,
            sampleSize: orders.length,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Check 2: Customer Complaint Velocity
   * 
   * Detects: Accelerating complaint rate indicating quality issues
   * Urgency: SAME_DAY (pattern emerging)
   * 
   * Thresholds:
   * - CRITICAL: >10 complaints/day OR accelerating trend
   * - WARN: 5-10 complaints/day OR stable high
   */
  private static async checkComplaintVelocity(): Promise<ServiceQualityAlert[]> {
    const alerts: ServiceQualityAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    const today = startOfDay(new Date())
    const yesterday = subDays(today, 1)
    const twoDaysAgo = subDays(today, 2)

    for (const location of locations) {
      // Count complaints for today, yesterday, 2 days ago
      // Note: This assumes complaints are tracked in a system
      // For now, we'll use a placeholder query
      
      // In production, query complaint tracking system
      // For this implementation, we'll skip to avoid false alerts
      // Uncomment when complaint tracking is available:
      
      /*
      const todayComplaints = await this.getComplaintCount(location.id, today, new Date())
      const yesterdayComplaints = await this.getComplaintCount(location.id, yesterday, today)
      const twoDaysAgoComplaints = await this.getComplaintCount(location.id, twoDaysAgo, yesterday)

      // Detect acceleration: today > yesterday > 2 days ago
      const isAccelerating = todayComplaints > yesterdayComplaints && yesterdayComplaints > twoDaysAgoComplaints

      // CRITICAL: >10 complaints/day OR accelerating
      if (todayComplaints > 10 || (isAccelerating && todayComplaints > 5)) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'SERVICE_QUALITY' as any,
          source: `complaints_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL complaint surge at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          customerImpact: 'Reputation damage imminent. Social media risk. Revenue impact likely.',
          why: isAccelerating 
            ? `Complaints accelerating: ${twoDaysAgoComplaints} → ${yesterdayComplaints} → ${todayComplaints} (last 3 days)`
            : `${todayComplaints} complaints today (threshold: 10)`,
          evidence: [
            `Today: ${todayComplaints} complaints`,
            `Yesterday: ${yesterdayComplaints} complaints`,
            `2 days ago: ${twoDaysAgoComplaints} complaints`,
            `Trend: ${isAccelerating ? 'ACCELERATING' : 'HIGH VOLUME'}`,
          ],
          recommendedAction: `URGENT QUALITY INTERVENTION:
1. Review all complaints immediately
2. Identify common patterns (food quality, service, cleanliness)
3. Implement immediate corrective actions
4. Activate service recovery for affected customers
5. Monitor social media for escalation

Available actions:
- Review complaint details
- Conduct root cause analysis
- Implement quality improvements
- Activate customer recovery protocol
- Monitor review sites`,
          threshold: 10,
          currentValue: todayComplaints,
          cooldownMinutes: 360, // 6 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            todayComplaints,
            yesterdayComplaints,
            twoDaysAgoComplaints,
            isAccelerating,
          },
        })
      }
      // WARN: 5-10 complaints/day
      else if (todayComplaints >= 5) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'SERVICE_QUALITY' as any,
          source: `complaints_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Elevated complaints at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          customerImpact: 'Customer satisfaction declining. Reputation at risk.',
          why: `${todayComplaints} complaints today (threshold: 5)`,
          evidence: [
            `Today: ${todayComplaints} complaints`,
            `Yesterday: ${yesterdayComplaints} complaints`,
            `2 days ago: ${twoDaysAgoComplaints} complaints`,
          ],
          recommendedAction: `ACTION REQUIRED TODAY:
1. Review complaint patterns
2. Identify any systemic issues
3. Address root causes
4. Monitor for escalation

Available actions:
- Review complaint log
- Identify common themes
- Implement improvements`,
          threshold: 5,
          currentValue: todayComplaints,
          cooldownMinutes: 720, // 12 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            todayComplaints,
            yesterdayComplaints,
            twoDaysAgoComplaints,
          },
        })
      }
      */
    }

    return alerts
  }

  /**
   * Check 3: Unresolved Issue Backlog
   * 
   * Detects: Growing backlog of unresolved customer issues
   * Urgency: THIS_WEEK (chronic issue)
   * 
   * Thresholds:
   * - CRITICAL: >20 unresolved issues OR avg resolution time >48 hours
   * - WARN: 10-20 unresolved issues OR avg resolution time >24 hours
   */
  private static async checkUnresolvedIssues(): Promise<ServiceQualityAlert[]> {
    const alerts: ServiceQualityAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    for (const location of locations) {
      // In production, query issue tracking system
      // For now, skip to avoid false alerts
      
      /*
      const unresolvedIssues = await this.getUnresolvedIssueCount(location.id)
      const avgResolutionTime = await this.getAvgResolutionTime(location.id) // in hours

      // CRITICAL: >20 unresolved OR >48 hour resolution time
      if (unresolvedIssues > 20 || avgResolutionTime > 48) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'SERVICE_QUALITY' as any,
          source: `unresolved_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL issue backlog at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          customerImpact: 'Customer frustration high. Reputation damage. Churn risk.',
          why: `${unresolvedIssues} unresolved issues. Average resolution time: ${avgResolutionTime.toFixed(1)} hours (target: <24 hours)`,
          evidence: [
            `Unresolved issues: ${unresolvedIssues}`,
            `Average resolution time: ${avgResolutionTime.toFixed(1)} hours`,
            `Target resolution time: 24 hours`,
          ],
          recommendedAction: `URGENT BACKLOG CLEARANCE:
1. Prioritize oldest unresolved issues
2. Assign dedicated staff to clear backlog
3. Improve issue tracking and escalation process
4. Set resolution time targets
5. Monitor resolution rate daily

Available actions:
- Review unresolved issue queue
- Assign resolution owners
- Implement escalation protocol
- Track resolution metrics`,
          threshold: 20,
          currentValue: unresolvedIssues,
          cooldownMinutes: 1440, // 24 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            unresolvedIssues,
            avgResolutionTime,
          },
        })
      }
      */
    }

    return alerts
  }

  /**
   * Helper: Get complaint count for a location in a date range
   */
  private static async getComplaintCount(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Placeholder: In production, query complaint tracking system
    return 0
  }

  /**
   * Helper: Get unresolved issue count for a location
   */
  private static async getUnresolvedIssueCount(locationId: string): Promise<number> {
    // Placeholder: In production, query issue tracking system
    return 0
  }

  /**
   * Helper: Get average resolution time for a location
   */
  private static async getAvgResolutionTime(locationId: string): Promise<number> {
    // Placeholder: In production, query issue tracking system
    return 0
  }
}
