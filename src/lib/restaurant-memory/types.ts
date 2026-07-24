/**
 * Backward-compatible aliases for deprecated `restaurant-memory` internal namespace.
 *
 * Preferred internal namespace: `hospitality-memory`.
 */

export * from '@/lib/hospitality-memory/types'

// Deprecated aliases (non-breaking for existing imports)
export type MemoryCategory = import('@/lib/hospitality-memory/types').HospitalityMemoryCategory
export type MemoryStatus = import('@/lib/hospitality-memory/types').HospitalityMemoryStatus
export type MemoryConfidence = import('@/lib/hospitality-memory/types').HospitalityMemoryConfidenceLevel
export type OperationalMemory = import('@/lib/hospitality-memory/types').HospitalityMemoryEntity
export type MemoryRelationship = import('@/lib/hospitality-memory/types').HospitalityMemoryRelationship
export type MemoryTimelineEntry = import('@/lib/hospitality-memory/types').HospitalityMemoryTimelineEntry

export type RestaurantMemoryRequest = import('@/lib/hospitality-memory/types').HospitalityMemoryRequest
export type RestaurantMemoryReport = import('@/lib/hospitality-memory/types').HospitalityMemoryReport
export type RestaurantMemoryResponse = import('@/lib/hospitality-memory/types').HospitalityMemoryResponse
export type RestaurantMemorySearchRequest = import('@/lib/hospitality-memory/types').HospitalityMemorySearchRequest
export type RestaurantMemorySearchResponse = import('@/lib/hospitality-memory/types').HospitalityMemorySearchResponse
