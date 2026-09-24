/**
 * AI Copilot™ - Type Definitions
 * 
 * Sixth and final intelligence consumer on the Hospitality Intelligence Platform
 * Pure consumer of HIE + IKB - conversational interface for platform intelligence
 */

// ═════════════════════════════════════════════════════════════════════════════
// Conversation Types
// ═════════════════════════════════════════════════════════════════════════════

export interface Conversation {
  id: string
  userId: string
  businessId: string
  organizationId?: string
  startedAt: string
  lastMessageAt: string
  messages: Message[]
  context: ConversationContext
  metadata: ConversationMetadata
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: Intent
  evidence?: EvidenceReference[]
  replayLinks?: ReplayLink[]
  suggestedQuestions?: string[]
  confidence?: number
  metadata?: Record<string, any>
}

export interface ConversationContext {
  currentRestaurant?: string
  currentDate?: string
  currentPeriod?: string
  recentEntities: string[]
  conversationHistory: string[]
}

export interface ConversationMetadata {
  totalMessages: number
  totalQuestions: number
  averageConfidence: number
  topicsDiscussed: string[]
  evidenceViewed: number
  replaysOpened: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Intent Detection
// ═════════════════════════════════════════════════════════════════════════════

export interface Intent {
  type: IntentType
  category: IntentCategory
  entities: Entity[]
  timeframe?: Timeframe
  comparison?: Comparison
  confidence: number
}

export type IntentType =
  | 'question'
  | 'explanation'
  | 'comparison'
  | 'historical'
  | 'evidence_request'
  | 'replay_request'
  | 'search'
  | 'filter'

export type IntentCategory =
  | 'service'
  | 'kitchen'
  | 'menu'
  | 'staff'
  | 'operations'
  | 'portfolio'
  | 'historical'
  | 'general'

export interface Entity {
  type: EntityType
  value: string
  confidence: number
}

export type EntityType =
  | 'restaurant'
  | 'date'
  | 'time'
  | 'period'
  | 'dish'
  | 'staff'
  | 'station'
  | 'metric'
  | 'location'

export interface Timeframe {
  type: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  startTime?: string
  endTime?: string
  label: string
}

export interface Comparison {
  type: 'temporal' | 'spatial' | 'entity'
  baseline: string
  target: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Platform Query
// ═════════════════════════════════════════════════════════════════════════════

export interface PlatformQuery {
  intent: Intent
  context: ConversationContext
  filters: QueryFilters
  includeHistorical: boolean
  includeEvidence: boolean
  includeReplay: boolean
}

export interface QueryFilters {
  restaurant?: string[]
  date?: string
  period?: string
  category?: string[]
  confidence?: number
  severity?: string[]
}

export interface PlatformQueryResult {
  success: boolean
  answer: string
  confidence: number
  evidence: EvidenceReference[]
  historicalContext?: HistoricalContext
  replayLinks: ReplayLink[]
  suggestedQuestions: string[]
  diagnostics: QueryDiagnostics
  error?: string
}

export interface QueryDiagnostics {
  intentDetectionTime: number
  hieQueryTime: number
  ikbQueryTime: number
  responseGenerationTime: number
  totalTime: number
  reportsQueried: number
  evidenceItemsFound: number
  historicalQueriesExecuted: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Evidence
// ═════════════════════════════════════════════════════════════════════════════

export interface EvidenceReference {
  id: string
  type: 'report' | 'observation' | 'measurement' | 'pattern' | 'event'
  source: EvidenceSource
  description: string
  timestamp: string
  confidence: number
  relatedEntities: string[]
  replayLink?: string
  metadata: Record<string, any>
}

export type EvidenceSource =
  | 'service_intelligence'
  | 'daily_briefings'
  | 'kitchen_intelligence'
  | 'menu_intelligence'
  | 'multi_location_intelligence'
  | 'historical_knowledge'

export interface EvidencePanel {
  evidenceItems: EvidenceReference[]
  totalCount: number
  confidence: number
  relatedReports: string[]
  relatedEvents: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Replay Integration
// ═════════════════════════════════════════════════════════════════════════════

export interface ReplayLink {
  id: string
  label: string
  url: string
  timestamp: string
  context: string
  description: string
  relevance: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Historical Context
// ═════════════════════════════════════════════════════════════════════════════

export interface HistoricalContext {
  hasPrecedent: boolean
  frequency: 'first_time' | 'rare' | 'occasional' | 'frequent'
  lastOccurrence?: string
  trend: 'improving' | 'stable' | 'declining'
  similarSituations: HistoricalSituation[]
  confidence: number
}

export interface HistoricalSituation {
  date: string
  description: string
  outcome: string
  similarity: number
  replayLink?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Suggested Questions
// ═════════════════════════════════════════════════════════════════════════════

export interface SuggestedQuestion {
  question: string
  category: IntentCategory
  relevance: number
  intent: Intent
}

// ═════════════════════════════════════════════════════════════════════════════
// Dashboard Integration
// ═════════════════════════════════════════════════════════════════════════════

export interface DashboardContext {
  dashboard: 'service' | 'daily' | 'kitchen' | 'menu' | 'portfolio'
  itemId?: string
  itemType?: string
  question?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Search & Filters
// ═════════════════════════════════════════════════════════════════════════════

export interface SearchQuery {
  query: string
  filters: SearchFilters
  limit?: number
}

export interface SearchFilters {
  restaurant?: string[]
  date?: string
  category?: IntentCategory[]
  confidence?: number
  source?: EvidenceSource[]
}

export interface SearchResult {
  conversations: Conversation[]
  evidence: EvidenceReference[]
  replayMoments: ReplayLink[]
  totalResults: number
}

// ═════════════════════════════════════════════════════════════════════════════
// Export
// ═════════════════════════════════════════════════════════════════════════════

export interface ExportOptions {
  conversationId: string
  format: 'markdown' | 'json' | 'pdf'
  includeEvidence?: boolean
  includeReplayLinks?: boolean
  includeTimestamps?: boolean
}

export interface ExportResult {
  success: boolean
  data?: string
  filename?: string
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// API Request/Response
// ═════════════════════════════════════════════════════════════════════════════

export interface ConversationRequest {
  conversationId?: string
  message: string
  context?: Partial<ConversationContext>
  includeEvidence?: boolean
  includeHistorical?: boolean
  includeReplay?: boolean
}

export interface ConversationResponse {
  success: boolean
  conversationId: string
  message: Message
  conversation?: Conversation
  error?: string
}

export interface EvidenceRequest {
  evidenceIds: string[]
  conversationId?: string
}

export interface EvidenceResponse {
  success: boolean
  evidence: EvidenceReference[]
  panel?: EvidencePanel
  error?: string
}

export interface SuggestedQuestionsRequest {
  conversationId: string
  context?: ConversationContext
  limit?: number
}

export interface SuggestedQuestionsResponse {
  success: boolean
  questions: SuggestedQuestion[]
  error?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// Display Models
// ═════════════════════════════════════════════════════════════════════════════

export interface ConversationDisplay {
  conversation: Conversation
  messages: MessageDisplay[]
  suggestedQuestions: string[]
  canExport: boolean
}

export interface MessageDisplay {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  formattedTime: string
  confidence?: number
  confidenceColor?: string
  evidenceCount: number
  replayCount: number
  hasHistoricalContext: boolean
  suggestedQuestions: string[]
}

export interface EvidencePanelDisplay {
  open: boolean
  evidence: EvidenceReference[]
  totalCount: number
  confidence: number
  confidenceColor: string
  relatedReports: string[]
  relatedEvents: string[]
}

// ═════════════════════════════════════════════════════════════════════════════
// Service Configuration
// ═════════════════════════════════════════════════════════════════════════════

export interface CopilotConfig {
  maxConversationLength: number
  maxContextHistory: number
  defaultConfidenceThreshold: number
  enableHistoricalContext: boolean
  enableReplayIntegration: boolean
  enableSuggestedQuestions: boolean
  maxSuggestedQuestions: number
}

export const DEFAULT_COPILOT_CONFIG: CopilotConfig = {
  maxConversationLength: 50,
  maxContextHistory: 10,
  defaultConfidenceThreshold: 0.7,
  enableHistoricalContext: true,
  enableReplayIntegration: true,
  enableSuggestedQuestions: true,
  maxSuggestedQuestions: 5,
}
