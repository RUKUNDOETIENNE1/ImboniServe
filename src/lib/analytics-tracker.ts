/**
 * Analytics Event Tracker
 * Lightweight utility for tracking menu interactions and customer behavior
 */

import { prisma } from '@/lib/prisma';

export interface TrackEventParams {
  businessId?: string;
  sessionId?: string;
  customerId?: string;
  type: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track an analytics event (async, non-blocking)
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        businessId: params.businessId,
        sessionId: params.sessionId,
        customerId: params.customerId,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    // Silent fail - don't break user experience for analytics
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track menu item view
 */
export function trackMenuItemView(params: {
  businessId: string;
  menuItemId: string;
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'view_item',
    entityType: 'MenuItem',
    entityId: params.menuItemId,
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(params: {
  businessId: string;
  menuItemId: string;
  quantity: number;
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'add_to_cart',
    entityType: 'MenuItem',
    entityId: params.menuItemId,
    metadata: { quantity: params.quantity },
  });
}

/**
 * Track AI question asked
 */
export function trackAIQuestion(params: {
  businessId: string;
  menuItemId: string;
  question: string;
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'ai_question',
    entityType: 'MenuItem',
    entityId: params.menuItemId,
    metadata: { question: params.question },
  });
}

/**
 * Track recommendation shown
 */
export function trackRecommendationShown(params: {
  businessId: string;
  menuItemIds: string[];
  context: string;
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'recommendation_shown',
    metadata: { menuItemIds: params.menuItemIds, context: params.context },
  });
}

/**
 * Track recommendation clicked
 */
export function trackRecommendationClicked(params: {
  businessId: string;
  menuItemId: string;
  context: string;
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'recommendation_clicked',
    entityType: 'MenuItem',
    entityId: params.menuItemId,
    metadata: { context: params.context },
  });
}

/**
 * Track item filtered out due to preferences
 */
export function trackItemFiltered(params: {
  businessId: string;
  menuItemId: string;
  reason: string;
  allergens?: string[];
  sessionId?: string;
  customerId?: string;
}) {
  return trackEvent({
    ...params,
    type: 'item_filtered',
    entityType: 'MenuItem',
    entityId: params.menuItemId,
    metadata: { reason: params.reason, allergens: params.allergens },
  });
}
