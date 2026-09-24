/**
 * Staffing Watchdog
 * Phase: 1.2E-B Foundation (Operational Intelligence Core)
 * 
 * Purpose: Detect staffing risks before operational degradation
 * 
 * Monitors:
 * - Shift coverage
 * - Absenteeism
 * - Overtime pressure
 * - Staffing shortages
 * - Critical role gaps
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

export interface StaffingAlert extends WatchdogAlert {
  locationId?: string
  locationName?: string
  operationalImpact: string
  evidence: string[]
  why: string
}

export interface ShiftCoverageData {
  locationId: string
  locationName: string
  scheduledShifts: number
  filledShifts: number
  openShifts: number
  coverageRate: number
}

export interface AbsenteeismData {
  locationId: string
  locationName: string
  scheduledStaff: number
  absentStaff: number
  absenteeismRate: number
  lastMinuteCallouts: number
}

export class StaffingWatchdogService {
  /**
   * Run Staffing Watchdog checks
   */
  static async run(): Promise<WatchdogResult> {
    const startTime = Date.now()
    const alerts: StaffingAlert[] = []
    const errors: string[] = []

    try {
      // Check 1: Shift coverage gaps (real-time)
      const coverageAlerts = await this.checkShiftCoverage()
      alerts.push(...coverageAlerts)

      // Check 2: Absenteeism patterns (daily)
      const absenteeismAlerts = await this.checkAbsenteeism()
      alerts.push(...absenteeismAlerts)

      // Check 3: Overtime pressure (weekly)
      const overtimeAlerts = await this.checkOvertimePressure()
      alerts.push(...overtimeAlerts)

      // Deliver alerts (with cooldown and suppression)
      for (const alert of alerts) {
        // Check suppression first
        const suppression = await SuppressionService.shouldSuppress(
          alert.watchdog,
          alert.severity,
          alert.source
        )

        if (suppression.suppressed) {
          console.log(`[StaffingWatchdog] Alert suppressed: ${alert.source} - ${suppression.reason}`)
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
      console.error('[StaffingWatchdog] Execution error:', error)
    }

    return {
      watchdog: 'STAFFING' as any,
      executedAt: new Date(),
      duration: Date.now() - startTime,
      alertsGenerated: alerts.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Check 1: Shift Coverage Gaps
   * 
   * Detects: Unfilled shifts that will impact service delivery
   * Urgency: IMMEDIATE (service impact within hours)
   * 
   * Thresholds:
   * - CRITICAL: <80% coverage OR >3 open shifts
   * - WARN: 80-90% coverage OR 1-2 open shifts
   * - INFO: >90% coverage
   */
  private static async checkShiftCoverage(): Promise<StaffingAlert[]> {
    const alerts: StaffingAlert[] = []
    
    // Note: In real implementation, this would query a scheduling system
    // For now, we'll create a placeholder that demonstrates the pattern
    
    // Get locations (branches)
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    // For each location, check shift coverage
    // This is a simplified example - real implementation would query scheduling data
    for (const location of locations) {
      // Placeholder: In production, query actual scheduling system
      const coverageData = await this.getShiftCoverageData(location.id)
      
      if (!coverageData) continue

      const { scheduledShifts, filledShifts, openShifts, coverageRate } = coverageData

      // CRITICAL: <80% coverage OR >3 open shifts
      if (coverageRate < 80 || openShifts > 3) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'STAFFING' as any,
          source: `shift_coverage_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL staffing shortage at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Service quality will degrade immediately. Customer wait times will increase. Staff burnout risk.',
          why: `Shift coverage at ${coverageRate.toFixed(1)}% (target: >90%). ${openShifts} shifts unfilled.`,
          evidence: [
            `Scheduled shifts: ${scheduledShifts}`,
            `Filled shifts: ${filledShifts}`,
            `Open shifts: ${openShifts}`,
            `Coverage rate: ${coverageRate.toFixed(1)}%`,
          ],
          recommendedAction: `IMMEDIATE ACTION REQUIRED:
1. Call emergency backup staff from nearby locations
2. Approve overtime for current staff
3. Reduce service scope if necessary (close sections, limit menu)
4. Communicate delays to customers proactively

Available actions:
- Contact backup staff pool
- Approve manager overtime authorization
- Activate service reduction protocol`,
          threshold: 80,
          currentValue: coverageRate,
          cooldownMinutes: 360, // 6 hours (don't spam during same shift)
          details: {
            locationId: location.id,
            locationName: location.name,
            scheduledShifts,
            filledShifts,
            openShifts,
            coverageRate,
          },
        })
      }
      // WARN: 80-90% coverage OR 1-2 open shifts
      else if (coverageRate < 90 || openShifts > 0) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'STAFFING' as any,
          source: `shift_coverage_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Staffing shortage at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Service quality at risk. Staff will be stretched. Potential for delays.',
          why: `Shift coverage at ${coverageRate.toFixed(1)}% (target: >90%). ${openShifts} shifts unfilled.`,
          evidence: [
            `Scheduled shifts: ${scheduledShifts}`,
            `Filled shifts: ${filledShifts}`,
            `Open shifts: ${openShifts}`,
            `Coverage rate: ${coverageRate.toFixed(1)}%`,
          ],
          recommendedAction: `ACTION REQUIRED TODAY:
1. Post open shifts to staff pool
2. Offer shift incentives (bonus pay, preferred shifts)
3. Prepare backup plan if shifts remain unfilled
4. Monitor service quality closely

Available actions:
- Post to staff availability board
- Activate shift incentive program
- Prepare service contingency plan`,
          threshold: 90,
          currentValue: coverageRate,
          cooldownMinutes: 720, // 12 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            scheduledShifts,
            filledShifts,
            openShifts,
            coverageRate,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Check 2: Absenteeism Patterns
   * 
   * Detects: High absenteeism indicating staffing instability
   * Urgency: SAME_DAY (impacts today's operations)
   * 
   * Thresholds:
   * - CRITICAL: >20% absenteeism OR >3 last-minute callouts
   * - WARN: 10-20% absenteeism OR 1-2 last-minute callouts
   */
  private static async checkAbsenteeism(): Promise<StaffingAlert[]> {
    const alerts: StaffingAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    // Check absenteeism for each location (last 7 days)
    for (const location of locations) {
      const absenteeismData = await this.getAbsenteeismData(location.id)
      
      if (!absenteeismData) continue

      const { scheduledStaff, absentStaff, absenteeismRate, lastMinuteCallouts } = absenteeismData

      // CRITICAL: >20% absenteeism OR >3 last-minute callouts
      if (absenteeismRate > 20 || lastMinuteCallouts > 3) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'STAFFING' as any,
          source: `absenteeism_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL absenteeism at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Chronic staffing instability. Service quality degrading. Staff burnout accelerating.',
          why: `Absenteeism at ${absenteeismRate.toFixed(1)}% (target: <10%). ${lastMinuteCallouts} last-minute callouts in 7 days.`,
          evidence: [
            `Scheduled staff (7 days): ${scheduledStaff}`,
            `Absent staff: ${absentStaff}`,
            `Absenteeism rate: ${absenteeismRate.toFixed(1)}%`,
            `Last-minute callouts: ${lastMinuteCallouts}`,
          ],
          recommendedAction: `URGENT INTERVENTION REQUIRED:
1. Investigate root cause (illness outbreak, morale issues, scheduling problems)
2. Meet with location manager to address staffing stability
3. Review attendance policies and enforcement
4. Consider temporary staff augmentation
5. Implement attendance improvement plan

Available actions:
- Schedule manager meeting
- Review attendance records
- Activate temporary staffing agency
- Implement attendance monitoring`,
          threshold: 20,
          currentValue: absenteeismRate,
          cooldownMinutes: 1440, // 24 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            scheduledStaff,
            absentStaff,
            absenteeismRate,
            lastMinuteCallouts,
          },
        })
      }
      // WARN: 10-20% absenteeism OR 1-2 last-minute callouts
      else if (absenteeismRate > 10 || lastMinuteCallouts > 0) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'STAFFING' as any,
          source: `absenteeism_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Elevated absenteeism at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Staffing reliability at risk. May impact service consistency.',
          why: `Absenteeism at ${absenteeismRate.toFixed(1)}% (target: <10%). ${lastMinuteCallouts} last-minute callouts in 7 days.`,
          evidence: [
            `Scheduled staff (7 days): ${scheduledStaff}`,
            `Absent staff: ${absentStaff}`,
            `Absenteeism rate: ${absenteeismRate.toFixed(1)}%`,
            `Last-minute callouts: ${lastMinuteCallouts}`,
          ],
          recommendedAction: `ACTION REQUIRED THIS WEEK:
1. Review attendance patterns with location manager
2. Identify any systemic issues (scheduling, morale, health)
3. Communicate attendance expectations
4. Monitor for improvement

Available actions:
- Schedule manager check-in
- Review attendance trends
- Communicate attendance policy`,
          threshold: 10,
          currentValue: absenteeismRate,
          cooldownMinutes: 2880, // 48 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            scheduledStaff,
            absentStaff,
            absenteeismRate,
            lastMinuteCallouts,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Check 3: Overtime Pressure
   * 
   * Detects: Excessive overtime indicating understaffing
   * Urgency: THIS_WEEK (indicates chronic issue)
   * 
   * Thresholds:
   * - CRITICAL: >30% of staff hours are overtime
   * - WARN: 20-30% overtime
   */
  private static async checkOvertimePressure(): Promise<StaffingAlert[]> {
    const alerts: StaffingAlert[] = []
    
    // Get locations
    const locations = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    })

    // Check overtime for each location (last 7 days)
    for (const location of locations) {
      const overtimeData = await this.getOvertimeData(location.id)
      
      if (!overtimeData) continue

      const { totalHours, overtimeHours, overtimeRate, staffCount } = overtimeData

      // CRITICAL: >30% overtime
      if (overtimeRate > 30) {
        alerts.push({
          severity: 'CRITICAL',
          watchdog: 'STAFFING' as any,
          source: `overtime_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `CRITICAL overtime pressure at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Staff burnout imminent. Service quality will degrade. Turnover risk high.',
          why: `Overtime at ${overtimeRate.toFixed(1)}% of total hours (target: <20%). Staff working unsustainable hours.`,
          evidence: [
            `Total hours (7 days): ${totalHours.toFixed(0)}`,
            `Overtime hours: ${overtimeHours.toFixed(0)}`,
            `Overtime rate: ${overtimeRate.toFixed(1)}%`,
            `Staff count: ${staffCount}`,
            `Avg overtime per staff: ${(overtimeHours / staffCount).toFixed(1)} hours/week`,
          ],
          recommendedAction: `URGENT STAFFING ACTION REQUIRED:
1. Hire additional staff immediately
2. Reduce service hours or scope temporarily
3. Redistribute workload across locations
4. Review scheduling efficiency
5. Monitor staff morale and burnout signals

Available actions:
- Activate emergency hiring
- Implement service reduction plan
- Request staff transfer from other locations
- Review and optimize schedules`,
          threshold: 30,
          currentValue: overtimeRate,
          cooldownMinutes: 2880, // 48 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            totalHours,
            overtimeHours,
            overtimeRate,
            staffCount,
          },
        })
      }
      // WARN: 20-30% overtime
      else if (overtimeRate > 20) {
        alerts.push({
          severity: 'WARN',
          watchdog: 'STAFFING' as any,
          source: `overtime_${location.id}`,
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development',
          summary: `Elevated overtime at ${location.name}`,
          locationId: location.id,
          locationName: location.name,
          operationalImpact: 'Staff fatigue risk. Service quality may decline if sustained.',
          why: `Overtime at ${overtimeRate.toFixed(1)}% of total hours (target: <20%).`,
          evidence: [
            `Total hours (7 days): ${totalHours.toFixed(0)}`,
            `Overtime hours: ${overtimeHours.toFixed(0)}`,
            `Overtime rate: ${overtimeRate.toFixed(1)}%`,
            `Staff count: ${staffCount}`,
            `Avg overtime per staff: ${(overtimeHours / staffCount).toFixed(1)} hours/week`,
          ],
          recommendedAction: `ACTION REQUIRED THIS WEEK:
1. Review staffing levels with location manager
2. Assess if additional hiring needed
3. Optimize scheduling to reduce overtime
4. Monitor for burnout signals

Available actions:
- Schedule staffing review meeting
- Post job openings if needed
- Optimize shift schedules`,
          threshold: 20,
          currentValue: overtimeRate,
          cooldownMinutes: 4320, // 72 hours
          details: {
            locationId: location.id,
            locationName: location.name,
            totalHours,
            overtimeHours,
            overtimeRate,
            staffCount,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Helper: Get shift coverage data for a location
   * 
   * Note: This is a placeholder. In production, this would query:
   * - Scheduling system (shifts scheduled vs. filled)
   * - Time tracking system (actual attendance)
   * - Staff availability system
   */
  private static async getShiftCoverageData(locationId: string): Promise<ShiftCoverageData | null> {
    // Placeholder implementation
    // In production, query actual scheduling system
    
    // For now, return null to indicate no data available
    // This prevents false alerts during development
    return null
  }

  /**
   * Helper: Get absenteeism data for a location
   * 
   * Note: This is a placeholder. In production, this would query:
   * - Time tracking system (scheduled vs. actual attendance)
   * - Absence management system
   * - Last-minute callout tracking
   */
  private static async getAbsenteeismData(locationId: string): Promise<AbsenteeismData | null> {
    // Placeholder implementation
    return null
  }

  /**
   * Helper: Get overtime data for a location
   * 
   * Note: This is a placeholder. In production, this would query:
   * - Time tracking system (regular hours vs. overtime hours)
   * - Payroll system
   * - Staff count
   */
  private static async getOvertimeData(locationId: string): Promise<{
    totalHours: number
    overtimeHours: number
    overtimeRate: number
    staffCount: number
  } | null> {
    // Placeholder implementation
    return null
  }
}
