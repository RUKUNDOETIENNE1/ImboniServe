/**
 * AI Copilot™ - Conversation Service
 * Pure consumer of HIE + IKB - no independent intelligence generation
 */

import type {
  ConversationRequest,
  ConversationResponse,
  Conversation,
  Message,
  PlatformQuery,
  PlatformQueryResult,
  ConversationContext,
  CopilotConfig,
} from './types'
import { DEFAULT_COPILOT_CONFIG } from './types'
import { IntentHandler } from './intent-handler'
import { QueryBuilder } from './query-builder'
import {
  getOrGenerateReport,
  getOperationalEvents,
  queryHistoricalKnowledge,
  buildTimeRange,
} from '@/lib/intelligence/integration-helper'
import type { PipelineContext } from '@/lib/intelligence'

export class AICopilotService {
  private config: CopilotConfig
  private intentHandler: IntentHandler
  private queryBuilder: QueryBuilder
  private conversations: Map<string, Conversation> = new Map()

  constructor(config: Partial<CopilotConfig> = {}) {
    this.config = { ...DEFAULT_COPILOT_CONFIG, ...config }
    this.intentHandler = new IntentHandler()
    this.queryBuilder = new QueryBuilder()
  }

  async processMessage(request: ConversationRequest): Promise<ConversationResponse> {
    try {
      const conversationId = request.conversationId || this.generateConversationId()
      let conversation = this.conversations.get(conversationId)

      if (!conversation) {
        conversation = this.createConversation(conversationId, request)
      }

      const userMessage: Message = {
        id: this.generateMessageId(),
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString(),
      }

      conversation.messages.push(userMessage)

      const intent = await this.intentHandler.detectIntent(request.message, conversation.context)
      userMessage.intent = intent

      const platformQuery: PlatformQuery = {
        intent,
        context: conversation.context,
        filters: {},
        includeHistorical: request.includeHistorical ?? this.config.enableHistoricalContext,
        includeEvidence: request.includeEvidence ?? true,
        includeReplay: request.includeReplay ?? this.config.enableReplayIntegration,
      }

      const queryResult = await this.queryPlatform(platformQuery)

      const assistantMessage: Message = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: queryResult.answer,
        timestamp: new Date().toISOString(),
        confidence: queryResult.confidence,
        evidence: queryResult.evidence,
        replayLinks: queryResult.replayLinks,
        suggestedQuestions: queryResult.suggestedQuestions,
      }

      conversation.messages.push(assistantMessage)
      conversation.lastMessageAt = assistantMessage.timestamp
      this.updateConversationContext(conversation, intent, queryResult)
      this.conversations.set(conversationId, conversation)

      return {
        success: true,
        conversationId,
        message: assistantMessage,
        conversation,
      }
    } catch (error) {
      return {
        success: false,
        conversationId: request.conversationId || '',
        message: {
          id: '',
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
        error: error instanceof Error ? error.message : 'Failed to process message',
      }
    }
  }

  private async queryPlatform(query: PlatformQuery): Promise<PlatformQueryResult> {
    const diagnostics = {
      intentDetectionTime: 0,
      hieQueryTime: 0,
      ikbQueryTime: 0,
      responseGenerationTime: 0,
      totalTime: 0,
      reportsQueried: 0,
      evidenceItemsFound: 0,
      historicalQueriesExecuted: 0,
    }

    const totalStart = Date.now()

    const hieStart = Date.now()
    const intelligenceReports = await this.retrieveIntelligenceReports(query)
    diagnostics.hieQueryTime = Date.now() - hieStart
    diagnostics.reportsQueried = intelligenceReports?.length || 0

    let historicalContext = null
    if (query.includeHistorical) {
      const ikbStart = Date.now()
      historicalContext = await this.retrieveHistoricalContext(query)
      diagnostics.ikbQueryTime = Date.now() - ikbStart
      diagnostics.historicalQueriesExecuted = historicalContext ? 1 : 0
    }

    const responseStart = Date.now()
    const answer = this.generateAnswer(query, intelligenceReports, historicalContext)
    const evidence = this.extractEvidence(intelligenceReports, historicalContext)
    const replayLinks = this.generateReplayLinks(query, intelligenceReports)
    const suggestedQuestions = this.generateSuggestedQuestions(query, intelligenceReports)
    diagnostics.responseGenerationTime = Date.now() - responseStart
    diagnostics.evidenceItemsFound = evidence.length
    diagnostics.totalTime = Date.now() - totalStart

    return {
      success: true,
      answer,
      confidence: 0.85,
      evidence,
      historicalContext,
      replayLinks,
      suggestedQuestions,
      diagnostics,
    }
  }

