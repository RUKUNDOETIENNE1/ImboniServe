/**
 * AI Credit Policy Engine
 * Data-driven policies for credit management — no hard-coded rules.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'credit-policy' });

export interface CreditPolicy {
  policyKey: string;
  policyName: string;
  description: string | null;
  value: string;
  dataType: 'string' | 'int' | 'boolean' | 'json';
  appliesTo: string;
  isActive: boolean;
}

/** Default policies seeded on first access */
const DEFAULT_POLICIES: Array<{
  policyKey: string;
  policyName: string;
  description: string;
  value: string;
  dataType: 'string' | 'int' | 'boolean' | 'json';
  appliesTo: string;
}> = [
  {
    policyKey: 'max_balance',
    policyName: 'Maximum Wallet Balance',
    description: 'Maximum credits a wallet can hold. 0 = unlimited.',
    value: '0',
    dataType: 'int',
    appliesTo: 'all',
  },
  {
    policyKey: 'credit_expiry_days',
    policyName: 'Credit Expiry (Days)',
    description: 'Days until unused purchased credits expire. 0 = never expire.',
    value: '0',
    dataType: 'int',
    appliesTo: 'all',
  },
  {
    policyKey: 'reservation_timeout_seconds',
    policyName: 'Reservation Timeout (Seconds)',
    description: 'How long a credit reservation can stay pending before auto-release.',
    value: '300',
    dataType: 'int',
    appliesTo: 'all',
  },
  {
    policyKey: 'low_credit_threshold',
    policyName: 'Low Credit Warning Threshold',
    description: 'Warn user when available credits fall below this percentage of monthly allocation.',
    value: '20',
    dataType: 'int',
    appliesTo: 'all',
  },
  {
    policyKey: 'free_trial_credits',
    policyName: 'Free Trial Credits',
    description: 'Credits granted to businesses on free trial.',
    value: '10',
    dataType: 'int',
    appliesTo: 'plan:FREE',
  },
  {
    policyKey: 'enterprise_custom_allocation',
    policyName: 'Enterprise Custom Allocation',
    description: 'Custom monthly allocation for enterprise customers. Set per business by admin.',
    value: '0',
    dataType: 'int',
    appliesTo: 'plan:ENTERPRISE',
  },
  {
    policyKey: 'bonus_campaign_active',
    policyName: 'Bonus Campaign Active',
    description: 'Whether a promotional bonus campaign is currently active.',
    value: 'false',
    dataType: 'boolean',
    appliesTo: 'all',
  },
  {
    policyKey: 'feature_restrictions',
    policyName: 'Feature Restrictions',
    description: 'JSON map of featureKey → plan codes that can access it. Empty = all plans.',
    value: '{}',
    dataType: 'json',
    appliesTo: 'all',
  },
];

let policyCache: Map<string, CreditPolicy> | null = null;
let cacheExpiry: Date | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Seed default policies into the database
 */
export async function seedDefaultPolicies(): Promise<void> {
  for (const p of DEFAULT_POLICIES) {
    await prisma.aICreditPolicy.upsert({
      where: { policyKey: p.policyKey },
      create: p,
      update: {},
    });
  }
  log.info('Default policies seeded', { count: DEFAULT_POLICIES.length });
}

/**
 * Get a policy value, checking plan-specific overrides first, then 'all'.
 */
export async function getPolicyValue(policyKey: string, planCode?: string): Promise<string | null> {
  const policies = await getAllPolicies();

  // Try plan-specific first
  if (planCode) {
    const planSpecific = policies.get(`${policyKey}:plan:${planCode}`);
    if (planSpecific && planSpecific.isActive) {
      return planSpecific.value;
    }
  }

  // Fall back to 'all'
  const general = policies.get(policyKey);
  if (general && general.isActive) {
    return general.value;
  }

  return null;
}

/**
 * Get a policy as an integer
 */
