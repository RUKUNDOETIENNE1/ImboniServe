/**
 * AI Copilot™ - Intent Handler
 * Detects user intent from natural language questions
 */

import type { Intent, IntentType, IntentCategory, Entity, ConversationContext } from './types'

export class IntentHandler {
  async detectIntent(message: string, context: ConversationContext): Promise<Intent> {
    const lowerMessage = message.toLowerCase()

    const type = this.detectIntentType(lowerMessage)
    const category = this.detectCategory(lowerMessage, context)
    const entities = this.extractEntities(lowerMessage, context)
    const confidence = 0.85

    return {
      type,
      category,
      entities,
      confidence,
    }
  }

  private detectIntentType(message: string): IntentType {
    if (message.includes('why') || message.includes('explain')) return 'explanation'
    if (message.includes('compare') || message.includes('vs') || message.includes('versus')) return 'comparison'
    if (message.includes('history') || message.includes('before') || message.includes('trend')) return 'historical'
    if (message.includes('evidence') || message.includes('proof') || message.includes('show me')) return 'evidence_request'
    if (message.includes('replay') || message.includes('watch') || message.includes('see')) return 'replay_request'
    if (message.includes('search') || message.includes('find')) return 'search'
    return 'question'
  }

  private detectCategory(message: string, context: ConversationContext): IntentCategory {
    if (message.includes('kitchen') || message.includes('prep') || message.includes('cook')) return 'kitchen'
    if (message.includes('menu') || message.includes('dish') || message.includes('food')) return 'menu'
    if (message.includes('waiter') || message.includes('server') || message.includes('staff')) return 'staff'
    if (message.includes('service') || message.includes('table') || message.includes('customer')) return 'service'
    if (message.includes('restaurant') || message.includes('location') || message.includes('portfolio')) return 'portfolio'
    if (message.includes('history') || message.includes('trend') || message.includes('past')) return 'historical'
    return 'operations'
  }

  private extractEntities(message: string, context: ConversationContext): Entity[] {
    const entities: Entity[] = []

    if (message.includes('today')) {
      entities.push({ type: 'date', value: 'today', confidence: 0.95 })
    } else if (message.includes('yesterday')) {
      entities.push({ type: 'date', value: 'yesterday', confidence: 0.95 })
    } else if (message.includes('this week')) {
      entities.push({ type: 'period', value: 'this_week', confidence: 0.95 })
    }

    if (message.includes('lunch')) {
      entities.push({ type: 'period', value: 'lunch', confidence: 0.9 })
    } else if (message.includes('dinner')) {
      entities.push({ type: 'period', value: 'dinner', confidence: 0.9 })
    }

    if (context.currentRestaurant) {
      entities.push({ type: 'restaurant', value: context.currentRestaurant, confidence: 0.8 })
    }

    return entities
  }
}
