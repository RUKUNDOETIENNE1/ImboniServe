/**
 * Performance Monitoring Service
 * Tracks UI responsiveness, render performance, and user interaction delays
 * Phase 4: Operational Validation
 */

export interface PerformanceMetrics {
  // Rendering performance
  averageRenderTimeMs: number
  maxRenderTimeMs: number
  droppedFrames: number
  totalRenders: number

  // Interaction performance
  averageInteractionDelayMs: number
  maxInteractionDelayMs: number
  totalInteractions: number

  // Real-time update performance
  averageUpdateLatencyMs: number
  maxUpdateLatencyMs: number
  totalUpdates: number

  // User experience indicators
  perceivedLagEvents: number // >100ms delays
  frustrationEvents: number // >500ms delays
  smoothOperations: number // <50ms operations
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {
    averageRenderTimeMs: 0,
    maxRenderTimeMs: 0,
    droppedFrames: 0,
    totalRenders: 0,
    averageInteractionDelayMs: 0,
    maxInteractionDelayMs: 0,
    totalInteractions: 0,
    averageUpdateLatencyMs: 0,
    maxUpdateLatencyMs: 0,
    totalUpdates: 0,
    perceivedLagEvents: 0,
    frustrationEvents: 0,
    smoothOperations: 0,
  }

  private renderTimes: number[] = []
  private interactionTimes: number[] = []
  private updateLatencies: number[] = []
  private isMonitoring = false

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Monitor frame rate
    if (typeof window !== 'undefined') {
      this.monitorFrameRate()
    }

