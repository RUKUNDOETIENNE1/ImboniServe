/**
 * Adoption Analytics Tracker
 * Measures real-world human behavior and system adoption
 * Phase 5: Live Pilot Validation
 */

export interface AdoptionMetrics {
  // Trust signals
  totalUpdates: number
  stationOriginatedUpdates: number
  crossStationUpdates: number
  managerOverrides: number
  offSystemActions: number
  trustScore: number // 0-100

  // Compliance signals
  totalItems: number
  canonicalPathCompletions: number
  invalidTransitions: number
  corrections: number
  complianceScore: number // 0-100

  // Confusion signals
  hesitationEvents: number
  wrongStationAttempts: number
  abandonedActions: number
  confusionScore: number // 0-100, lower is better

  // Workflow metrics
  averageTimeToFirstAction: number
  averageActionsPerItem: number
  completionRate: number

  // Overall adoption
  adoptionReadinessScore: number // 0-100
}

export interface DivergenceEvent {
  type: 'ignored_routing' | 'skipped_state' | 'off_system' | 'cross_station'
  timestamp: Date
  itemId: string
  orderId: string
  expectedStation?: string
  actualStation?: string
  expectedState?: string
  actualState?: string
  actorId?: string
  severity: 'low' | 'medium' | 'high'
}

export interface WorkflowDrift {
  name: string
  description: string
  frequency: number
  impact: 'low' | 'medium' | 'high'
  examples: string[]
  suggestedMitigation?: string
}

export class AdoptionTracker {
  private static instance: AdoptionTracker
  private metrics: AdoptionMetrics = {
    totalUpdates: 0,
    stationOriginatedUpdates: 0,
    crossStationUpdates: 0,
    managerOverrides: 0,
    offSystemActions: 0,
    trustScore: 0,
    totalItems: 0,
    canonicalPathCompletions: 0,
    invalidTransitions: 0,
    corrections: 0,
    complianceScore: 0,
    hesitationEvents: 0,
    wrongStationAttempts: 0,
    abandonedActions: 0,
    confusionScore: 0,
    averageTimeToFirstAction: 0,
    averageActionsPerItem: 0,
    completionRate: 0,
    adoptionReadinessScore: 0,
  }

  private divergenceEvents: DivergenceEvent[] = []
  private workflowDrifts: Map<string, WorkflowDrift> = new Map()

  static getInstance(): AdoptionTracker {
    if (!AdoptionTracker.instance) {
      AdoptionTracker.instance = new AdoptionTracker()
    }
    return AdoptionTracker.instance
  }

  /**
   * Track item update and determine if it's station-originated
   */
  trackItemUpdate(
    itemId: string,
    orderId: string,
    expectedStationId: string | null,
    actualStationId: string | null,
    actorRole: string
  ): void {
    this.metrics.totalUpdates++

    // Check if update came from correct station
    if (expectedStationId && actualStationId === expectedStationId) {
      this.metrics.stationOriginatedUpdates++
    } else if (expectedStationId && actualStationId !== expectedStationId) {
      this.metrics.crossStationUpdates++

      // Log divergence
      this.logDivergence({
        type: 'cross_station',
        timestamp: new Date(),
        itemId,
        orderId,
        expectedStation: expectedStationId,
        actualStation: actualStationId || 'unknown',
        severity: 'medium',
      })
    }

    // Track manager overrides
    if (actorRole === 'ADMIN' || actorRole === 'MANAGER') {
      this.metrics.managerOverrides++
    }

    this.calculateTrustScore()
  }

  /**
   * Track state transition and validate canonical path
   */
  trackStateTransition(
    itemId: string,
    orderId: string,
    fromState: string | null,
    toState: string,
    isValid: boolean,
    isCanonicalPath: boolean
  ): void {
    this.metrics.totalItems++

    if (isCanonicalPath) {
      this.metrics.canonicalPathCompletions++
    }

    if (!isValid) {
      this.metrics.invalidTransitions++

      this.logDivergence({
        type: 'skipped_state',
        timestamp: new Date(),
        itemId,
        orderId,
        expectedState: this.getExpectedNextState(fromState),
        actualState: toState,
        severity: 'high',
      })
    }

    this.calculateComplianceScore()
  }

