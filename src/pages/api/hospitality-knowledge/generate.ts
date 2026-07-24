/**
 * Hospitality Knowledge™ API endpoint.
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/api-endpoint-factory'
import { createHospitalityKnowledgeService } from '@/lib/hospitality-knowledge/service'
import type { KnowledgeRequest, KnowledgeResponse } from '@/lib/hospitality-knowledge/types'

export default createIntelligenceEndpoint<KnowledgeRequest, KnowledgeResponse>(
  'Hospitality Knowledge',
  createHospitalityKnowledgeService
)