    console.log('[PerformanceMonitor] Started monitoring')
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isMonitoring = false
    console.log('[PerformanceMonitor] Stopped monitoring')
  }

  /**
   * Track component render time
   */
  trackRender(componentName: string, renderFn: () => void): void {
    const start = performance.now()
    renderFn()
    const duration = performance.now() - start

    this.renderTimes.push(duration)
    this.metrics.totalRenders++

    if (duration > this.metrics.maxRenderTimeMs) {
      this.metrics.maxRenderTimeMs = duration
    }

    // Detect dropped frames (>16.67ms = missed 60fps frame)
    if (duration > 16.67) {
      this.metrics.droppedFrames++
    }

    // Detect perceived lag
    if (duration > 100) {
      this.metrics.perceivedLagEvents++
    }

    // Detect frustration-level lag
    if (duration > 500) {
      this.metrics.frustrationEvents++
      console.warn(`[PerformanceMonitor] Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`)
    }

    // Track smooth operations
    if (duration < 50) {
      this.metrics.smoothOperations++
    }

    this.updateAverages()
  }

  /**
   * Track user interaction delay
   */
  trackInteraction(actionName: string, actionFn: () => Promise<void> | void): Promise<void> {
    const start = performance.now()

    const result = actionFn()

    if (result instanceof Promise) {
      return result.then(() => {
        this.recordInteraction(actionName, start)
      })
    } else {
      this.recordInteraction(actionName, start)
      return Promise.resolve()
    }
  }

  private recordInteraction(actionName: string, startTime: number): void {
    const duration = performance.now() - startTime

    this.interactionTimes.push(duration)
    this.metrics.totalInteractions++

    if (duration > this.metrics.maxInteractionDelayMs) {
      this.metrics.maxInteractionDelayMs = duration
    }

    if (duration > 100) {
      this.metrics.perceivedLagEvents++
    }

    if (duration > 500) {
      this.metrics.frustrationEvents++
      console.warn(`[PerformanceMonitor] Slow interaction: ${actionName} took ${duration.toFixed(2)}ms`)
    }

    if (duration < 50) {
      this.metrics.smoothOperations++
    }

    this.updateAverages()
  }

  /**
   * Track real-time update latency
   */
  trackUpdateLatency(sentTime: Date, receivedTime: Date): void {
    const latency = receivedTime.getTime() - sentTime.getTime()

    this.updateLatencies.push(latency)
    this.metrics.totalUpdates++

    if (latency > this.metrics.maxUpdateLatencyMs) {
      this.metrics.maxUpdateLatencyMs = latency
    }

    if (latency > 1000) {
      console.warn(`[PerformanceMonitor] High update latency: ${latency}ms`)
    }

    this.updateAverages()
  }

  /**
   * Monitor frame rate
   */
  private monitorFrameRate(): void {
    let lastTime = performance.now()
    let frameCount = 0

    const checkFrame = () => {
      if (!this.isMonitoring) return

      const currentTime = performance.now()
      const delta = currentTime - lastTime

      // If frame took longer than 16.67ms, it's a dropped frame
      if (delta > 16.67) {
        this.metrics.droppedFrames++
      }

      frameCount++
      lastTime = currentTime

      requestAnimationFrame(checkFrame)
    }

    requestAnimationFrame(checkFrame)
  }

  /**
   * Update running averages
   */
  private updateAverages(): void {
    if (this.renderTimes.length > 0) {
      this.metrics.averageRenderTimeMs =
        this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
    }

    if (this.interactionTimes.length > 0) {
      this.metrics.averageInteractionDelayMs =
        this.interactionTimes.reduce((a, b) => a + b, 0) / this.interactionTimes.length
    }

    if (this.updateLatencies.length > 0) {
      this.metrics.averageUpdateLatencyMs =
        this.updateLatencies.reduce((a, b) => a + b, 0) / this.updateLatencies.length
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const smoothRate = (this.metrics.smoothOperations / this.metrics.totalInteractions) * 100 || 0
    const lagRate = (this.metrics.perceivedLagEvents / this.metrics.totalInteractions) * 100 || 0
    const frustrationRate = (this.metrics.frustrationEvents / this.metrics.totalInteractions) * 100 || 0

    return `
=== PERFORMANCE REPORT ===

RENDERING:
- Total Renders: ${this.metrics.totalRenders}
- Average Render Time: ${this.metrics.averageRenderTimeMs.toFixed(2)}ms
- Max Render Time: ${this.metrics.maxRenderTimeMs.toFixed(2)}ms
- Dropped Frames: ${this.metrics.droppedFrames}

INTERACTIONS:
- Total Interactions: ${this.metrics.totalInteractions}
- Average Delay: ${this.metrics.averageInteractionDelayMs.toFixed(2)}ms
- Max Delay: ${this.metrics.maxInteractionDelayMs.toFixed(2)}ms

REAL-TIME UPDATES:
- Total Updates: ${this.metrics.totalUpdates}
- Average Latency: ${this.metrics.averageUpdateLatencyMs.toFixed(2)}ms
- Max Latency: ${this.metrics.maxUpdateLatencyMs.toFixed(2)}ms

USER EXPERIENCE:
- Smooth Operations: ${this.metrics.smoothOperations} (${smoothRate.toFixed(1)}%)
- Perceived Lag Events: ${this.metrics.perceivedLagEvents} (${lagRate.toFixed(1)}%)
- Frustration Events: ${this.metrics.frustrationEvents} (${frustrationRate.toFixed(1)}%)

VERDICT: ${smoothRate > 80 && frustrationRate < 5 ? '✅ EXCELLENT' : smoothRate > 60 ? '⚠️ ACCEPTABLE' : '❌ NEEDS OPTIMIZATION'}
    `.trim()
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      averageRenderTimeMs: 0,
      maxRenderTimeMs: 0,
      droppedFrames: 0,
      totalRenders: 0,
      averageInteractionDelayMs: 0,
      maxInteractionDelayMs: 0,
      totalInteractions: 0,
      averageUpdateLatencyMs: 0,
      maxUpdateLatencyMs: 0,
      totalUpdates: 0,
      perceivedLagEvents: 0,
      frustrationEvents: 0,
      smoothOperations: 0,
    }
    this.renderTimes = []
    this.interactionTimes = []
    this.updateLatencies = []
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
