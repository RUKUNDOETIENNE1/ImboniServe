/**
 * AI Copilot™ - Query Builder
 * Builds platform queries from detected intents
 */

import type { Intent, PlatformQuery, ConversationContext } from './types'

export class QueryBuilder {
  buildQuery(intent: Intent, context: ConversationContext): PlatformQuery {
    return {
      intent,
      context,
      filters: this.buildFilters(intent, context),
      includeHistorical: intent.type === 'historical' || intent.type === 'comparison',
      includeEvidence: true,
      includeReplay: true,
    }
  }

  private buildFilters(intent: Intent, context: ConversationContext): any {
    const filters: any = {}

    const restaurantEntity = intent.entities.find(e => e.type === 'restaurant')
    if (restaurantEntity) {
      filters.restaurant = [restaurantEntity.value]
    } else if (context.currentRestaurant) {
      filters.restaurant = [context.currentRestaurant]
    }

    const dateEntity = intent.entities.find(e => e.type === 'date')
    if (dateEntity) {
      filters.date = dateEntity.value
    }

    const periodEntity = intent.entities.find(e => e.type === 'period')
    if (periodEntity) {
      filters.period = periodEntity.value
    }

    filters.category = [intent.category]

    return filters
  }
}
