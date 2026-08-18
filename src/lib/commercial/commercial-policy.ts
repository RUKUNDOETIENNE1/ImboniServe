/**
 * COMMERCIAL POLICY LAYER
 * 
 * Single Source of Commercial Truth
 * 
 * This module is the ONLY place where commercial decisions are made.
 * All entitlement checks, subscription validation, and feature access
 * decisions MUST flow through this centralized policy layer.
 * 
 * DO NOT implement subscription checks independently in API routes.
 * DO NOT duplicate commercial logic across the application.
 * 
 * If commercial policy changes, update this file—not fifty files.
 * 
 * Constitutional Authority: Commercial Constitution v1.1
 * Milestone: 2 (Commercial Enforcement - Backend)
 */

import { getPlanEntitlements, hasFeatureAccess, type PlanCode, type PlanEntitlements } from '@/lib/plan-entitlements'

/**
 * Subscription status from database
 */
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE'

/**
 * Commercial context for a request
 * Contains all information needed to make commercial decisions
 */
export interface CommercialContext {
  planCode: PlanCode
  subscriptionStatus: SubscriptionStatus
  trialEndDate: Date | null
  subscriptionEndDate: Date | null
  isAdmin: boolean
}

/**
 * Result of a commercial policy check
 */
export interface PolicyCheckResult {
  allowed: boolean
  reason?: string
  upgradePlan?: PlanCode
  requiresUpgrade: boolean
}

/**
 * CORE COMMERCIAL POLICY FUNCTIONS
 */

/**
 * Determine effective plan code for entitlement checks
 * 
 * Constitutional Authority: Section 8 (Guided Professional Trial)
 * - Trial users receive Professional entitlements
 * - Active subscribers receive their plan's entitlements
 * - Expired subscribers receive no entitlements
 */
export function getEffectivePlanCode(context: CommercialContext): PlanCode | null {
  // Admin users bypass commercial restrictions (for support purposes only)
  if (context.isAdmin) {
    return 'ENTERPRISE' // Admins have full access
  }
  
  // Check if in active trial
  const now = new Date()
  const inTrial = context.trialEndDate && now < context.trialEndDate
  
  if (inTrial) {
    // Constitutional: Trial users receive Professional entitlements
    return 'PROFESSIONAL'
  }
  
  // Check subscription status
  if (context.subscriptionStatus === 'ACTIVE') {
    return context.planCode
  }
  
  // Expired, cancelled, or past due subscriptions have no entitlements
  return null
}

/**
 * Check if a feature is accessible given commercial context
 * 
 * This is the SINGLE SOURCE OF TRUTH for feature access decisions.
 * All API endpoints MUST use this function (via middleware) to check access.
 */
export function checkFeatureAccess(
  context: CommercialContext,
  feature: keyof PlanEntitlements
): PolicyCheckResult {
  const effectivePlan = getEffectivePlanCode(context)
  
  // No effective plan = no access
  if (!effectivePlan) {
    return {
      allowed: false,
      reason: 'Subscription expired or inactive',
      requiresUpgrade: true,
      upgradePlan: 'STARTER'
    }
  }
  
  // Check if plan includes this feature
  const hasAccess = hasFeatureAccess(effectivePlan, feature)
  
  if (hasAccess) {
    return {
      allowed: true,
      requiresUpgrade: false
    }
  }
  
  // Feature not included in plan - determine upgrade path
  const upgradePlan = getUpgradePlanForFeature(feature)
  
  return {
    allowed: false,
    reason: `Feature requires ${upgradePlan} plan or higher`,
    requiresUpgrade: true,
    upgradePlan
  }
}

/**
 * Get the minimum plan that includes a feature
 * 
 * Constitutional Authority: Sections 6.2-6.6 (Plan Entitlements)
 */
function getUpgradePlanForFeature(feature: keyof PlanEntitlements): PlanCode {
  const plans: PlanCode[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'PREMIUM', 'ENTERPRISE']
  
  for (const plan of plans) {
    if (hasFeatureAccess(plan, feature)) {
      return plan
    }
  }
  
  // Fallback (should never happen if entitlements are correctly defined)
  return 'PREMIUM'
}

/**
 * ENHANCEMENT 1: RESOURCE LIMIT SUPPORT
 * 
 * Check if a resource limit is exceeded
 * 
 * This function supports numeric commercial limits such as:
 * - AI Credits per month
 * - Storage GB
 * - QR Codes
 * - Branches
 * - API calls per month
 * - Employee seats
 * - Marketplace listings
 * 
 * Constitutional Authority: Sections 6.2-6.6 (Plan Limits)
 */
export type ResourceType = 'qrCodes' | 'aiCredits' | 'branches' | 'storage' | 'apiCalls' | 'employees' | 'marketplaceListings'

export function checkResourceLimit(
  context: CommercialContext,
  resource: ResourceType,
  currentUsage: number
): PolicyCheckResult {
  const effectivePlan = getEffectivePlanCode(context)
  
  // No effective plan = no access
  if (!effectivePlan) {
    return {
      allowed: false,
      reason: 'Subscription expired or inactive',
      requiresUpgrade: true,
      upgradePlan: 'STARTER'
    }
  }
  
  // Get entitlements for effective plan
  const entitlements = getPlanEntitlements(effectivePlan)
  
  // Map resource type to entitlement field
  const limitField = getResourceLimitField(resource)
  const limit = (entitlements as any)[limitField]
  
  // Unlimited resources always allowed
  if (limit === 'unlimited') {
    return {
      allowed: true,
      requiresUpgrade: false
    }
  }
  
  // Check if current usage exceeds limit
  if (currentUsage >= limit) {
    const upgradePlan = getUpgradePlanForResource(resource)
    return {
      allowed: false,
      reason: `${getResourceDisplayName(resource)} limit reached (${currentUsage}/${limit})`,
      requiresUpgrade: true,
      upgradePlan
    }
  }
  
  // Within limit
  return {
    allowed: true,
    requiresUpgrade: false
  }
}

