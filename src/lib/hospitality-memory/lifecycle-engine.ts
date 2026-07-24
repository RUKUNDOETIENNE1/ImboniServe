/**
 * Hospitality Memory™ lifecycle and governance transitions.
 */

import type { HospitalityMemoryEntity, HospitalityMemoryStatus, MemoryLifecycleTransition } from './types'

export interface LifecycleInputs {
  contradictionCount: number
  observationCount: number
  confidenceScore: number
  daysSinceLastObserved: number
  wasBusinessRule: boolean
}

function transition(
  memory: HospitalityMemoryEntity,
  to: HospitalityMemoryStatus,
  reason: string,
  observationIds: string[]
): HospitalityMemoryEntity {
  if (memory.status === to) return memory
  const historyEntry: MemoryLifecycleTransition = {
    timestamp: new Date().toISOString(),
    from: memory.status,
    to,
    reason,
    triggeredByObservationIds: observationIds,
  }
  return {
    ...memory,
    status: to,
    updatedAt: new Date().toISOString(),
    provenance: {
      ...memory.provenance,
      lifecycleHistory: [...memory.provenance.lifecycleHistory, historyEntry],
    },
  }
}

export function evolveLifecycle(
  memory: HospitalityMemoryEntity,
  inputs: LifecycleInputs,
  observationIds: string[]
): HospitalityMemoryEntity {
  let current = memory

  if (inputs.contradictionCount >= 3) {
    current = transition(current, 'conflict_review', 'Contradictory evidence threshold reached', observationIds)
    return current
  }

  if (inputs.daysSinceLastObserved > 90 && current.status !== 'retired') {
    current = transition(current, 'archived', 'No reinforcement for > 90 days', observationIds)
    return current
  }

  if (inputs.daysSinceLastObserved > 45 && (current.status === 'confirmed' || current.status === 'business_rule')) {
    current = transition(current, 'historical', 'Pattern became historical due to inactivity', observationIds)
  }

  if (inputs.confidenceScore < 0.45 && (current.status === 'confirmed' || current.status === 'business_rule')) {
    current = transition(current, 'regression', 'Confidence dropped below regression threshold', observationIds)
    return current
  }

  if (current.status === 'regression' && inputs.confidenceScore >= 0.7 && inputs.observationCount >= 4) {
    current = transition(current, 'reconfirmed', 'Evidence recovered after regression', observationIds)
    return current
  }

  if (inputs.observationCount >= 10 && inputs.confidenceScore >= 0.8) {
    current = transition(current, 'business_rule', 'High-confidence repeated pattern', observationIds)
  } else if (inputs.observationCount >= 4 && inputs.confidenceScore >= 0.65) {
    current = transition(current, 'confirmed', 'Pattern confirmed by repeated observations', observationIds)
  } else if (inputs.observationCount >= 2 && inputs.confidenceScore >= 0.5) {
    current = transition(current, 'emerging', 'Emerging pattern threshold reached', observationIds)
  } else {
    current = transition(current, 'observation', 'Single or weak observation', observationIds)
  }

  return current
}
