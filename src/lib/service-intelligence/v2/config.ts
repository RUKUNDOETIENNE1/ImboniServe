/**
 * Service Intelligence™ V2 - HIE Configuration
 * 
 * Service-specific configuration for the Hospitality Intelligence Engine.
 */

import type { EngineConfig } from '@/lib/intelligence'

/**
 * Service Intelligence scoring configuration.
 * 
 * Defines dimensions specific to restaurant service operations.
 */
export const SERVICE_SCORING_CONFIG: EngineConfig = {
  scoring: {
    dimensions: [
      {
        id: 'prep_time',
        name: 'Preparation Time',
        weight: 0.25,
        benchmark: 720, // 12 minutes in seconds
        unit: 'seconds',
        higherIsBetter: false,
      },
      {
        id: 'service_time',
        name: 'Service Time',
        weight: 0.25,
        benchmark: 1800, // 30 minutes in seconds
        unit: 'seconds',
        higherIsBetter: false,
      },
      {
        id: 'kitchen_utilization',
        name: 'Kitchen Utilization',
        weight: 0.15,
        benchmark: 75, // 75% utilization
        unit: 'percent',
        higherIsBetter: true,
      },
      {
        id: 'completion_rate',
        name: 'Completion Rate',
        weight: 0.20,
        benchmark: 95, // 95% completion
        unit: 'percent',
        higherIsBetter: true,
      },
      {
        id: 'payment_time',
        name: 'Payment Time',
        weight: 0.15,
        benchmark: 180, // 3 minutes in seconds
        unit: 'seconds',
        higherIsBetter: false,
      },
    ],
  },

  problemThresholds: {
    byType: {
      prep_delay: {
        warning: 900, // 15 minutes
        critical: 1800, // 30 minutes
      },
      service_delay: {
        warning: 2400, // 40 minutes
        critical: 3600, // 60 minutes
      },
      kitchen_bottleneck: {
        warning: 5, // 5 orders in queue
        critical: 10, // 10 orders in queue
      },
      payment_delay: {
        warning: 300, // 5 minutes
        critical: 600, // 10 minutes
      },
      order_cancellation: {
        warning: 5, // 5% cancellation rate
        critical: 10, // 10% cancellation rate
      },
    },
    global: {
      minSeverity: 'medium',
      minConfidence: 0.6,
    },
  },

  patternDetection: {
    minOccurrences: 3,
    minConfidence: 0.7,
  },

  comparison: {
    metrics: [
      'prep_time',
      'service_time',
      'completion_rate',
      'kitchen_utilization',
      'payment_time',
      'order_count',
      'cancellation_rate',
    ],
  },
}

/**
 * Service period definitions.
 */
export const SERVICE_PERIODS = {
  lunch: {
    start: '11:00',
    end: '15:00',
    label: 'Lunch Service',
  },
  dinner: {
    start: '17:00',
    end: '22:00',
    label: 'Dinner Service',
  },
  breakfast: {
    start: '07:00',
    end: '11:00',
    label: 'Breakfast Service',
  },
  allDay: {
    start: '00:00',
    end: '23:59',
    label: 'All Day',
  },
}

/**
 * Get time range for a service period.
 */
export function getServiceTimeRange(
  period: string,
  date: Date,
  timezone: string
): { start: string; end: string; label: string } {
  const servicePeriod = SERVICE_PERIODS[period as keyof typeof SERVICE_PERIODS]
  
  if (!servicePeriod) {
    throw new Error(`Unknown service period: ${period}`)
  }

  const dateStr = date.toISOString().split('T')[0]
  
  return {
    start: `${dateStr}T${servicePeriod.start}:00.000Z`,
    end: `${dateStr}T${servicePeriod.end}:59.999Z`,
    label: servicePeriod.label,
  }
}

/**
 * Get comparison period for historical context.
 */
export function getComparisonPeriod(
  currentPeriod: string
): 'previous_day' | 'previous_week' | 'previous_month' {
  if (currentPeriod.includes('today')) {
    return 'previous_day'
  }
  if (currentPeriod.includes('7_days')) {
    return 'previous_week'
  }
  if (currentPeriod.includes('30_days')) {
    return 'previous_month'
  }
  return 'previous_day'
}
