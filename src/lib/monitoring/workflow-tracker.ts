/**
 * Human Workflow Validation Tracker
 * Measures staff comprehension time, action completion speed, and confusion points
 * Phase 4: Operational Validation
 */

export interface WorkflowMetrics {
  // Comprehension metrics
  averageTimeToFirstActionMs: number // Time from screen load to first click
  hesitationEvents: number // Pauses >3s before action

  // Action completion metrics
  averageActionsPerOrder: number
  averageTimePerActionMs: number
  fastActions: number // <2s
  slowActions: number // >5s

  // Confusion indicators
  backtrackEvents: number // Undo or reverse actions
  errorCorrections: number // Invalid actions corrected
  helpRequests: number // Implicit help-seeking behavior

  // Station clarity
  wrongStationAttempts: number // Trying to update wrong station's items
  stationSwitchCount: number

  // Overall workflow
  totalWorkflowSessions: number
  completedWorkflows: number
  abandonedWorkflows: number
}

export interface WorkflowSession {
  id: string
  stationId: string
  startTime: Date
  firstActionTime?: Date
  actions: WorkflowAction[]
  completed: boolean
  abandoned: boolean
}

export interface WorkflowAction {
  type: 'view' | 'click' | 'update' | 'error' | 'backtrack'
  timestamp: Date
  target: string
  duration?: number
  successful: boolean
}

export class WorkflowTracker {
  private static instance: WorkflowTracker
  private metrics: WorkflowMetrics = {
    averageTimeToFirstActionMs: 0,
    hesitationEvents: 0,
    averageActionsPerOrder: 0,
    averageTimePerActionMs: 0,
    fastActions: 0,
    slowActions: 0,
    backtrackEvents: 0,
    errorCorrections: 0,
    helpRequests: 0,
    wrongStationAttempts: 0,
    stationSwitchCount: 0,
    totalWorkflowSessions: 0,
    completedWorkflows: 0,
    abandonedWorkflows: 0,
  }

  private currentSession: WorkflowSession | null = null
  private sessions: WorkflowSession[] = []
  private timeToFirstActions: number[] = []
  private actionDurations: number[] = []

  static getInstance(): WorkflowTracker {
    if (!WorkflowTracker.instance) {
      WorkflowTracker.instance = new WorkflowTracker()
    }
    return WorkflowTracker.instance
  }

  /**
   * Start new workflow session (e.g., staff opens KDS)
   */
  startSession(stationId: string): string {
    const sessionId = `workflow-${Date.now()}-${Math.random()}`

    this.currentSession = {
      id: sessionId,
      stationId,
      startTime: new Date(),
      actions: [],
      completed: false,
      abandoned: false,
    }

    this.sessions.push(this.currentSession)
    this.metrics.totalWorkflowSessions++

    console.log('[WorkflowTracker] Session started:', sessionId)
    return sessionId
  }

  /**
   * Track user action
   */
  trackAction(
    type: WorkflowAction['type'],
    target: string,
    successful: boolean = true
  ): void {
    if (!this.currentSession) return

    const now = new Date()
    const action: WorkflowAction = {
      type,
      timestamp: now,
      target,
      successful,
    }

    // Track time to first action
    if (!this.currentSession.firstActionTime && type === 'click') {
      this.currentSession.firstActionTime = now
      const timeToFirst = now.getTime() - this.currentSession.startTime.getTime()
      this.timeToFirstActions.push(timeToFirst)

      // Detect hesitation (>3s before first action)
      if (timeToFirst > 3000) {
        this.metrics.hesitationEvents++
        console.log('[WorkflowTracker] Hesitation detected:', timeToFirst, 'ms')
      }
    }

    // Track action duration
    const lastAction = this.currentSession.actions[this.currentSession.actions.length - 1]
    if (lastAction) {
      const duration = now.getTime() - lastAction.timestamp.getTime()
      action.duration = duration
      this.actionDurations.push(duration)

      // Classify action speed
      if (duration < 2000) {
        this.metrics.fastActions++
      } else if (duration > 5000) {
        this.metrics.slowActions++
        console.log('[WorkflowTracker] Slow action detected:', duration, 'ms')
      }
    }

    // Detect backtracking
    if (type === 'backtrack') {
      this.metrics.backtrackEvents++
    }

    // Detect error corrections
    if (!successful) {
      this.metrics.errorCorrections++
    }

    this.currentSession.actions.push(action)
    this.updateMetrics()
  }

  /**
   * Track station switch
   */
  trackStationSwitch(fromStationId: string, toStationId: string): void {
    this.metrics.stationSwitchCount++
    this.trackAction('click', `station-switch:${fromStationId}->${toStationId}`, true)
  }

  /**
   * Track wrong station attempt
   */
  trackWrongStationAttempt(attemptedStationId: string, actualStationId: string): void {
    this.metrics.wrongStationAttempts++
    console.warn('[WorkflowTracker] Wrong station attempt:', {
      attempted: attemptedStationId,
      actual: actualStationId,
    })
  }