  /**
   * Track off-system action (order served without item updates)
   */
  trackOffSystemAction(orderId: string, itemIds: string[]): void {
    this.metrics.offSystemActions++

    itemIds.forEach((itemId) => {
      this.logDivergence({
        type: 'off_system',
        timestamp: new Date(),
        itemId,
        orderId,
        severity: 'high',
      })
    })

    this.calculateTrustScore()
  }

  /**
   * Track confusion signals
   */
  trackHesitation(duration: number): void {
    if (duration > 3000) {
      this.metrics.hesitationEvents++
      this.calculateConfusionScore()
    }
  }

  trackWrongStationAttempt(attemptedStationId: string, correctStationId: string): void {
    this.metrics.wrongStationAttempts++
    this.calculateConfusionScore()
  }

  trackAbandonedAction(): void {
    this.metrics.abandonedActions++
    this.calculateConfusionScore()
  }

  /**
   * Track workflow drift pattern
   */
  trackWorkflowDrift(
    name: string,
    description: string,
    impact: 'low' | 'medium' | 'high',
    example: string
  ): void {
    const existing = this.workflowDrifts.get(name)

    if (existing) {
      existing.frequency++
      existing.examples.push(example)
    } else {
      this.workflowDrifts.set(name, {
        name,
        description,
        frequency: 1,
        impact,
        examples: [example],
      })
    }
  }

