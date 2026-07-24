/**
 * Kitchen Intelligence™ API v2 - Generate Report
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 * 
 * POST /api/kitchen-intelligence/generate-v2
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/platform'
import { createKitchenIntelligenceServiceV2 } from '@/lib/kitchen-intelligence/service-v2'
import type { KitchenIntelligenceRequest, KitchenIntelligenceResponse } from '@/lib/kitchen-intelligence/types'

export default createIntelligenceEndpoint<KitchenIntelligenceRequest, KitchenIntelligenceResponse>(
  'Kitchen Intelligence',
  createKitchenIntelligenceServiceV2
)