  /**
   * Complete current session
   */
  completeSession(): void {
    if (!this.currentSession) return

    this.currentSession.completed = true
    this.metrics.completedWorkflows++

    console.log('[WorkflowTracker] Session completed:', this.currentSession.id)
    this.currentSession = null
  }

  /**
   * Abandon current session
   */
  abandonSession(): void {
    if (!this.currentSession) return

    this.currentSession.abandoned = true
    this.metrics.abandonedWorkflows++

    console.log('[WorkflowTracker] Session abandoned:', this.currentSession.id)
    this.currentSession = null
  }

  /**
   * Update running metrics
   */
  private updateMetrics(): void {
    if (this.timeToFirstActions.length > 0) {
      this.metrics.averageTimeToFirstActionMs =
        this.timeToFirstActions.reduce((a, b) => a + b, 0) / this.timeToFirstActions.length
    }

    if (this.actionDurations.length > 0) {
      this.metrics.averageTimePerActionMs =
        this.actionDurations.reduce((a, b) => a + b, 0) / this.actionDurations.length
    }

    const completedSessions = this.sessions.filter((s) => s.completed)
    if (completedSessions.length > 0) {
      const totalActions = completedSessions.reduce((sum, s) => sum + s.actions.length, 0)
      this.metrics.averageActionsPerOrder = totalActions / completedSessions.length
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): WorkflowMetrics {
    return { ...this.metrics }
  }

  /**
   * Generate workflow report
   */
  generateReport(): string {
    const completionRate =
      (this.metrics.completedWorkflows / this.metrics.totalWorkflowSessions) * 100 || 0
    const abandonmentRate =
      (this.metrics.abandonedWorkflows / this.metrics.totalWorkflowSessions) * 100 || 0
    const fastActionRate = (this.metrics.fastActions / (this.metrics.fastActions + this.metrics.slowActions)) * 100 || 0

    return `
=== WORKFLOW VALIDATION REPORT ===

COMPREHENSION:
- Average Time to First Action: ${this.metrics.averageTimeToFirstActionMs.toFixed(0)}ms
- Hesitation Events: ${this.metrics.hesitationEvents}
- Verdict: ${this.metrics.averageTimeToFirstActionMs < 2000 ? '✅ INTUITIVE' : '⚠️ NEEDS SIMPLIFICATION'}

ACTION EFFICIENCY:
- Average Actions Per Order: ${this.metrics.averageActionsPerOrder.toFixed(1)}
- Average Time Per Action: ${this.metrics.averageTimePerActionMs.toFixed(0)}ms
- Fast Actions (<2s): ${this.metrics.fastActions} (${fastActionRate.toFixed(1)}%)
- Slow Actions (>5s): ${this.metrics.slowActions}

CONFUSION INDICATORS:
- Backtrack Events: ${this.metrics.backtrackEvents}
- Error Corrections: ${this.metrics.errorCorrections}
- Wrong Station Attempts: ${this.metrics.wrongStationAttempts}
- Station Switches: ${this.metrics.stationSwitchCount}

WORKFLOW COMPLETION:
- Total Sessions: ${this.metrics.totalWorkflowSessions}
- Completed: ${this.metrics.completedWorkflows} (${completionRate.toFixed(1)}%)
- Abandoned: ${this.metrics.abandonedWorkflows} (${abandonmentRate.toFixed(1)}%)

OVERALL VERDICT: ${
      completionRate > 90 && this.metrics.averageTimeToFirstActionMs < 2000 && this.metrics.wrongStationAttempts < 5
        ? '✅ READY FOR PILOT'
        : completionRate > 70
        ? '⚠️ NEEDS UX IMPROVEMENTS'
        : '❌ MAJOR UX ISSUES'
    }
    `.trim()
  }

  /**
   * Get detailed session analysis
   */
  getSessionAnalysis(): Array<{
    sessionId: string
    duration: number
    actionCount: number
    successful: boolean
    issues: string[]
  }> {
    return this.sessions.map((session) => {
      const duration = session.firstActionTime
        ? session.firstActionTime.getTime() - session.startTime.getTime()
        : 0

      const issues: string[] = []

      if (duration > 3000) issues.push('Slow comprehension')
      if (session.actions.filter((a) => !a.successful).length > 0) issues.push('Failed actions')
      if (session.actions.filter((a) => a.type === 'backtrack').length > 0) issues.push('Backtracking')
      if (session.abandoned) issues.push('Abandoned')

      return {
        sessionId: session.id,
        duration,
        actionCount: session.actions.length,
        successful: session.completed,
        issues,
      }
    })
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      averageTimeToFirstActionMs: 0,
      hesitationEvents: 0,
      averageActionsPerOrder: 0,
      averageTimePerActionMs: 0,
      fastActions: 0,
      slowActions: 0,
      backtrackEvents: 0,
      errorCorrections: 0,
      helpRequests: 0,
      wrongStationAttempts: 0,
      stationSwitchCount: 0,
      totalWorkflowSessions: 0,
      completedWorkflows: 0,
      abandonedWorkflows: 0,
    }
    this.sessions = []
    this.currentSession = null
    this.timeToFirstActions = []
    this.actionDurations = []
  }
}

// Export singleton instance
export const workflowTracker = WorkflowTracker.getInstance()
