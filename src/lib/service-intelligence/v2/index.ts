/**
 * Service Intelligence™ V2 - Public API
 * 
 * First production consumer of the Hospitality Intelligence Platform.
 */

// Main Service
export {
  ServiceIntelligenceService,
  createServiceIntelligence,
} from './service'

// Dashboard Builder
export {
  DashboardBuilder,
  createDashboardBuilder,
} from './dashboard-builder'

// Event Transformer
export {
  ServiceEventTransformer,
  createEventTransformer,
} from './event-transformer'

// Exporter
export {
  ServiceIntelligenceExporter,
  createExporter,
} from './export'

// Configuration
export {
  SERVICE_SCORING_CONFIG,
  SERVICE_PERIODS,
  getServiceTimeRange,
  getComparisonPeriod,
} from './config'

// Types
export type * from './types'
