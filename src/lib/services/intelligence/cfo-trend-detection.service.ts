/**
 * CFO Trend Detection Service
 * 
 * Purpose: Detect meaningful deterioration below thresholds using deterministic methods
 * 
 * Design Philosophy:
 * - NO ML/AI - only deterministic math
 * - NO forecasting - only historical trend analysis
 * - Confidence scoring (0-100)
 * - Four detection methods: rolling window, velocity, weak signal, stagnation
 */

export interface TrendDetection {
  detected: boolean
  method: 'ROLLING_WINDOW' | 'VELOCITY' | 'WEAK_SIGNAL' | 'STAGNATION'
  observation: string
  confidence: number  // 0-100
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  action: string
  signals?: string[]
}

export interface MetricHistory {
  current: number
  month1Ago: number
  month2Ago: number
  month3Ago: number
}

export class CfoTrendDetectionService {
  /**
   * Detect rolling window trend (3-month gradual deterioration)
   */
  static detectRollingWindowTrend(
    metricName: string,
    history: MetricHistory,
    threshold: number  // e.g., -5 for 5% decline threshold
  ): TrendDetection | null {
    // Calculate monthly changes
    const month1Change = ((history.current - history.month1Ago) / history.month1Ago) * 100
    const month2Change = ((history.month1Ago - history.month2Ago) / history.month2Ago) * 100
    const month3Change = ((history.month2Ago - history.month3Ago) / history.month3Ago) * 100
    
    // Calculate total 3-month change
    const totalChange = ((history.current - history.month3Ago) / history.month3Ago) * 100
    
    // Check if consistent decline (all months negative)
    const isConsistentDecline = month1Change < 0 && month2Change < 0 && month3Change < 0
    
    // Check if total change is significant (below threshold)
    const isSignificant = totalChange < threshold
    
    if (isConsistentDecline && isSignificant) {
      // Calculate confidence based on consistency
      const avgMonthlyChange = totalChange / 3
      const consistency = 1 - (Math.abs(month1Change - avgMonthlyChange) + 
                               Math.abs(month2Change - avgMonthlyChange) + 
                               Math.abs(month3Change - avgMonthlyChange)) / (3 * Math.abs(avgMonthlyChange))
      const confidence = Math.min(100, Math.max(60, consistency * 100))
      
      // Determine severity based on total magnitude
      const severity = totalChange < threshold * 2 ? 'CRITICAL' : 'WARNING'
      
      return {
        detected: true,
        method: 'ROLLING_WINDOW',
        observation: `${metricName} declining consistently over 3 months (${totalChange.toFixed(1)}% total, ${avgMonthlyChange.toFixed(1)}% avg/month)`,
        confidence: Math.round(confidence),
        severity,
        action: `Investigate chronic ${metricName} deterioration: Each month shows decline, indicating systemic issue requiring intervention`
      }
    }
    
    return null
  }

  /**
   * Detect velocity change (acceleration or deceleration)
   */
  static detectVelocityChange(
    metricName: string,
    history: MetricHistory
  ): TrendDetection | null {
    // Calculate recent change (current vs 1 month ago)
    const recentChange = ((history.current - history.month1Ago) / history.month1Ago) * 100
    
    // Calculate prior change (1 month ago vs 2 months ago)
    const priorChange = ((history.month1Ago - history.month2Ago) / history.month2Ago) * 100
    
    // Calculate velocity (rate of change of change)
    const velocity = recentChange - priorChange
    
    // Detect negative acceleration (decline is accelerating)
    const isNegativeAcceleration = velocity < -2 && recentChange < 0
    
    if (isNegativeAcceleration) {
      // Confidence based on magnitude of acceleration
      const confidence = Math.min(100, Math.max(60, Math.abs(velocity) * 10))
      
      // Severity based on current decline rate
      const severity = recentChange < -5 ? 'WARNING' : 'INFO'
      
      return {
        detected: true,
        method: 'VELOCITY',
        observation: `${metricName} decline accelerating (${priorChange.toFixed(1)}% → ${recentChange.toFixed(1)}%)`,
        confidence: Math.round(confidence),
        severity,
        action: `Monitor ${metricName} closely: Decline is accelerating, indicating worsening trend that may cross thresholds soon`
      }
    }
    
    return null
  }