export async function getPolicyInt(policyKey: string, planCode?: string): Promise<number> {
  const value = await getPolicyValue(policyKey, planCode);
  return value ? parseInt(value, 10) : 0;
}

/**
 * Get a policy as a boolean
 */
export async function getPolicyBool(policyKey: string, planCode?: string): Promise<boolean> {
  const value = await getPolicyValue(policyKey, planCode);
  return value === 'true' || value === '1';
}

/**
 * Get a policy as parsed JSON
 */
export async function getPolicyJson(policyKey: string, planCode?: string): Promise<any> {
  const value = await getPolicyValue(policyKey, planCode);
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    log.warn('Failed to parse policy JSON', { policyKey, value });
    return {};
  }
}

/**
 * Check if a feature is restricted for a given plan
 */
export async function isFeatureAllowed(featureKey: string, planCode: string): Promise<boolean> {
  const restrictions = await getPolicyJson('feature_restrictions', planCode);
  const allowedPlans = restrictions[featureKey];
  if (!allowedPlans || !Array.isArray(allowedPlans) || allowedPlans.length === 0) {
    return true; // No restriction = allowed for all
  }
  return allowedPlans.includes(planCode);
}

/**
 * Get all policies as a Map (keyed by policyKey, with plan-specific variants as "key:plan:CODE")
 */
export async function getAllPolicies(): Promise<Map<string, CreditPolicy>> {
  if (policyCache && cacheExpiry && cacheExpiry > new Date()) {
    return policyCache;
  }

  const records = await prisma.aICreditPolicy.findMany({
    where: { isActive: true },
  });

  policyCache = new Map<string, CreditPolicy>();
  for (const r of records) {
    const base: CreditPolicy = {
      policyKey: r.policyKey,
      policyName: r.policyName,
      description: r.description,
      value: r.value,
      dataType: r.dataType as any,
      appliesTo: r.appliesTo,
      isActive: r.isActive,
    };
    policyCache.set(r.policyKey, base);
    // Also store with plan prefix for plan-specific lookups
    if (r.appliesTo.startsWith('plan:')) {
      policyCache.set(`${r.policyKey}:${r.appliesTo}`, base);
    }
  }
  cacheExpiry = new Date(Date.now() + CACHE_TTL_MS);

  return policyCache;
}

/**
 * Update a policy value (admin only)
 */
export async function updatePolicy(
  policyKey: string,
  value: string,
  opts?: { isActive?: boolean }
): Promise<void> {
  await prisma.aICreditPolicy.update({
    where: { policyKey },
    data: {
      value,
      isActive: opts?.isActive,
    },
  });

  policyCache = null;
  cacheExpiry = null;

  log.info('Policy updated', { policyKey, value });
}

/**
 * Create a new policy (admin only)
 */
export async function createPolicy(data: {
  policyKey: string;
  policyName: string;
  description?: string;
  value: string;
  dataType?: 'string' | 'int' | 'boolean' | 'json';
  appliesTo?: string;
}): Promise<void> {
  await prisma.aICreditPolicy.create({
    data: {
      policyKey: data.policyKey,
      policyName: data.policyName,
      description: data.description,
      value: data.value,
      dataType: data.dataType ?? 'string',
      appliesTo: data.appliesTo ?? 'all',
    },
  });

  policyCache = null;
  cacheExpiry = null;

  log.info('Policy created', { policyKey: data.policyKey });
}

/**
 * List all policies (admin only)
 */
export async function listAllPolicies(): Promise<CreditPolicy[]> {
  const records = await prisma.aICreditPolicy.findMany({
    orderBy: { policyKey: 'asc' },
  });

  return records.map(r => ({
    policyKey: r.policyKey,
    policyName: r.policyName,
    description: r.description,
    value: r.value,
    dataType: r.dataType as any,
    appliesTo: r.appliesTo,
    isActive: r.isActive,
  }));
}
