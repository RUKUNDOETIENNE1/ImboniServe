/**
 * DIE Analytics — Utility Functions
 * Block 5B: Intelligence & Analytics Layer
 */

import type { DateRange, TimeSeriesDataPoint, TrendIndicator } from './analytics-types'

/**
 * Generate date range helpers
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom', customRange?: DateRange): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      }
    case 'week':
      return {
        from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now,
      }
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      }
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      return {
        from: new Date(now.getFullYear(), quarterStart, 1),
        to: now,
      }
    }
    case 'year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: now,
      }
    case 'custom':
      if (!customRange) throw new Error('Custom range requires from/to dates')
      return customRange
    default:
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: now,
      }
  }
}

/**
 * Calculate trend indicator from two values
 */
export function calculateTrend(current: number, previous: number, positiveIsGood = true): TrendIndicator {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: 0,
      isPositive: positiveIsGood ? current >= 0 : current <= 0,
    }
  }

  const change = current - previous
  const percentage = Math.abs((change / previous) * 100)

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (Math.abs(percentage) > 1) {
    direction = change > 0 ? 'up' : 'down'
  }

  const isPositive = positiveIsGood
    ? change >= 0
    : change <= 0

  return {
    direction,
    percentage: Math.round(percentage * 10) / 10,
    isPositive,
  }
}

/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(values: Array<{ value: number; weight: number }>): number {
  if (values.length === 0) return 0

  const totalWeight = values.reduce((sum, v) => sum + v.weight, 0)
  if (totalWeight === 0) return 0

  const weightedSum = values.reduce((sum, v) => sum + v.value * v.weight, 0)
  return weightedSum / totalWeight
}

/**
 * Calculate volatility (coefficient of variation)
 */
export function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  if (mean === 0) return 0

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return (stdDev / mean) * 100
}

/**
 * Generate time series buckets for a date range
 */
export function generateTimeSeries(
  from: Date,
  to: Date,
  granularity: 'day' | 'week' | 'month' = 'day'
): Array<{ from: Date; to: Date; label: string }> {
  const buckets: Array<{ from: Date; to: Date; label: string }> = []
  let current = new Date(from)

  while (current < to) {
    let next: Date
    let label: string

    switch (granularity) {
      case 'day':
        next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
        label = current.toISOString().split('T')[0]
        break
      case 'week': {
        next = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
        const weekNum = Math.ceil((current.getDate() + 6 - current.getDay()) / 7)
        label = `W${weekNum} ${current.getFullYear()}`
        break
      }
      case 'month':
        next = new Date(current.getFullYear(), current.getMonth() + 1, 1)
        label = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        break
    }

    buckets.push({
      from: new Date(current),
      to: next > to ? new Date(to) : next,
      label,
    })

    current = next
  }

  return buckets
}

/**
 * Aggregate data into time series
 */
export function aggregateToTimeSeries<T>(
  data: T[],
  dateExtractor: (item: T) => Date,
  valueExtractor: (item: T) => number,
  from: Date,
  to: Date,
  granularity: 'day' | 'week' | 'month' = 'day'
): TimeSeriesDataPoint[] {
  const buckets = generateTimeSeries(from, to, granularity)
  const result: TimeSeriesDataPoint[] = []

  for (const bucket of buckets) {
    const itemsInBucket = data.filter((item) => {
      const date = dateExtractor(item)
      return date >= bucket.from && date < bucket.to
    })

    const value = itemsInBucket.reduce((sum, item) => sum + valueExtractor(item), 0)

    result.push({
      date: bucket.label,
      value,
      label: bucket.label,
    })
  }

  return result
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate health score (0-100)
 */
export function calculateHealthScore(metrics: {
  successRate?: number
  failureRate?: number
  anomalyRate?: number
  approvalRate?: number
  processingTime?: number
  targetProcessingTime?: number
}): number {
  let score = 100

  // Success rate impact (0-30 points)
  if (metrics.successRate !== undefined) {
    score -= (1 - metrics.successRate) * 30
  }

  // Failure rate impact (0-20 points)
  if (metrics.failureRate !== undefined) {
    score -= metrics.failureRate * 20
  }

  // Anomaly rate impact (0-20 points)
  if (metrics.anomalyRate !== undefined) {
    score -= Math.min(metrics.anomalyRate * 20, 20)
  }

  // Approval rate impact (0-15 points)
  if (metrics.approvalRate !== undefined) {
    score += metrics.approvalRate * 15
  }

  // Processing time impact (0-15 points)
  if (metrics.processingTime !== undefined && metrics.targetProcessingTime !== undefined) {
    const ratio = metrics.processingTime / metrics.targetProcessingTime
    if (ratio > 1) {
      score -= Math.min((ratio - 1) * 15, 15)
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Format currency
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  const value = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

/**
 * Safe division (returns 0 if denominator is 0)
 */
export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