/**
 * Map resource type to entitlement field name
 */
function getResourceLimitField(resource: ResourceType): string {
  const mapping: Record<ResourceType, string> = {
    qrCodes: 'maxQRCodes',
    aiCredits: 'aiCreditsPerMonth',
    branches: 'maxBranches',
    storage: 'storageGB',
    apiCalls: 'maxAPICallsPerMonth',
    employees: 'maxEmployees',
    marketplaceListings: 'maxMarketplaceListings'
  }
  return mapping[resource]
}

/**
 * Get display name for resource type
 */
function getResourceDisplayName(resource: ResourceType): string {
  const mapping: Record<ResourceType, string> = {
    qrCodes: 'QR Codes',
    aiCredits: 'AI Credits',
    branches: 'Branches',
    storage: 'Storage',
    apiCalls: 'API Calls',
    employees: 'Employees',
    marketplaceListings: 'Marketplace Listings'
  }
  return mapping[resource]
}

/**
 * Get the minimum plan that includes higher resource limit
 */
function getUpgradePlanForResource(resource: ResourceType): PlanCode {
  const plans: PlanCode[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'PREMIUM', 'ENTERPRISE']
  const limitField = getResourceLimitField(resource)
  
  // Find first plan with unlimited or higher limit
  for (const plan of plans) {
    const entitlements = getPlanEntitlements(plan)
    const limit = (entitlements as any)[limitField]
    
    if (limit === 'unlimited') {
      return plan
    }
  }
  
  // Fallback to PREMIUM (most plans have unlimited at PREMIUM)
  return 'PREMIUM'
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(context: CommercialContext): boolean {
  // Admin always has access
  if (context.isAdmin) {
    return true
  }
  
  // Check if in trial
  const now = new Date()
  const inTrial = context.trialEndDate && now < context.trialEndDate
  
  if (inTrial) {
    return true
  }
  
  // Check subscription status
  return context.subscriptionStatus === 'ACTIVE'
}

/**
 * Check if user is in trial period
 */
export function isInTrial(context: CommercialContext): boolean {
  if (!context.trialEndDate) {
    return false
  }
  
  const now = new Date()
  return now < context.trialEndDate
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(context: CommercialContext): number | null {
  if (!isInTrial(context)) {
    return null
  }
  
  const now = new Date()
  const endDate = context.trialEndDate!
  const diffMs = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Get all entitlements for current context
 */
export function getContextEntitlements(context: CommercialContext): PlanEntitlements | null {
  const effectivePlan = getEffectivePlanCode(context)
  
  if (!effectivePlan) {
    return null
  }
  
  return getPlanEntitlements(effectivePlan)
}

/**
 * POLICY ENFORCEMENT HELPERS
 */

/**
 * Create commercial context from session and business data
 */
export function createCommercialContext(params: {
  planCode: PlanCode
  subscriptionStatus: SubscriptionStatus
  trialEndDate: Date | null
  subscriptionEndDate: Date | null
  isAdmin: boolean
}): CommercialContext {
  return {
    planCode: params.planCode,
    subscriptionStatus: params.subscriptionStatus,
    trialEndDate: params.trialEndDate,
    subscriptionEndDate: params.subscriptionEndDate,
    isAdmin: params.isAdmin
  }
}

/**
 * COMMERCIAL ANALYTICS
 * 
 * Log commercial policy decisions for analytics and anomaly detection
 * 
 * ENHANCEMENT 3: Enhanced analytics with upgrade recommendations and endpoint tracking
 */
export interface CommercialEvent {
  timestamp: Date
  userId: string
  businessId: string
  planCode: PlanCode
  feature: string
  allowed: boolean
  reason?: string
  inTrial: boolean
  upgradePlan?: PlanCode // ENHANCEMENT 3: Track recommended upgrade plan
  endpoint?: string // ENHANCEMENT 3: Track which endpoint was accessed
}

const commercialEvents: CommercialEvent[] = []

/**
 * Log a commercial policy decision
 * 
 * This enables:
 * - Anomaly detection (Starter users accessing Premium features)
 * - Usage analytics (which features are used by which plans)
 * - Conversion tracking (locked feature access attempts)
 */
export function logCommercialEvent(event: Omit<CommercialEvent, 'timestamp'>): void {
  commercialEvents.push({
    ...event,
    timestamp: new Date()
  })
  
  // In production, this would send to analytics service
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Commercial Policy]', {
      feature: event.feature,
      allowed: event.allowed,
      plan: event.planCode,
      trial: event.inTrial,
      reason: event.reason
    })
  }
}

/**
 * Get recent commercial events (for debugging/monitoring)
 */
export function getRecentCommercialEvents(limit: number = 100): CommercialEvent[] {
  return commercialEvents.slice(-limit)
}

/**
 * Clear commercial events (for testing)
 */
export function clearCommercialEvents(): void {
  commercialEvents.length = 0
}
