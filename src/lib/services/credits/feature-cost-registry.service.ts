/**
 * AI Feature Cost Registry
 * Configurable cost per AI capability — no code changes needed to adjust costs.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'feature-cost-registry' });

export interface FeatureCost {
  featureKey: string;
  featureName: string;
  description: string | null;
  creditsCost: number;
  isDynamic: boolean;
  minCredits: number | null;
  maxCredits: number | null;
  category: string | null;
  isActive: boolean;
}

/** In-memory cache of feature costs, refreshed periodically */
let costCache: Map<string, FeatureCost> | null = null;
let cacheExpiry: Date | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

/** Default feature costs seeded on first access */
const DEFAULT_FEATURE_COSTS: Array<{
  featureKey: string;
  featureName: string;
  description: string;
  creditsCost: number;
  isDynamic: boolean;
  minCredits: number | null;
  maxCredits: number | null;
  category: string;
}> = [
  { featureKey: 'translate_menu', featureName: 'Translate Menu', description: 'Translate menu items to another language', creditsCost: 1, isDynamic: false, minCredits: null, maxCredits: null, category: 'translation' },
  { featureKey: 'menu_description', featureName: 'Generate Description', description: 'AI-generated dish description', creditsCost: 2, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'dish_enhancement', featureName: 'AI Dish Enhancement', description: 'Enhance dish details with AI suggestions', creditsCost: 3, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'supplier_recommendation', featureName: 'Supplier Recommendation', description: 'AI-powered supplier recommendations', creditsCost: 2, isDynamic: false, minCredits: null, maxCredits: null, category: 'analysis' },
  { featureKey: 'inventory_forecast', featureName: 'Inventory Forecast', description: 'Predict inventory needs', creditsCost: 4, isDynamic: false, minCredits: null, maxCredits: null, category: 'analysis' },
  { featureKey: 'marketing_campaign', featureName: 'Marketing Campaign', description: 'Generate marketing campaign content', creditsCost: 15, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'site_builder', featureName: 'Website Builder', description: 'AI website generation', creditsCost: 25, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'scanner', featureName: 'Scan Business', description: 'AI business scanner analysis', creditsCost: 30, isDynamic: false, minCredits: null, maxCredits: null, category: 'analysis' },
  { featureKey: 'tagline', featureName: 'Tagline Generator', description: 'Generate business tagline', creditsCost: 3, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'promo', featureName: 'Promo Text Generator', description: 'Generate promotional text', creditsCost: 3, isDynamic: false, minCredits: null, maxCredits: null, category: 'generation' },
  { featureKey: 'insights', featureName: 'Smart Insights', description: 'AI-powered business insights', creditsCost: 2, isDynamic: false, minCredits: null, maxCredits: null, category: 'analysis' },
  { featureKey: 'copilot', featureName: 'AI Copilot Request', description: 'Hospitality AI Copilot conversation', creditsCost: 1, isDynamic: true, minCredits: 1, maxCredits: 5, category: 'assistant' },
];

/**
 * Seed default feature costs into the database if not present
 */
export async function seedDefaultFeatureCosts(): Promise<void> {
  for (const fc of DEFAULT_FEATURE_COSTS) {
    await prisma.aIFeatureCost.upsert({
      where: { featureKey: fc.featureKey },
      create: fc,
      update: {},
    });
  }
  log.info('Default feature costs seeded', { count: DEFAULT_FEATURE_COSTS.length });
}

/**
 * Get the credit cost for a specific feature
 */
export async function getFeatureCost(featureKey: string): Promise<number> {
  const costs = await getAllFeatureCosts();
  const fc = costs.get(featureKey);

  if (!fc || !fc.isActive) {
    log.warn('Feature cost not found or inactive, using default of 1', { featureKey });
    return 1;
  }

  if (fc.isDynamic) {
    // Dynamic features return their minimum cost;
    // the consumption engine can override with a computed cost
    return fc.minCredits ?? fc.creditsCost;
  }

  return fc.creditsCost;
}

/**
 * Get the full feature cost record for a feature
 */
export async function getFeatureCostRecord(featureKey: string): Promise<FeatureCost | null> {
  const costs = await getAllFeatureCosts();
  return costs.get(featureKey) ?? null;
}

/**
 * Get all active feature costs as a Map
 */
export async function getAllFeatureCosts(): Promise<Map<string, FeatureCost>> {
  if (costCache && cacheExpiry && cacheExpiry > new Date()) {
    return costCache;
  }

  const records = await prisma.aIFeatureCost.findMany({
    where: { isActive: true },
  });

  costCache = new Map<string, FeatureCost>();
  for (const r of records) {
    costCache.set(r.featureKey, {
      featureKey: r.featureKey,
      featureName: r.featureName,
      description: r.description,
      creditsCost: r.creditsCost,
      isDynamic: r.isDynamic,
      minCredits: r.minCredits,
      maxCredits: r.maxCredits,
      category: r.category,
      isActive: r.isActive,
    });
  }
  cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);

  return costCache;
}

/**
 * Update the cost for a feature (admin only)
 */
export async function updateFeatureCost(
  featureKey: string,
  creditsCost: number,
  opts?: { isDynamic?: boolean; minCredits?: number | null; maxCredits?: number | null; isActive?: boolean }
): Promise<void> {
  await prisma.aIFeatureCost.update({
    where: { featureKey },
    data: {
      creditsCost,
      isDynamic: opts?.isDynamic,
      minCredits: opts?.minCredits,
      maxCredits: opts?.maxCredits,
      isActive: opts?.isActive,
    },
  });

  // Invalidate cache
  costCache = null;
  cacheExpiry = null;

  log.info('Feature cost updated', { featureKey, creditsCost, ...opts });
}

/**
 * Create a new feature cost entry (admin only)
 */
export async function createFeatureCost(data: {
  featureKey: string;
  featureName: string;
  description?: string;
  creditsCost: number;
  isDynamic?: boolean;
  minCredits?: number | null;
  maxCredits?: number | null;
  category?: string;
}): Promise<void> {
  await prisma.aIFeatureCost.create({
    data: {
      featureKey: data.featureKey,
      featureName: data.featureName,
      description: data.description,
      creditsCost: data.creditsCost,
      isDynamic: data.isDynamic ?? false,
      minCredits: data.minCredits ?? null,
      maxCredits: data.maxCredits ?? null,
      category: data.category,
    },
  });

  costCache = null;
  cacheExpiry = null;

  log.info('Feature cost created', { featureKey: data.featureKey, creditsCost: data.creditsCost });
}

/**
 * List all feature costs (admin only)
 */
export async function listAllFeatureCosts(): Promise<FeatureCost[]> {
  const records = await prisma.aIFeatureCost.findMany({
    orderBy: { category: 'asc' },
  });

  return records.map(r => ({
    featureKey: r.featureKey,
    featureName: r.featureName,
    description: r.description,
    creditsCost: r.creditsCost,
    isDynamic: r.isDynamic,
    minCredits: r.minCredits,
    maxCredits: r.maxCredits,
    category: r.category,
    isActive: r.isActive,
  }));
}
