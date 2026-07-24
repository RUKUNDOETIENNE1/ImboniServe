/**
 * Menu Intelligence™ API Endpoint
 * 
 * Platform: Hospitality Intelligence Platform v1.0.0
 * Module: Menu Intelligence™ v1.0
 * Pattern: Uses createIntelligenceEndpoint factory
 */

import { createIntelligenceEndpoint } from '@/lib/intelligence/api-endpoint-factory'
import { createMenuIntelligenceService } from '@/lib/menu-intelligence/service'
import type { MenuIntelligenceRequest, MenuIntelligenceResponse } from '@/lib/menu-intelligence/types'

export default createIntelligenceEndpoint<MenuIntelligenceRequest, MenuIntelligenceResponse>(
  'Menu Intelligence',
  createMenuIntelligenceService
)
