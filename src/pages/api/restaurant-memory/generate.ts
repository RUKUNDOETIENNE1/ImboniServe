/**
 * Deprecated compatibility endpoint.
 *
 * Preferred internal endpoint namespace:
 *   /api/hospitality-memory/*
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/api-endpoint-factory'
import { createRestaurantMemoryService } from '@/lib/restaurant-memory/service'
import type { RestaurantMemoryRequest, RestaurantMemoryResponse } from '@/lib/restaurant-memory/types'

export default createIntelligenceEndpoint<RestaurantMemoryRequest, RestaurantMemoryResponse>(
  'Hospitality Memory',
  createRestaurantMemoryService
)