  /**
   * Calculate trust score
   */
  private calculateTrustScore(): void {
    if (this.metrics.totalUpdates === 0) {
      this.metrics.trustScore = 0
      return
    }

    const baseScore =
      (this.metrics.stationOriginatedUpdates / this.metrics.totalUpdates) * 100

    const overridePenalty = this.metrics.managerOverrides * 5
    const offSystemPenalty = this.metrics.offSystemActions * 10

    this.metrics.trustScore = Math.max(
      0,
      Math.min(100, baseScore - overridePenalty - offSystemPenalty)
    )

    this.calculateAdoptionScore()
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(): void {
    if (this.metrics.totalItems === 0) {
      this.metrics.complianceScore = 0
      return
    }

    const baseScore =
      (this.metrics.canonicalPathCompletions / this.metrics.totalItems) * 100

    const invalidPenalty = this.metrics.invalidTransitions * 3
    const correctionPenalty = this.metrics.corrections * 2

    this.metrics.complianceScore = Math.max(
      0,
      Math.min(100, baseScore - invalidPenalty - correctionPenalty)
    )

    this.calculateAdoptionScore()
  }

  /**
   * Calculate confusion score (lower is better)
   */
  private calculateConfusionScore(): void {
    this.metrics.confusionScore =
      this.metrics.hesitationEvents * 2 +
      this.metrics.wrongStationAttempts * 5 +
      this.metrics.abandonedActions * 3

    this.calculateAdoptionScore()
  }

  /**
   * Calculate overall adoption readiness score
   */
  private calculateAdoptionScore(): void {
    const trustWeight = 0.4
    const complianceWeight = 0.25
    const confusionWeight = 0.15
    const completionWeight = 0.2

    const confusionInverted = Math.max(0, 100 - this.metrics.confusionScore)

    this.metrics.adoptionReadinessScore =
      this.metrics.trustScore * trustWeight +
      this.metrics.complianceScore * complianceWeight +
      confusionInverted * confusionWeight +
      this.metrics.completionRate * completionWeight
  }

  /**
   * Log divergence event
   */
  private logDivergence(event: DivergenceEvent): void {
    this.divergenceEvents.push(event)

    // Keep only last 1000 events
    if (this.divergenceEvents.length > 1000) {
      this.divergenceEvents.shift()
    }
  }

  /**
   * Get expected next state in canonical path
   */
  private getExpectedNextState(currentState: string | null): string {
    const canonicalPath: Record<string, string> = {
      NEW: 'PREPARING',
      PREPARING: 'READY',
      READY: 'DELIVERED',
    }

    return canonicalPath[currentState || 'NEW'] || 'PREPARING'
  }

  /**
   * Get current metrics
   */
  getMetrics(): AdoptionMetrics {
    return { ...this.metrics }
  }

  /**
   * Get divergence events
   */
  getDivergenceEvents(limit: number = 100): DivergenceEvent[] {
    return this.divergenceEvents.slice(-limit)
  }

  /**
   * Get top workflow drifts
   */
  getTopDrifts(limit: number = 5): WorkflowDrift[] {
    return Array.from(this.workflowDrifts.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
  }

  /**
   * Generate adoption report
   */
  generateReport(): string {
    const trustVerdict = this.metrics.trustScore >= 80 ? '✅ HIGH' : this.metrics.trustScore >= 65 ? '⚠️ MODERATE' : '❌ LOW'
    const complianceVerdict = this.metrics.complianceScore >= 80 ? '✅ HIGH' : this.metrics.complianceScore >= 65 ? '⚠️ MODERATE' : '❌ LOW'
    const confusionVerdict = this.metrics.confusionScore <= 20 ? '✅ LOW' : this.metrics.confusionScore <= 40 ? '⚠️ MODERATE' : '❌ HIGH'
    const adoptionVerdict = this.metrics.adoptionReadinessScore >= 80 ? '✅ READY TO SCALE' : this.metrics.adoptionReadinessScore >= 65 ? '⚠️ ITERATE & RE-MEASURE' : '❌ HOLD SCALE'

    return `
=== ADOPTION VALIDATION REPORT ===

TRUST SIGNALS:
- Total Updates: ${this.metrics.totalUpdates}
- Station-Originated: ${this.metrics.stationOriginatedUpdates} (${((this.metrics.stationOriginatedUpdates / this.metrics.totalUpdates) * 100).toFixed(1)}%)
- Cross-Station: ${this.metrics.crossStationUpdates}
- Manager Overrides: ${this.metrics.managerOverrides}
- Off-System Actions: ${this.metrics.offSystemActions}
- Trust Score: ${this.metrics.trustScore.toFixed(1)}/100 ${trustVerdict}

COMPLIANCE SIGNALS:
- Total Items: ${this.metrics.totalItems}
- Canonical Path: ${this.metrics.canonicalPathCompletions} (${((this.metrics.canonicalPathCompletions / this.metrics.totalItems) * 100).toFixed(1)}%)
- Invalid Transitions: ${this.metrics.invalidTransitions}
- Corrections: ${this.metrics.corrections}
- Compliance Score: ${this.metrics.complianceScore.toFixed(1)}/100 ${complianceVerdict}

CONFUSION SIGNALS:
- Hesitation Events: ${this.metrics.hesitationEvents}
- Wrong-Station Attempts: ${this.metrics.wrongStationAttempts}
- Abandoned Actions: ${this.metrics.abandonedActions}
- Confusion Score: ${this.metrics.confusionScore.toFixed(1)} ${confusionVerdict}

OVERALL ADOPTION:
- Adoption Readiness: ${this.metrics.adoptionReadinessScore.toFixed(1)}/100 ${adoptionVerdict}

TOP WORKFLOW DRIFTS:
${this.getTopDrifts(5)
  .map(
    (drift, i) =>
      `${i + 1}. ${drift.name} (${drift.frequency}x, ${drift.impact} impact)\n   ${drift.description}`
  )
  .join('\n')}

RECOMMENDATION:
${this.getRecommendation()}
    `.trim()
  }

  /**
   * Get recommendation based on scores
   */
  private getRecommendation(): string {
    if (this.metrics.adoptionReadinessScore >= 80) {
      return '✅ System is ready for scale deployment. Staff naturally adopt it under pressure.'
    } else if (this.metrics.adoptionReadinessScore >= 65) {
      return '⚠️ Apply top 3 micro-tweaks based on friction points. Re-measure in 2-3 days.'
    } else {
      return '❌ Hold scale deployment. Simplify top confusion points and consider workflow coaching.'
    }
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalUpdates: 0,
      stationOriginatedUpdates: 0,
      crossStationUpdates: 0,
      managerOverrides: 0,
      offSystemActions: 0,
      trustScore: 0,
      totalItems: 0,
      canonicalPathCompletions: 0,
      invalidTransitions: 0,
      corrections: 0,
      complianceScore: 0,
      hesitationEvents: 0,
      wrongStationAttempts: 0,
      abandonedActions: 0,
      confusionScore: 0,
      averageTimeToFirstAction: 0,
      averageActionsPerItem: 0,
      completionRate: 0,
      adoptionReadinessScore: 0,
    }
    this.divergenceEvents = []
    this.workflowDrifts.clear()
  }
}

// Export singleton instance
export const adoptionTracker = AdoptionTracker.getInstance()
