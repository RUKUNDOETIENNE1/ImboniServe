import { businessReasoning } from '@/lib/die/business-intelligence/reasoning-engine'
import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

// Thin facade to avoid circular imports between correlation-engine and reasoning-engine
export async function generateBusinessInsights(): Promise<BusinessInsight[]> {
  return businessReasoning.generateInsights()
}
