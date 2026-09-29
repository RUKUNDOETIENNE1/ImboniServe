/**
 * Incident Watchdog
 * Phase: 1.2E-B Foundation (Operational Intelligence Core)
 * 
 * Purpose: Create operational visibility into recurring failures
 * 
 * Monitors:
 * - Incident frequency
 * - Incident recurrence
 * - Unresolved incidents
 * - Operational disruptions
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
import { startOfDay, subDays } from 'date-fns'

export interface IncidentAlert extends WatchdogAlert {
  locationId?: string
  locationName?: string
  operationalRisk: string
  evidence: string[]
  why: string
}

export interface IncidentData {
  locationId: string
  locationName: string
  incidentCount: number
  criticalIncidents: number
  recurringPatterns: Array<{
    type: string
    count: number
  }>
}

export class IncidentWatchdogService {
  /**
   * Run Incident Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: IncidentAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Incident frequency (daily)
      const frequencyAlerts = await this.checkIncidentFrequency()
      alerts.push(...frequencyAlerts)

      // Check 2: Recurring incident patterns (weekly)
      const recurrenceAlerts = await this.checkRecurringPatterns()
      alerts.push(...recurrenceAlerts)

      // Check 3: Critical incident detection (immediate)
      const criticalAlerts = await this.checkCriticalIncidents()
      alerts.push(...criticalAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[IncidentWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
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
      console.error('[IncidentWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'INCIDENT' as any,
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check 1: Incident Frequency
   * 
   * Detects: High incident volume indicating operational instability
   * Urgency: SAME_DAY (pattern emerging)
   * 
   * Thresholds:
   * - CRITICAL: >5 incidents/day
   * - WARN: 2-5 incidents/day
   * 
   * Note: "Incident" is defined as:
   * - Customer complaints (logged)
   * - Service failures (documented)
   * - Equipment failures
   * - Safety issues
   * - Quality violations
   */
  private static async checkIncidentFrequency(): Promise<IncidentAlert[]> {
    const alerts: IncidentAlert[] = []
    
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

    for (const location of locations) {
      // In production, query incident tracking system
      // For now, we'll use a placeholder to demonstrate the pattern
      
      // Placeholder: Get incident count for today
      const incidentData = await this.getIncidentData(location.id, today, new Date())
      
      if (!incidentData) continue

      const { incidentCount, criticalIncidents } = incidentData

      // CRITICAL: >5 incidents/day OR any critical incident
      if (incidentCount > 5 || criticalIncidents > 0) {
        const isCriticalIncident = criticalIncidents > 0
        
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'INCIDENT' as any,
          source: `incident_frequency_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: isCriticalIncident 
            ? `CRITICAL incident at ${location.name}`
            : `High incident volume at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalRisk: isCriticalIncident
            ? 'Safety, legal, or severe brand risk. Immediate escalation required.'
            : 'Operational instability. Service quality degrading. Customer satisfaction at risk.',
          why: isCriticalIncident
            ? `${criticalIncidents} CRITICAL incident(s) detected (safety, legal, or severe quality issue)`
            : `${incidentCount} incidents today (threshold: 5). Operational instability detected.`,
          evidence: [
            `Total incidents today: ${incidentCount}`,
            `Critical incidents: ${criticalIncidents}`,
            `Threshold: 5 incidents/day`,
          ],
          recommendedAction: isCriticalIncident
            ? `IMMEDIATE ESCALATION REQUIRED:
1. Review critical incident details immediately
2. Assess safety, legal, or brand risk
3. Implement immediate corrective actions
4. Escalate to CEO/legal if necessary
5. Document incident thoroughly
6. Activate crisis management protocol if needed

Available actions:
- Review incident report
- Activate safety protocol
- Contact legal counsel
- Implement corrective actions
- Escalate to executive team`
            : `URGENT OPERATIONAL REVIEW:
1. Review all incidents from today
2. Identify common patterns or root causes
3. Implement immediate corrective actions
4. Assign incident resolution owners
5. Monitor for recurrence

Available actions:
- Review incident log
- Conduct root cause analysis
- Implement quality improvements
- Assign resolution owners`,
          threshold: isCriticalIncident ? 0 : 5,
          currentValue: isCriticalIncident ? criticalIncidents : incidentCount,
          cooldownMinutes: isCriticalIncident ? 60 : 360, // 1 hour for critical, 6 hours for high volume
          details: {
            locationId: location.id,
            locationName: location.name,
            incidentCount,
            criticalIncidents,
          },
        })
      }
      // WARN: 2-5 incidents/day
      else if (incidentCount >= 2) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'INCIDENT' as any,
          source: `incident_frequency_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Elevated incidents at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalRisk: 'Service quality at risk. Pattern may indicate systemic issue.',
          why: `${incidentCount} incidents today (threshold: 2)`,
          evidence: [
            `Total incidents today: ${incidentCount}`,
            `Critical incidents: ${criticalIncidents}`,
          ],
          recommendedAction: `ACTION REQUIRED TODAY:
1. Review incident details
2. Check for common patterns
3. Address any immediate issues
4. Monitor for escalation

