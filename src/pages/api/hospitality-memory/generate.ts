/**
 * Hospitality Memory™ API endpoint.
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/api-endpoint-factory'
import { createHospitalityMemoryService } from '@/lib/hospitality-memory/service'
import type { HospitalityMemoryRequest, HospitalityMemoryResponse } from '@/lib/hospitality-memory/types'

export default createIntelligenceEndpoint<HospitalityMemoryRequest, HospitalityMemoryResponse>(
  'Hospitality Memory',
  createHospitalityMemoryService
)
