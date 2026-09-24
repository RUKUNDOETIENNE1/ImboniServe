/**
 * Operational Stress Testing Service
 * Simulates real-world chaos: concurrent orders, rapid updates, network failures
 * Phase 4: Operational Validation
 */

export interface StressTestConfig {
  concurrentOrders: number // 20-100 orders
  updateFrequencyMs: number // How often to update items
  stationCount: number // Number of stations
  durationMinutes: number // Test duration
  networkFailureRate: number // 0-1 probability of simulated failure
  duplicateRequestRate: number // 0-1 probability of duplicate
}

export interface StressTestMetrics {
  totalOrders: number
  totalUpdates: number
  successfulUpdates: number
  failedUpdates: number
  duplicateRequests: number
  averageResponseTimeMs: number
  maxResponseTimeMs: number
  minResponseTimeMs: number
  networkFailures: number
  reconciliationEvents: number
  invalidTransitions: number
  uiLagEvents: number
  startTime: Date
  endTime?: Date
}

export class StressTestService {
  private metrics: StressTestMetrics = {
    totalOrders: 0,
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    duplicateRequests: 0,
    averageResponseTimeMs: 0,
    maxResponseTimeMs: 0,
    minResponseTimeMs: Infinity,
    networkFailures: 0,
    reconciliationEvents: 0,
    invalidTransitions: 0,
    uiLagEvents: 0,
    startTime: new Date(),
  }

  private responseTimes: number[] = []
  private isRunning = false
  private abortController?: AbortController

  /**
   * Run stress test simulation
   */
  async runStressTest(config: StressTestConfig): Promise<StressTestMetrics> {
    console.log('[StressTest] Starting stress test...', config)
    this.isRunning = true
    this.abortController = new AbortController()
    this.metrics.startTime = new Date()

    const endTime = Date.now() + config.durationMinutes * 60 * 1000

    // Create mock orders
    const orders = await this.createMockOrders(config.concurrentOrders, config.stationCount)
    this.metrics.totalOrders = orders.length

    // Simulate rapid updates
    const updatePromises: Promise<void>[] = []

    while (Date.now() < endTime && this.isRunning) {
      // Pick random order and item
      const order = orders[Math.floor(Math.random() * orders.length)]
      const item = order.items[Math.floor(Math.random() * order.items.length)]

      // Simulate update with potential failures
      const updatePromise = this.simulateItemUpdate(
        item.id,
        item.stationId,
        config.networkFailureRate,
        config.duplicateRequestRate
      )

      updatePromises.push(updatePromise)

      // Wait before next update
      await this.sleep(config.updateFrequencyMs)
    }

    // Wait for all updates to complete
    await Promise.allSettled(updatePromises)

    this.metrics.endTime = new Date()
    this.isRunning = false

    // Calculate final metrics
    this.calculateFinalMetrics()

    console.log('[StressTest] Test complete', this.metrics)
    return this.metrics
  }

  /**
   * Simulate single item update with chaos
   */
  private async simulateItemUpdate(
    itemId: string,
    stationId: string,
    networkFailureRate: number,
    duplicateRate: number
  ): Promise<void> {
    this.metrics.totalUpdates++

    // Simulate network failure
    if (Math.random() < networkFailureRate) {
      this.metrics.networkFailures++
      this.metrics.failedUpdates++
      return
    }

    const startTime = performance.now()

    try {
      // Determine next status
      const statuses = ['PREPARING', 'READY', 'DELIVERED']
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)]

      // Generate idempotency key
      const idempotencyKey = `stress-test-${itemId}-${Date.now()}-${Math.random()}`

