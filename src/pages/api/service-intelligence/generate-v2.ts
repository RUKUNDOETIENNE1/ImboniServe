/**
 * Service Intelligence™ API v2 - Generate Report
 * 
 * Migrated to Hospitality Intelligence Platform v1.0
 * 
 * POST /api/service-intelligence/generate-v2
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/platform'
import { createServiceIntelligenceServiceV2 } from '@/lib/service-intelligence/service-v2'
import type { ServiceIntelligenceRequest, ServiceIntelligenceResponse } from '@/lib/service-intelligence/types'

export default createIntelligenceEndpoint<ServiceIntelligenceRequest, ServiceIntelligenceResponse>(
  'Service Intelligence',
  createServiceIntelligenceServiceV2
)
