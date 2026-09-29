/**
 * Analytics Insights Service
 * Generates actionable insights from analytics data
 */

import { prisma } from '@/lib/prisma';

export class AnalyticsInsightsService {
  /**
   * Get menu performance insights with actionable recommendations
   */
  static async getMenuInsights(businessId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get menu items with view and order data
    const menuItems = await prisma.menuItem.findMany({
      where: { businessId, isAvailable: true },
      select: {
        id: true,
        name: true,
        priceCents: true,
        category: true,
        allergens: true,
        dietaryTags: true,
      },
    });

    // Get view events
    const viewEvents = await prisma.eventLog.findMany({
      where: {
        businessId,
        type: 'view_item',
        createdAt: { gte: since },
      },
      select: { entityId: true },
    });

    // Get add to cart events
    const cartEvents = await prisma.eventLog.findMany({
      where: {
        businessId,
        type: 'add_to_cart',
        createdAt: { gte: since },
      },
      select: { entityId: true },
    });

    // Get filtered events
    const filteredEvents = await prisma.eventLog.findMany({
      where: {
        businessId,
        type: 'item_filtered',
        createdAt: { gte: since },
      },
      select: { entityId: true, metadata: true },
    });

    // Get sales data
    const salesData = await prisma.saleItem.findMany({
      where: {
        sale: {
          businessId,
          createdAt: { gte: since },
          isPaid: true, // Sale.isPaid boolean field
        },
      },
      select: {
        menuItemId: true,
        quantity: true,
        totalPriceCents: true,
      },
    });

    // Aggregate data by menu item
    const itemStats = new Map<string, any>();

    menuItems.forEach(item => {
      itemStats.set(item.id, {
        id: item.id,
        name: item.name,
        category: item.category,
        priceCents: item.priceCents,
        allergens: item.allergens || [],
        dietaryTags: item.dietaryTags || [],
        views: 0,
        addedToCart: 0,
        ordered: 0,
        revenue: 0,
        filteredCount: 0,
        filteredReasons: [] as string[],
      });
    });

    // Count views
    viewEvents.forEach(event => {
      const stat = itemStats.get(event.entityId || '');
      if (stat) stat.views++;
    });

    // Count cart additions
    cartEvents.forEach(event => {
      const stat = itemStats.get(event.entityId || '');
      if (stat) stat.addedToCart++;
    });

    // Count filtered
    filteredEvents.forEach(event => {
      const stat = itemStats.get(event.entityId || '');
      if (stat) {
        stat.filteredCount++;
        const reason = (event.metadata as any)?.reason;
        if (reason && !stat.filteredReasons.includes(reason)) {
          stat.filteredReasons.push(reason);
        }
      }
    });

    // Count orders and revenue
    salesData.forEach(item => {
      const stat = itemStats.get(item.menuItemId);
      if (stat) {
        stat.ordered += item.quantity;
        stat.revenue += item.totalPriceCents;
      }
    });

    const items = Array.from(itemStats.values());

    // Generate insights
    const insights: any[] = [];

    // High interest, low conversion
    items.forEach(item => {
      if (item.views > 10 && item.addedToCart < item.views * 0.1) {
        insights.push({
          type: 'low_conversion',
          severity: 'medium',
          itemId: item.id,
          itemName: item.name,
          message: `"${item.name}" is viewed often (${item.views} times) but rarely added to cart (${item.addedToCart} times). Consider improving the description, adding photos, or adjusting the price.`,
          metrics: { views: item.views, addedToCart: item.addedToCart, conversionRate: ((item.addedToCart / item.views) * 100).toFixed(1) + '%' },
        });
      }
    });

    // Cart abandonment
    items.forEach(item => {
      if (item.addedToCart > 5 && item.ordered < item.addedToCart * 0.3) {
        insights.push({
          type: 'cart_abandonment',
          severity: 'high',
          itemId: item.id,
          itemName: item.name,
          message: `"${item.name}" is added to cart (${item.addedToCart} times) but rarely ordered (${item.ordered} times). Customers may be finding better alternatives or reconsidering the price.`,
          metrics: { addedToCart: item.addedToCart, ordered: item.ordered, orderRate: ((item.ordered / item.addedToCart) * 100).toFixed(1) + '%' },
        });
      }
    });

    // Frequently filtered items
    items.forEach(item => {
      if (item.filteredCount > 5) {
        insights.push({
          type: 'frequently_filtered',
          severity: 'medium',
          itemId: item.id,
          itemName: item.name,
          message: `"${item.name}" is frequently filtered out (${item.filteredCount} times) due to dietary restrictions: ${item.filteredReasons.join(', ')}. Consider offering alternatives or clearly marking allergens.`,
          metrics: { filteredCount: item.filteredCount, reasons: item.filteredReasons },
        });
      }
    });

    // Low performers
    items.forEach(item => {
      if (item.views > 0 && item.ordered === 0) {
        insights.push({
          type: 'zero_orders',
          severity: 'low',
          itemId: item.id,
          itemName: item.name,
          message: `"${item.name}" has been viewed ${item.views} times but never ordered. Consider removing it or making it more appealing.`,
          metrics: { views: item.views, ordered: 0 },
        });
      }
    });

    // Top performers
    const topItems = items
      .filter(i => i.ordered > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Bottom performers
    const bottomItems = items
      .filter(i => i.views > 5)
      .sort((a, b) => a.ordered - b.ordered)
      .slice(0, 5);

    return {
      insights: insights.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 3) - (severityOrder[b.severity as keyof typeof severityOrder] || 3);
      }),
      topPerformers: topItems,
      bottomPerformers: bottomItems,
      summary: {
        totalItems: items.length,
        itemsWithViews: items.filter(i => i.views > 0).length,
        itemsWithOrders: items.filter(i => i.ordered > 0).length,
        avgConversionRate: items.filter(i => i.views > 0).reduce((sum, i) => sum + (i.ordered / i.views), 0) / items.filter(i => i.views > 0).length,
      },
    };
  }

  /**
   * Get allergen impact insights
   */
  static async getAllergenInsights(businessId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filteredEvents = await prisma.eventLog.findMany({
      where: {
        businessId,
        type: 'item_filtered',
        createdAt: { gte: since },
      },
      select: { metadata: true },
    });

    const allergenCounts: Record<string, number> = {};

    filteredEvents.forEach(event => {
      const allergens = (event.metadata as any)?.allergens || [];
      allergens.forEach((allergen: string) => {
        allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
      });
    });

    const topAllergens = Object.entries(allergenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([allergen, count]) => ({ allergen, count }));

    const insights: any[] = [];

    topAllergens.forEach(({ allergen, count }) => {
      if (count > 10) {
        insights.push({
          type: 'allergen_impact',
          severity: 'medium',
          allergen,
          message: `${count} customers have filtered out items containing "${allergen}". Consider offering allergen-free alternatives to capture this market.`,
          metrics: { filteredCount: count },
        });
      }
    });

    return {
      topAllergens,
      insights,
      totalFiltered: filteredEvents.length,
    };
  }

  /**
   * Get AI assistant usage insights
   */
  static async getAIUsageInsights(businessId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const aiEvents = await prisma.eventLog.findMany({
      where: {
        businessId,
        type: 'ai_question',
        createdAt: { gte: since },
      },
      select: { metadata: true, entityId: true },
    });

    const questionsByItem: Record<string, number> = {};
    const questionKeywords: Record<string, number> = {};

    aiEvents.forEach(event => {
      const itemId = event.entityId || 'unknown';
      questionsByItem[itemId] = (questionsByItem[itemId] || 0) + 1;

      const question = ((event.metadata as any)?.question || '').toLowerCase();
      ['spicy', 'vegetarian', 'vegan', 'gluten', 'allergen', 'portion', 'size'].forEach(keyword => {
        if (question.includes(keyword)) {
          questionKeywords[keyword] = (questionKeywords[keyword] || 0) + 1;
        }
      });
    });

    const topQuestionedItems = Object.entries(questionsByItem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topKeywords = Object.entries(questionKeywords)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      totalQuestions: aiEvents.length,
      topQuestionedItems,
      topKeywords,
      avgQuestionsPerDay: aiEvents.length / days,
    };
  }
}