      // Make request
      const response = await fetch('/api/station/update-item-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          itemId,
          newStatus,
          stationId,
          idempotencyKey,
        }),
      })

      const responseTime = performance.now() - startTime
      this.responseTimes.push(responseTime)

      if (responseTime > this.metrics.maxResponseTimeMs) {
        this.metrics.maxResponseTimeMs = responseTime
      }
      if (responseTime < this.metrics.minResponseTimeMs) {
        this.metrics.minResponseTimeMs = responseTime
      }

      if (response.ok) {
        const data = await response.json()
        this.metrics.successfulUpdates++

        if (data.idempotent) {
          this.metrics.duplicateRequests++
        }
      } else {
        this.metrics.failedUpdates++

        const error = await response.json()
        if (error.error?.includes('Invalid transition')) {
          this.metrics.invalidTransitions++
        }
      }

      // Simulate duplicate request
      if (Math.random() < duplicateRate) {
        // Send same request again (should be idempotent)
        await fetch('/api/station/update-item-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            itemId,
            newStatus,
            stationId,
            idempotencyKey,
          }),
        })
        this.metrics.duplicateRequests++
      }
    } catch (error) {
      this.metrics.failedUpdates++
      console.error('[StressTest] Update failed:', error)
    }
  }

  /**
   * Create mock orders for testing
   */
  private async createMockOrders(
    count: number,
    stationCount: number
  ): Promise<Array<{ id: string; items: Array<{ id: string; stationId: string }> }>> {
    // In real implementation, this would create actual test orders
    // For now, return mock structure
    const orders = []

    for (let i = 0; i < count; i++) {
      const itemCount = Math.floor(Math.random() * 5) + 1
      const items = []

      for (let j = 0; j < itemCount; j++) {
        items.push({
          id: `stress-item-${i}-${j}`,
          stationId: `stress-station-${Math.floor(Math.random() * stationCount)}`,
        })
      }

      orders.push({
        id: `stress-order-${i}`,
        items,
      })
    }

    return orders
  }

  /**
   * Calculate final metrics
   */
  private calculateFinalMetrics(): void {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0)
      this.metrics.averageResponseTimeMs = sum / this.responseTimes.length
    }
  }

  /**
   * Stop running test
   */
  stop(): void {
    this.isRunning = false
    this.abortController?.abort()
  }

  /**
   * Get current metrics
   */
  getMetrics(): StressTestMetrics {
    return { ...this.metrics }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Simulate UI lag detection
   */
  measureUILag(callback: () => void): number {
    const start = performance.now()
    callback()
    const duration = performance.now() - start

    if (duration > 16.67) {
      // Dropped frame (60fps = 16.67ms per frame)
      this.metrics.uiLagEvents++
    }

    return duration
  }

  /**
   * Generate stress test report
   */
  generateReport(): string {
    const duration =
      this.metrics.endTime && this.metrics.startTime
        ? (this.metrics.endTime.getTime() - this.metrics.startTime.getTime()) / 1000
        : 0

    const successRate = (this.metrics.successfulUpdates / this.metrics.totalUpdates) * 100
    const failureRate = (this.metrics.failedUpdates / this.metrics.totalUpdates) * 100

    return `
=== STRESS TEST REPORT ===

Duration: ${duration.toFixed(2)}s
Total Orders: ${this.metrics.totalOrders}
Total Updates: ${this.metrics.totalUpdates}

SUCCESS METRICS:
- Successful Updates: ${this.metrics.successfulUpdates} (${successRate.toFixed(2)}%)
- Failed Updates: ${this.metrics.failedUpdates} (${failureRate.toFixed(2)}%)
- Duplicate Requests Handled: ${this.metrics.duplicateRequests}

PERFORMANCE:
- Average Response Time: ${this.metrics.averageResponseTimeMs.toFixed(2)}ms
- Max Response Time: ${this.metrics.maxResponseTimeMs.toFixed(2)}ms
- Min Response Time: ${this.metrics.minResponseTimeMs === Infinity ? 'N/A' : this.metrics.minResponseTimeMs.toFixed(2) + 'ms'}

RELIABILITY:
- Network Failures: ${this.metrics.networkFailures}
- Invalid Transitions: ${this.metrics.invalidTransitions}
- Reconciliation Events: ${this.metrics.reconciliationEvents}
- UI Lag Events: ${this.metrics.uiLagEvents}

VERDICT: ${successRate > 95 ? '✅ PASS' : '⚠️ NEEDS IMPROVEMENT'}
    `.trim()
  }
}
