/**
 * AI Copilot™ - Service Layer Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AICopilotService } from '../service'
import type { ConversationRequest } from '../types'

describe('AICopilotService', () => {
  let service: AICopilotService

  beforeEach(() => {
    service = new AICopilotService()
  })

  describe('processMessage', () => {
    it('should process a simple question', async () => {
      const request: ConversationRequest = {
        message: 'Why was lunch slow today?',
        includeEvidence: true,
        includeHistorical: true,
        includeReplay: true,
      }

      const response = await service.processMessage(request)

      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(response.conversationId).toBeDefined()
      expect(response.message).toBeDefined()
      expect(response.message.role).toBe('assistant')
    })

    it('should maintain conversation context', async () => {
      const request1: ConversationRequest = {
        message: 'Show me today\'s lunch performance',
      }

      const response1 = await service.processMessage(request1)
      expect(response1.success).toBe(true)

      const request2: ConversationRequest = {
        conversationId: response1.conversationId,
        message: 'Why was it slow?',
      }

      const response2 = await service.processMessage(request2)
      expect(response2.success).toBe(true)
      expect(response2.conversationId).toBe(response1.conversationId)
    })

    it('should include evidence in responses', async () => {
      const request: ConversationRequest = {
        message: 'What caused the kitchen bottleneck?',
        includeEvidence: true,
      }

      const response = await service.processMessage(request)

      expect(response.success).toBe(true)
      expect(response.message.evidence).toBeDefined()
    })

    it('should provide suggested questions', async () => {
      const request: ConversationRequest = {
        message: 'How is Restaurant A performing?',
      }

      const response = await service.processMessage(request)

      expect(response.success).toBe(true)
      expect(response.message.suggestedQuestions).toBeDefined()
      expect(response.message.suggestedQuestions!.length).toBeGreaterThan(0)
    })
  })

  describe('getConversation', () => {
    it('should retrieve existing conversation', async () => {
      const request: ConversationRequest = {
        message: 'Test question',
      }

      const response = await service.processMessage(request)
      const conversation = await service.getConversation(response.conversationId)

      expect(conversation).toBeDefined()
      expect(conversation?.id).toBe(response.conversationId)
    })

    it('should return null for non-existent conversation', async () => {
      const conversation = await service.getConversation('non_existent_id')

      expect(conversation).toBeNull()
    })
  })

  describe('exportConversation', () => {
    it('should export conversation as JSON', async () => {
      const request: ConversationRequest = {
        message: 'Test question',
      }

      const response = await service.processMessage(request)
      const exported = await service.exportConversation(response.conversationId, 'json')

      expect(exported).toBeDefined()
      expect(typeof exported).toBe('string')
    })

    it('should export conversation as Markdown', async () => {
      const request: ConversationRequest = {
        message: 'Test question',
      }

      const response = await service.processMessage(request)
      const exported = await service.exportConversation(response.conversationId, 'markdown')

      expect(exported).toBeDefined()
      expect(typeof exported).toBe('string')
      expect(exported).toContain('# AI Copilot™ Conversation')
    })
  })
})