  /**
   * Detect weak signal accumulation (multiple metrics below thresholds)
   */
  static detectWeakSignalAccumulation(
    signals: Array<{
      name: string
      value: number
      threshold: number
      weight: number  // 1-10, importance of this metric
    }>
  ): TrendDetection | null {
    let deteriorationScore = 0
    const deterioratingMetrics: string[] = []
    
    for (const signal of signals) {
      // Calculate how close to threshold (0-100 scale)
      const distanceFromThreshold = Math.abs(signal.threshold - signal.value)
      const percentOfThreshold = (distanceFromThreshold / Math.abs(signal.threshold)) * 100
      
      // Score deterioration (higher = worse)
      const score = Math.max(0, Math.min(100, (100 - percentOfThreshold) * signal.weight))
      
      if (score > 30) {  // Weak signal threshold
        deteriorationScore += score
        deterioratingMetrics.push(`${signal.name} at ${signal.value.toFixed(1)}% (threshold: ${signal.threshold}%)`)
      }
    }
    
    // Normalize score
    const normalizedScore = Math.min(100, deteriorationScore / signals.length)
    
    // Determine if accumulated signals are significant
    const isSignificant = deterioratingMetrics.length >= 3 && normalizedScore > 40
    
    if (isSignificant) {
      // Confidence based on number of signals and score
      const confidence = Math.min(100, Math.max(60, (deterioratingMetrics.length / signals.length) * 100))
      
      // Severity based on normalized score
      const severity = normalizedScore > 70 ? 'WARNING' : 'INFO'
      
      return {
        detected: true,
        method: 'WEAK_SIGNAL',
        observation: `Multiple metrics showing early deterioration (${deterioratingMetrics.length} of ${signals.length})`,
        confidence: Math.round(confidence),
        severity,
        action: `Monitor retention metrics closely: Multiple weak signals suggest early retention crisis`,
        signals: deterioratingMetrics
      }
    }
    
    return null
  }

  /**
   * Detect stagnation (growth positive but insufficient)
   */
  static detectStagnation(
    metricName: string,
    currentGrowth: number,
    expectedGrowth: number,
    historicalAverage: number
  ): TrendDetection | null {
    // Growth is positive but below expectations
    const isStagnating = (
      currentGrowth > 0 && 
      currentGrowth < expectedGrowth &&
      currentGrowth < historicalAverage * 0.5
    )
    
    if (isStagnating) {
      const stagnationSeverity = expectedGrowth - currentGrowth
      
      // Confidence based on how far below historical
      const confidence = Math.min(100, Math.max(60, (1 - currentGrowth / historicalAverage) * 100))
      
      // Severity based on stagnation magnitude
      const severity = stagnationSeverity > 5 ? 'WARNING' : 'INFO'
      
      return {
        detected: true,
        method: 'STAGNATION',
        observation: `${metricName} growth stagnating at ${currentGrowth.toFixed(1)}% (historical avg: ${historicalAverage.toFixed(1)}%, expected: ${expectedGrowth}%)`,
        confidence: Math.round(confidence),
        severity,
        action: `Review ${metricName} growth drivers: Growth is positive but insufficient, indicating potential future decline`
      }
    }
    
    return null
  }

  /**
   * Analyze all trends for a metric
   */
  static analyzeTrends(
    metricName: string,
    history: MetricHistory,
    threshold: number,
    expectedGrowth?: number,
    historicalAverage?: number
  ): TrendDetection[] {
    const trends: TrendDetection[] = []
    
    // Check rolling window trend
    const rollingTrend = this.detectRollingWindowTrend(metricName, history, threshold)
    if (rollingTrend) trends.push(rollingTrend)
    
    // Check velocity change
    const velocityTrend = this.detectVelocityChange(metricName, history)
    if (velocityTrend) trends.push(velocityTrend)
    
    // Check stagnation (if growth metrics provided)
    if (expectedGrowth !== undefined && historicalAverage !== undefined) {
      const currentGrowth = ((history.current - history.month1Ago) / history.month1Ago) * 100
      const stagnationTrend = this.detectStagnation(metricName, currentGrowth, expectedGrowth, historicalAverage)
      if (stagnationTrend) trends.push(stagnationTrend)
    }
    
    // Sort by confidence (highest first)
    return trends.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get highest confidence trend detection
   */
  static getTopTrend(
    metricName: string,
    history: MetricHistory,
    threshold: number,
    expectedGrowth?: number,
    historicalAverage?: number
  ): TrendDetection | null {
    const trends = this.analyzeTrends(metricName, history, threshold, expectedGrowth, historicalAverage)
    return trends.length > 0 ? trends[0] : null
  }
}
