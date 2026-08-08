/**
 * AI Copilot™ - Public API
 */

export { AICopilotService, createAICopilotService } from './service'
export { IntentHandler } from './intent-handler'
export { QueryBuilder } from './query-builder'

export type {
  Conversation,
  Message,
  ConversationContext,
  ConversationMetadata,
  Intent,
  IntentType,
  IntentCategory,
  Entity,
  PlatformQuery,
  PlatformQueryResult,
  EvidenceReference,
  EvidencePanel,
  ReplayLink,
  HistoricalContext,
  SuggestedQuestion,
  DashboardContext,
  SearchQuery,
  SearchFilters,
  SearchResult,
  ExportOptions,
  ExportResult,
  ConversationRequest,
  ConversationResponse,
  EvidenceRequest,
  EvidenceResponse,
  SuggestedQuestionsRequest,
  SuggestedQuestionsResponse,
  ConversationDisplay,
  MessageDisplay,
  EvidencePanelDisplay,
  CopilotConfig,
} from './types'
