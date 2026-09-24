/**
 * Service Replay™ - Time Utilities
 * 
 * Handles time range presets, formatting, and progress calculations.
 */

import type { PresetTimeRange, TimeRangePreset } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Time Range Presets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get start of day in a specific timezone
 */
function getStartOfDay(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  // Create date at midnight in the timezone
  const dateStr = `${year}-${month}-${day}T00:00:00`
  return new Date(dateStr)
}

/**
 * Get end of day in a specific timezone
 */
function getEndOfDay(date: Date, timezone: string): Date {
  const start = getStartOfDay(date, timezone)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Service period definitions (typical restaurant hours)
 */
const SERVICE_PERIODS = {
  breakfast: { start: 6, end: 11 },   // 6 AM - 11 AM
  lunch: { start: 11, end: 15 },      // 11 AM - 3 PM
  dinner: { start: 17, end: 23 },     // 5 PM - 11 PM
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  {
    key: 'today_breakfast',
    label: 'Today Breakfast',
    getRange: (timezone: string) => {
      const now = new Date()
      const start = getStartOfDay(now, timezone)
      start.setHours(SERVICE_PERIODS.breakfast.start, 0, 0, 0)
      const end = new Date(start)
      end.setHours(SERVICE_PERIODS.breakfast.end, 0, 0, 0)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    key: 'today_lunch',
    label: 'Today Lunch',
    getRange: (timezone: string) => {
      const now = new Date()
      const start = getStartOfDay(now, timezone)
      start.setHours(SERVICE_PERIODS.lunch.start, 0, 0, 0)
      const end = new Date(start)
      end.setHours(SERVICE_PERIODS.lunch.end, 0, 0, 0)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    key: 'today_dinner',
    label: 'Today Dinner',
    getRange: (timezone: string) => {
      const now = new Date()
      const start = getStartOfDay(now, timezone)
      start.setHours(SERVICE_PERIODS.dinner.start, 0, 0, 0)
      const end = new Date(start)
      end.setHours(SERVICE_PERIODS.dinner.end, 0, 0, 0)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    getRange: (timezone: string) => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const start = getStartOfDay(yesterday, timezone)
      const end = getEndOfDay(yesterday, timezone)
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    key: 'last_7_days',
    label: 'Last 7 Days',
    getRange: (timezone: string) => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const start = getStartOfDay(weekAgo, timezone)
      const end = now
      return { start: start.toISOString(), end: end.toISOString() }
    },
  },
  {
    key: 'custom',
    label: 'Custom Range',
    getRange: () => {
      const now = new Date()
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      return { start: hourAgo.toISOString(), end: now.toISOString() }
    },
  },
]

/**
 * Get time range for a preset
 */
export function getTimeRangeForPreset(
  preset: PresetTimeRange,
  timezone: string = 'Africa/Kigali'
): { start: string; end: string } {
  const presetConfig = TIME_RANGE_PRESETS.find(p => p.key === preset)
  if (!presetConfig) {
    // Default to last hour
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    return { start: hourAgo.toISOString(), end: now.toISOString() }
  }
  return presetConfig.getRange(timezone)
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a human-readable label for a service period
 */
export function getServicePeriodLabel(timestamp: string, timezone: string = 'Africa/Kigali'): string {
  const date = new Date(timestamp)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  })
  const hour = parseInt(formatter.format(date), 10)
  
  if (hour >= SERVICE_PERIODS.breakfast.start && hour < SERVICE_PERIODS.breakfast.end) {
    return 'Breakfast Service'
  }
  if (hour >= SERVICE_PERIODS.lunch.start && hour < SERVICE_PERIODS.lunch.end) {
    return 'Lunch Service'
  }
  if (hour >= SERVICE_PERIODS.dinner.start && hour < SERVICE_PERIODS.dinner.end) {
    return 'Dinner Service'
  }
  return 'Off-Peak'
}

/**
 * Format a timestamp for replay display
 */
export function formatReplayTime(
  timestamp: string,
  timezone: string = 'Africa/Kigali',
  options: { includeDate?: boolean; includeSeconds?: boolean } = {}
): string {
  const date = new Date(timestamp)
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  
  if (options.includeSeconds) {
    timeOptions.second = '2-digit'
  }
  
  if (options.includeDate) {
    timeOptions.month = 'short'
    timeOptions.day = 'numeric'
  }
  
  return new Intl.DateTimeFormat('en-US', timeOptions).format(date)
}

/**
 * Format duration between two timestamps
 */
export function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - start
  
  if (diffMs < 0) return '0s'
  
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}

/**
 * Format elapsed time from a timestamp to now
 */
export function formatElapsed(timestamp: string): string {
  return formatDuration(timestamp, new Date().toISOString())
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate progress percentage through a time range
 */
export function calculateProgress(
  currentTime: string,
  startTime: string,
  endTime: string
): number {
  const current = new Date(currentTime).getTime()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  
  if (end <= start) return 0
  if (current <= start) return 0
  if (current >= end) return 100
  
  return ((current - start) / (end - start)) * 100
}

/**
 * Calculate the timestamp at a given progress percentage
 */
export function calculateTimeAtProgress(
  progress: number,
  startTime: string,
  endTime: string
): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const targetTime = start + ((end - start) * clampedProgress) / 100
  
  return new Date(targetTime).toISOString()
}

/**
 * Find the event index closest to a given timestamp
 */
export function findEventIndexAtTime(
  events: { timestamp: string }[],
  targetTime: string
): number {
  if (events.length === 0) return -1
  
  const target = new Date(targetTime).getTime()
  
  let closestIndex = 0
  let closestDiff = Math.abs(new Date(events[0].timestamp).getTime() - target)
  
  for (let i = 1; i < events.length; i++) {
    const diff = Math.abs(new Date(events[i].timestamp).getTime() - target)
    if (diff < closestDiff) {
      closestDiff = diff
      closestIndex = i
    }
    // Events are sorted chronologically, so if we start getting further away, stop
    if (new Date(events[i].timestamp).getTime() > target && diff > closestDiff) {
      break
    }
  }
  
  return closestIndex
}

/**
 * Get events within a time window around a target time
 */
export function getEventsInWindow(
  events: { timestamp: string }[],
  targetTime: string,
  windowMs: number = 60000 // 1 minute default
): { timestamp: string }[] {
  const target = new Date(targetTime).getTime()
  const windowStart = target - windowMs / 2
  const windowEnd = target + windowMs / 2
  
  return events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime()
    return eventTime >= windowStart && eventTime <= windowEnd
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Playback Speed Calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the next event time based on playback speed
 */
export function calculateNextEventDelay(
  currentEventTime: string,
  nextEventTime: string,
  playbackSpeed: number
): number {
  const current = new Date(currentEventTime).getTime()
  const next = new Date(nextEventTime).getTime()
  const realTimeDiff = next - current
  
  // Apply playback speed multiplier
  const adjustedDelay = realTimeDiff / playbackSpeed
  
  // Clamp to reasonable bounds (min 50ms, max 5000ms)
  return Math.max(50, Math.min(5000, adjustedDelay))
}

/**
 * Calculate how many events to skip at high playback speeds
 * to maintain smooth animation
 */
export function calculateEventSkip(
  playbackSpeed: number,
  eventDensity: number // events per second
): number {
  // At 1x speed, show all events
  // At higher speeds, skip events if density is too high
  const maxEventsPerSecond = 10
  const effectiveEventsPerSecond = eventDensity * playbackSpeed
  
  if (effectiveEventsPerSecond <= maxEventsPerSecond) {
    return 1 // Show every event
  }
  
  return Math.ceil(effectiveEventsPerSecond / maxEventsPerSecond)
}