  private async retrieveIntelligenceReports(query: PlatformQuery): Promise<any[]> {
    try {
      const businessId = query.context.currentRestaurant || query.filters.restaurant?.[0] || ''
      if (!businessId) return []
      
      const timeRange = query.filters.timeRange || buildTimeRange('today')
      const events = await getOperationalEvents({
        businessId,
        timeRange: { start: timeRange.start, end: timeRange.end },
      })
      
      if (events.length === 0) return []
      
      const context: PipelineContext = {
        businessId,
        timeRange: { start: timeRange.start, end: timeRange.end, label: timeRange.label || 'Query Period' },
        timezone: 'Africa/Kigali',
        locale: 'en-RW',
        scope: { scoring: true, problems: true, patterns: true, recommendations: true },
      }
      
      const report = await getOrGenerateReport(
        { businessId, type: 'copilot_query', timeRange: { start: timeRange.start, end: timeRange.end } },
        context,
        events
      )
      
      return report ? [report] : []
    } catch (error) {
      console.error('Failed to retrieve intelligence reports:', error)
      return []
    }
  }

  private async retrieveHistoricalContext(query: PlatformQuery): Promise<any> {
    try {
      const businessId = query.context.currentRestaurant || query.filters.restaurant?.[0] || ''
      if (!businessId) return null
      
      const categories = this.getCategoriesFromIntent(query.intent)
      const knowledge = await queryHistoricalKnowledge(businessId, categories, 100)
      return { knowledge, hasData: knowledge.total > 0 }
    } catch (error) {
      console.error('Failed to retrieve historical context:', error)
      return null
    }
  }
  
  private getCategoriesFromIntent(intent: any): string[] {
    const category = intent.category?.toLowerCase() || ''
    const categories = ['observation', 'pattern']
    if (category.includes('service')) categories.push('service')
    if (category.includes('kitchen')) categories.push('kitchen')
    if (category.includes('menu')) categories.push('menu')
    return categories
  }

  private generateAnswer(query: PlatformQuery, reports: any[], historical: any): string {
    return `Based on platform intelligence, here's what I found regarding your question about ${query.intent.category}.`
  }

  private extractEvidence(reports: any[], historical: any): any[] {
    const evidence: any[] = []
    
    for (const report of reports) {
      if (report.problems) {
        for (const problem of report.problems) {
          evidence.push({
            id: problem.id,
            type: 'problem',
            description: problem.description,
            confidence: problem.rootCause?.confidence || 0.7,
            timestamp: report.metadata?.generatedAt || new Date().toISOString(),
          })
        }
      }
      if (report.highlights) {
        for (const highlight of report.highlights) {
          evidence.push({
            id: highlight.id,
            type: 'highlight',
            description: highlight.description,
            confidence: 0.9,
            timestamp: report.metadata?.generatedAt || new Date().toISOString(),
          })
        }
      }
    }
    
    return evidence
  }

  private generateReplayLinks(query: PlatformQuery, reports: any[]): any[] {
    const links: any[] = []
    
    for (const report of reports) {
      if (report.replayLinks?.problems) {
        for (const [problemId, link] of Object.entries(report.replayLinks.problems)) {
          links.push({
            id: problemId,
            url: link,
            label: 'View in Replay',
            timestamp: report.metadata?.generatedAt || new Date().toISOString(),
          })
        }
      }
    }
    
    return links
  }

  private generateSuggestedQuestions(query: PlatformQuery, reports: any[]): string[] {
    return [
      'Show me the evidence',
      'Compare with yesterday',
      'Open replay',
      'Show historical trend',
    ]
  }

  private createConversation(id: string, request: ConversationRequest): Conversation {
    return {
      id,
      userId: 'user_id',
      businessId: 'business_id',
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messages: [],
      context: {
        recentEntities: [],
        conversationHistory: [],
        ...request.context,
      },
      metadata: {
        totalMessages: 0,
        totalQuestions: 0,
        averageConfidence: 0,
        topicsDiscussed: [],
        evidenceViewed: 0,
        replaysOpened: 0,
      },
    }
  }

  private updateConversationContext(conversation: Conversation, intent: any, result: PlatformQueryResult) {
    conversation.context.conversationHistory.push(intent.type)
    if (conversation.context.conversationHistory.length > this.config.maxContextHistory) {
      conversation.context.conversationHistory.shift()
    }
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) || null
  }

  async exportConversation(conversationId: string, format: 'json' | 'markdown'): Promise<any> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return null

    if (format === 'json') {
      return JSON.stringify(conversation, null, 2)
    }

    return this.formatConversationAsMarkdown(conversation)
  }

  private formatConversationAsMarkdown(conversation: Conversation): string {
    const lines: string[] = []
    lines.push(`# AI Copilot™ Conversation\n`)
    lines.push(`**Started:** ${new Date(conversation.startedAt).toLocaleString()}\n`)
    
    conversation.messages.forEach((msg, i) => {
      lines.push(`## ${msg.role === 'user' ? 'Question' : 'Answer'} ${Math.floor(i / 2) + 1}`)
      lines.push(msg.content)
      if (msg.confidence) {
        lines.push(`\n**Confidence:** ${(msg.confidence * 100).toFixed(0)}%`)
      }
      if (msg.evidence && msg.evidence.length > 0) {
        lines.push(`\n**Evidence:** ${msg.evidence.length} items`)
      }
      lines.push('')
    })

    return lines.join('\n')
  }
}

export function createAICopilotService(config?: Partial<CopilotConfig>): AICopilotService {
  return new AICopilotService(config)
}
