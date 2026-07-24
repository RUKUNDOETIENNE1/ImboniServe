/**
 * Hospitality Intelligence Platform v1.0
 * Base Dashboard Builder
 * 
 * Provides shared presentation utilities for all intelligence dashboards.
 * Extracts common formatting and defensive handling patterns.
 */

/**
 * Base Dashboard Builder
 * 
 * Provides shared utilities:
 * - Duration formatting
 * - Grade calculation
 * - Icon mapping
 * - Color mapping
 * - Defensive null handling
 * 
 * Delegates to subclasses:
 * - Dashboard structure
 * - Module-specific displays
 * - Domain-specific formatting
 */
export abstract class BaseDashboardBuilder<TReport, TDashboard> {
  /**
   * Build dashboard from report (must be implemented by subclass)
   */
  abstract build(report: TReport): TDashboard

  /**
   * Format duration in seconds to human-readable string
   * 
   * Examples:
   * - 45 → "45s"
   * - 120 → "2m"
   * - 150 → "2m 30s"
   */
  protected formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  /**
   * Calculate letter grade from numeric score (0-100)
   * 
   * Grading scale:
   * - A: 90-100
   * - B: 80-89
   * - C: 70-79
   * - D: 60-69
   * - F: 0-59
   */
  protected calculateGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Get icon name from type using provided mapping
   * 
   * @param type - The type to map
   * @param mapping - Icon mapping object
   * @param defaultIcon - Default icon if type not found
   */
  protected getIcon(
    type: string,
    mapping: Record<string, string>,
    defaultIcon: string = 'Info'
  ): string {
    return mapping[type] ?? defaultIcon
  }

  /**
   * Get color class from type using provided mapping
   * 
   * @param type - The type to map
   * @param mapping - Color mapping object
   * @param defaultColor - Default color if type not found
   */
  protected getColor(
    type: string,
    mapping: Record<string, string>,
    defaultColor: string = 'text-gray-600'
  ): string {
    return mapping[type] ?? defaultColor
  }

  /**
   * Safely get value with fallback
   * 
   * @param value - Value to check
   * @param fallback - Fallback value if undefined/null
   */
  protected safeValue<T>(value: T | undefined | null, fallback: T): T {
    return value ?? fallback
  }

  /**
   * Safely format percentage
   * 
   * @param value - Numeric value (0-100)
   * @param decimals - Number of decimal places
   */
  protected formatPercentage(value: number | undefined | null, decimals: number = 1): string {
    return `${(value ?? 0).toFixed(decimals)}%`
  }

  /**
   * Safely format number
   * 
   * @param value - Numeric value
   * @param decimals - Number of decimal places
   */
  protected formatNumber(value: number | undefined | null, decimals: number = 1): string {
    return (value ?? 0).toFixed(decimals)
  }

  /**
   * Common insight icon mapping
   */
  protected getInsightIcon(type: string): string {
    const mapping = {
      opportunity: 'TrendingUp',
      warning: 'AlertTriangle',
      achievement: 'Award',
      info: 'Info',
    }
    return this.getIcon(type, mapping, 'Info')
  }

  /**
   * Common insight color mapping
   */
  protected getInsightColor(type: string): string {
    const mapping = {
      opportunity: 'text-blue-600',
      warning: 'text-orange-600',
      achievement: 'text-green-600',
      info: 'text-gray-600',
    }
    return this.getColor(type, mapping, 'text-gray-600')
  }

  /**
   * Common severity color mapping
   */
  protected getSeverityColor(severity: string): string {
    const mapping = {
      low: 'text-yellow-500',
      medium: 'text-orange-500',
      high: 'text-red-500',
      critical: 'text-red-700',
    }
    return this.getColor(severity, mapping, 'text-gray-600')
  }

  /**
   * Common trend icon mapping
   */
  protected getTrendIcon(trend: string): string {
    const mapping = {
      improving: 'TrendingUp',
      stable: 'Minus',
      declining: 'TrendingDown',
      up: 'TrendingUp',
      down: 'TrendingDown',
    }
    return this.getIcon(trend, mapping, 'Minus')
  }

  /**
   * Common trend color mapping
   */
  protected getTrendColor(trend: string): string {
    const mapping = {
      improving: 'text-green-600',
      stable: 'text-gray-600',
      declining: 'text-red-600',
      up: 'text-green-600',
      down: 'text-red-600',
    }
    return this.getColor(trend, mapping, 'text-gray-600')
  }

  /**
   * Build metadata section (common across all dashboards)
   */
  protected buildMetadata(report: any): {
    id: string
    generatedAt: string
    reportingPeriod: string
    confidence: number
  } {
    return {
      id: report.id ?? 'unknown',
      generatedAt: report.generatedAt ?? new Date().toISOString(),
      reportingPeriod: report.reportingPeriod?.label ?? 'Unknown',
      confidence: report.confidence ?? 0,
    }
  }

  /**
   * Defensive array mapping
   * 
   * Safely maps array with fallback to empty array
   */
  protected safeMap<T, U>(
    array: T[] | undefined | null,
    mapper: (item: T) => U
  ): U[] {
    return (array ?? []).map(mapper)
  }

  /**
   * Defensive array filter
   * 
   * Safely filters array with fallback to empty array
   */
  protected safeFilter<T>(
    array: T[] | undefined | null,
    predicate: (item: T) => boolean
  ): T[] {
    return (array ?? []).filter(predicate)
  }

  /**
   * Defensive array slice
   * 
   * Safely slices array with fallback to empty array
   */
  protected safeSlice<T>(
    array: T[] | undefined | null,
    start?: number,
    end?: number
  ): T[] {
    return (array ?? []).slice(start, end)
  }
}
