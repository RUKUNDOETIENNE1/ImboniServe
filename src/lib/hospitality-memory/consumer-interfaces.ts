/**
 * Stable consumer interfaces for Hospitality Memory™.
 */

import { createHospitalityMemoryService } from './service'
import type { HospitalityMemoryEntity } from './types'

export async function getMemoriesForDailyBriefings(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'daily-briefings')
}

export async function getMemoriesForServiceIntelligence(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'service-intelligence')
}

export async function getMemoriesForKitchenIntelligence(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'kitchen-intelligence')
}

export async function getMemoriesForMenuIntelligence(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'menu-intelligence')
}

export async function getMemoriesForHospitalityKnowledge(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'hospitality-knowledge')
}

export async function getMemoriesForHospitalityAICopilot(businessId: string): Promise<HospitalityMemoryEntity[]> {
  return createHospitalityMemoryService().getConsumerMemories(businessId, 'hospitality-ai-copilot')
}