Available actions:
- Review incident log
- Identify patterns
- Implement improvements`,
          threshold: 2,
          currentValue: incidentCount,
          cooldownMinutes: 720, // 12 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            incidentCount,
            criticalIncidents,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Check 2: Recurring Incident Patterns
   * 
   * Detects: Same incident type repeating, indicating systemic issue
   * Urgency: THIS_WEEK (systemic problem)
   * 
   * Thresholds:
   * - CRITICAL: Same incident type >3x in 7 days
   * - WARN: Same incident type >2x in 7 days
   */
  private static async checkRecurringPatterns(): Promise<IncidentAlert[]> {
    const alerts: IncidentAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    const sevenDaysAgo = subDays(new Date(), 7)

    for (const location of locations) {
      // In production, query incident tracking system for patterns
      const incidentData = await this.getIncidentData(location.id, sevenDaysAgo, new Date())
      
      if (!incidentData || !incidentData.recurringPatterns) continue

      // Check for recurring patterns
      for (const pattern of incidentData.recurringPatterns) {
        // CRITICAL: >3 occurrences in 7 days
        if (pattern.count > 3) {
          alerts.push({
            severity: 'CRITICAL',
            watchdog: 'INCIDENT' as any,
            source: `recurring_${pattern.type}_${location.id}`,
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            summary: `CRITICAL recurring incident at ${location.name}`,
            locationId: location.id,
            locationName: location.name,
            operationalRisk: 'Systemic operational failure. Root cause not addressed. Will continue to recur.',
            why: `"${pattern.type}" incident occurred ${pattern.count} times in 7 days. This is a systemic issue, not isolated incidents.`,
            evidence: [
              `Incident type: ${pattern.type}`,
              `Occurrences (7 days): ${pattern.count}`,
              `Threshold: 3 occurrences`,
              `Pattern: RECURRING`,
            ],
            recommendedAction: `URGENT ROOT CAUSE ELIMINATION:
1. Conduct thorough root cause analysis
2. Identify why this incident keeps recurring
3. Implement permanent corrective action (not temporary fix)
4. Document process changes
5. Monitor for recurrence after fix
6. Update procedures to prevent future occurrences

Available actions:
- Schedule root cause analysis session
- Review all ${pattern.count} incident reports
- Implement systemic fix
- Update standard operating procedures
- Train staff on new procedures`,
            threshold: 3,
            currentValue: pattern.count,
            cooldownMinutes: 2880, // 48 hours
            details: {
              locationId: location.id,
              locationName: location.name,
              incidentType: pattern.type,
              occurrences: pattern.count,
              timeframe: '7 days',
            },
          })
        }
        // WARN: >2 occurrences in 7 days
        else if (pattern.count > 2) {
          alerts.push({
            severity: 'WARN',
            watchdog: 'INCIDENT' as any,
            source: `recurring_${pattern.type}_${location.id}`,
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            summary: `Recurring incident pattern at ${location.name}`,
            locationId: location.id,
            locationName: location.name,
            operationalRisk: 'Potential systemic issue. May indicate process or training gap.',
            why: `"${pattern.type}" incident occurred ${pattern.count} times in 7 days. Pattern emerging.`,
            evidence: [
              `Incident type: ${pattern.type}`,
              `Occurrences (7 days): ${pattern.count}`,
              `Threshold: 2 occurrences`,
            ],
            recommendedAction: `ACTION REQUIRED THIS WEEK:
1. Review incident reports for common factors
2. Identify potential root cause
3. Implement corrective action
4. Monitor for recurrence

Available actions:
- Review incident details
- Identify common factors
- Implement improvements`,
            threshold: 2,
            currentValue: pattern.count,
            cooldownMinutes: 4320, // 72 hours
            details: {
              locationId: location.id,
              locationName: location.name,
              incidentType: pattern.type,
              occurrences: pattern.count,
              timeframe: '7 days',
            },
          })
        }
      }
    }

    return alerts
  }

  /**
   * Check 3: Critical Incident Detection
   * 
   * Detects: Safety, legal, or severe quality incidents
   * Urgency: IMMEDIATE (escalation required)
   * 
   * Critical incident types:
   * - Safety incidents (injury, hazard)
   * - Health violations
   * - Legal issues
   * - Severe customer harm
   * - Brand crisis
   */
  private static async checkCriticalIncidents(): Promise<IncidentAlert[]> {
    const alerts: IncidentAlert[] = []
    
    // This check is already covered in checkIncidentFrequency
    // when criticalIncidents > 0
    // Keeping this method for clarity and future expansion
    
    return alerts
  }

  /**
   * Helper: Get incident data for a location in a date range
   * 
   * Note: This is a placeholder. In production, this would query:
   * - Incident tracking system
   * - Complaint management system
   * - Safety reporting system
   * - Quality violation logs
   */
  private static async getIncidentData(
    locationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncidentData | null> {
    // Placeholder implementation
    // In production, query actual incident tracking system
    
    // For now, return null to prevent false alerts
    return null
    
    // Example of what production implementation would return:
    /*
    return {
      locationId,
      locationName: 'Location Name',
      incidentCount: 3,
      criticalIncidents: 0,
      recurringPatterns: [
        { type: 'Service Delay', count: 2 },
        { type: 'Food Quality', count: 1 },
      ],
    }
    */
  }
}
