import type {
  GuardianCaseState,
  GuardianOutcome,
  GuardianCaseType,
  GuardianDecisionLevel,
} from '@prisma/client'

export type {
  GuardianCaseState,
  GuardianOutcome,
  GuardianCaseType,
  GuardianDecisionLevel,
}

export type GuardianMode = 'OFF' | 'SHADOW' | 'ASSIST'

export interface GuardianSignal {
  businessId: string
  promiseId: string
  saleId: string
  signalType: string
  promiseState: string
  elapsedMinutes: number
  orderNumber: string
}

export interface ContextSnapshot {
  orderNumber: string
  orderStatus: string
  kitchenStatus: string | null
  tableNumber: string | null
  elapsedMinutes: number
  warningAfterMinutes: number
  breachAfterMinutes: number
  promiseState: string
  itemsCount: number
  topItems: string[]
  stationName: string | null
  gatheredAt: string
  errors?: string[]
}

export interface DecisionResult {
  level: GuardianDecisionLevel
  reasoning: string
  shouldIntervene: boolean
}

export interface ResponsiblePerson {
  userId: string
  role: string
  name: string
  phone: string | null
  whatsappNumber: string | null
}

export interface InterventionResult {
  success: boolean
  channel: string
  recipient: string | null
  messageContent: string
  error?: string
}

export interface VerificationResult {
  outcome: GuardianOutcome
  notes: string
  promiseState: string
  resolvedAt: Date
}

export interface GuardianCaseWithRelations {
  id: string
  businessId: string
  promiseId: string
  saleId: string
  caseType: GuardianCaseType
  state: GuardianCaseState
  outcome: GuardianOutcome | null
  triggerSignal: string
  triggerState: string
  triggerElapsedMinutes: number
  contextSnapshot: ContextSnapshot | null
  decisionLevel: GuardianDecisionLevel | null
  decisionReasoning: string | null
  decisionAt: Date | null
  assignedUserId: string | null
  assignedRole: string | null
  interventionCount: number
  lastNotifiedAt: Date | null
  lastNotificationChannel: string | null
  verifiedAt: Date | null
  verificationNotes: string | null
  detectedAt: Date
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export const GUARDIAN_NOTIFICATION_DEDUP_MINUTES = 15
export const GUARDIAN_MAX_ACTIVE_CASES = 500
export const GUARDIAN_BATCH_LIMIT = 200
