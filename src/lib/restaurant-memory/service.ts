/**
 * Backward-compatible wrapper for deprecated `restaurant-memory` internal namespace.
 *
 * Preferred internal namespace: `hospitality-memory`.
 */

export {
  HospitalityMemoryService as RestaurantMemoryService,
  createHospitalityMemoryService as createRestaurantMemoryService,
} from '@/lib/hospitality-memory/service'
