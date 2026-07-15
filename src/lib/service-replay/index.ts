/**
 * Service Replay™ - Core Module
 * 
 * Transforms Heart Pulse events into a visual replay of restaurant operations.
 * "Watching restaurant operations like replaying a football match."
 * 
 * @see IAS-001 (Event-Driven by Default, Observability First)
 */

// Types
export type {
  ReplayEventCategory,
  ReplayEventType,
  ReplayEvent,
  PlaybackSpeed,
  PlaybackState,
  ReplaySession,
  ReplayStatistics,
  ReplayFilters,
  ReplaySearchQuery,
  ReplayEventsRequest,
  ReplayEventsResponse,
  ReplaySearchRequest,
  ReplaySearchResponse,
  PresetTimeRange,
  TimeRangePreset,
  EventTypeMetadata,
} from './types'

// Constants & Helpers
export {
  EVENT_CATEGORY_COLORS,
  EVENT_TYPE_METADATA,
  getEventCategory,
  getEventLabel,
  getEventColors,
  formatEventDescription,
} from './types'

// Event Transformer
export {
  transformTicketEvent,
  transformTicketEvents,
  buildEventDescription,
} from './transformer'

// Time Range Utilities
export {
  TIME_RANGE_PRESETS,
  getTimeRangeForPreset,
  getServicePeriodLabel,
  formatReplayTime,
  formatDuration,
  calculateProgress,
} from './time-utils'

// Statistics Calculator
export {
  calculateStatistics,
  createEmptyStatistics,
} from './statistics'
