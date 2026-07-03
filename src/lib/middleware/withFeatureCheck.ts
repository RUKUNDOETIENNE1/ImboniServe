/**
 * API ENTITLEMENT MIDDLEWARE
 * 
 * Centralized commercial enforcement for API endpoints
 * 
 * This middleware is the ONLY way API endpoints should check feature access.
 * DO NOT implement subscription checks independently in API routes.
 * 
 * All commercial decisions flow through the centralized commercial policy layer.
 * 
 * Constitutional Authority: Commercial Constitution v1.1
 * Milestone: 2 (Commercial Enforcement - Backend)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { 
  checkFeatureAccess, 
  checkResourceLimit,
  createCommercialContext, 
  logCommercialEvent,
  isInTrial,
  type CommercialContext,
  type ResourceType
} from '@/lib/commercial/commercial-policy'
import type { PlanEntitlements } from '@/lib/plan-entitlements'

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any

/**
 * Middleware to enforce feature access
 * 
 * Usage:
 * ```typescript
 * export default requiresFeature('hasReservations')(handler)
 * ```
 * 
 * This middleware:
 * 1. Checks authentication
 * 2. Loads business and subscription data
 * 3. Creates commercial context
 * 4. Checks feature access via centralized policy
 * 5. Returns 402 if feature not included in plan
 * 6. Logs commercial event for analytics
 */
export function requiresFeature(feature: keyof PlanEntitlements) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Step 1: Check authentication
        const session = await getServerSession(req, res, authOptions)
        if (!session?.user) {
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
          })
        }
        
        // Step 2: Get business ID from session
        const businessId = (session.user as any).businessId
        if (!businessId) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'No business associated with user' 
          })
        }
        
        // Step 3: Load business and plan data
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          include: {
            plan: true
          }
        })
        
        if (!business) {
          return res.status(404).json({ 
            error: 'Not Found',
            message: 'Business not found' 
          })
        }
        
        if (!business.plan) {
          return res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'Business has no plan assigned' 
          })
        }
        
        // Step 4: Create commercial context
        const userRoles = (session.user as any)?.roles || []
        const isAdmin = userRoles.includes('ADMIN')
        
        const context: CommercialContext = createCommercialContext({
          planCode: business.plan.code as any, // Type assertion safe because we control plan codes
          subscriptionStatus: business.subscriptionStatus || 'ACTIVE',
          trialEndDate: business.trialEndDate,
          subscriptionEndDate: business.subscriptionEndDate,
          isAdmin
        })
        
        // Step 5: Check feature access via centralized policy
        const policyCheck = checkFeatureAccess(context, feature)
        
        // Step 6: Log commercial event (ENHANCEMENT 3: includes upgradePlan and endpoint)
        logCommercialEvent({
          userId: session.user.id || 'unknown',
          businessId: business.id,
          planCode: context.planCode,
          feature: feature,
          allowed: policyCheck.allowed,
          reason: policyCheck.reason,
          inTrial: isInTrial(context),
          upgradePlan: policyCheck.upgradePlan, // ENHANCEMENT 3
          endpoint: req.url // ENHANCEMENT 3
        })
        
        // Step 7: Enforce policy decision
        if (!policyCheck.allowed) {
          return res.status(402).json({
            error: 'Payment Required',
            message: policyCheck.reason || 'Feature not included in your plan',
            feature: feature,
            currentPlan: context.planCode,
            upgradePlan: policyCheck.upgradePlan,
            requiresUpgrade: policyCheck.requiresUpgrade,
            inTrial: isInTrial(context)
          })
        }
        
        // Step 8: Feature access granted - call handler
        return handler(req, res)
        
      } catch (error) {
        console.error('[withFeatureCheck] Error:', error)
        return res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to check feature access' 
        })
      }
    }
  }
}

/**
 * Middleware to require active subscription (no specific feature)
 * 
 * Usage:
 * ```typescript
 * export default requiresActiveSubscription(handler)
 * ```
 */
export function requiresActiveSubscription(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Step 1: Check authentication
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        })
      }
      
      // Step 2: Get business ID
      const businessId = (session.user as any).businessId
      if (!businessId) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'No business associated with user' 
        })
      }
      
      // Step 3: Load business data
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { plan: true }
      })
      
      if (!business || !business.plan) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Business or plan not found' 
        })
      }
      
      // Step 4: Check subscription status
      const now = new Date()
      const inTrial = business.trialEndDate && now < business.trialEndDate
      const isActive = business.subscriptionStatus === 'ACTIVE'
      
      if (!inTrial && !isActive) {
        return res.status(402).json({
          error: 'Payment Required',
          message: 'Active subscription required',
          subscriptionStatus: business.subscriptionStatus,
          trialEndDate: business.trialEndDate
        })
      }
      
      // Step 5: Subscription active - call handler
      return handler(req, res)
      
    } catch (error) {
      console.error('[requiresActiveSubscription] Error:', error)
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to check subscription status' 
      })
    }
  }
}

/**
 * ENHANCEMENT 1: RESOURCE LIMIT MIDDLEWARE
 * 
 * Middleware to enforce resource limits
 * 
 * Usage:
 * ```typescript
 * export default requiresResourceLimit('qrCodes', async (businessId) => {
 *   return await prisma.qrCode.count({ where: { businessId } })
 * })(handler)
 * ```
 */
export function requiresResourceLimit(
  resource: ResourceType,
  getCurrentUsage: (businessId: string) => Promise<number>
) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Step 1: Check authentication
        const session = await getServerSession(req, res, authOptions)
        if (!session?.user) {
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
          })
        }
        
        // Step 2: Get business ID
        const businessId = (session.user as any).businessId
        if (!businessId) {
          return res.status(400).json({ 
            error: 'Bad Request',
            message: 'No business associated with user' 
          })
        }
        
        // Step 3: Load business and plan data
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          include: { plan: true }
        })
        
        if (!business) {
          return res.status(404).json({ 
            error: 'Not Found',
            message: 'Business not found' 
          })
        }
        
        if (!business.plan) {
          return res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'Business has no plan assigned' 
          })
        }
        
        // Step 4: Create commercial context
        const userRoles = (session.user as any)?.roles || []
        const isAdmin = userRoles.includes('ADMIN')
        
        const context: CommercialContext = createCommercialContext({
          planCode: business.plan.code as any,
          subscriptionStatus: business.subscriptionStatus || 'ACTIVE',
          trialEndDate: business.trialEndDate,
          subscriptionEndDate: business.subscriptionEndDate,
          isAdmin
        })
        
        // Step 5: Get current usage
        const currentUsage = await getCurrentUsage(businessId)
        
        // Step 6: Check resource limit via centralized policy
        const policyCheck = checkResourceLimit(context, resource, currentUsage)
        
        // Step 7: Log commercial event (ENHANCEMENT 3: includes upgradePlan and endpoint)
        logCommercialEvent({
          userId: session.user.id || 'unknown',
          businessId: business.id,
          planCode: context.planCode,
          feature: `resource:${resource}`,
          allowed: policyCheck.allowed,
          reason: policyCheck.reason,
          inTrial: isInTrial(context),
          upgradePlan: policyCheck.upgradePlan, // ENHANCEMENT 3
          endpoint: req.url // ENHANCEMENT 3
        })
        
        // Step 8: Enforce policy decision
        if (!policyCheck.allowed) {
          return res.status(402).json({
            error: 'Payment Required',
            message: policyCheck.reason || 'Resource limit exceeded',
            resource: resource,
            currentUsage,
            currentPlan: context.planCode,
            upgradePlan: policyCheck.upgradePlan,
            requiresUpgrade: policyCheck.requiresUpgrade,
            inTrial: isInTrial(context)
          })
        }
        
        // Step 9: Resource limit not exceeded - call handler
        return handler(req, res)
        
      } catch (error) {
        console.error('[requiresResourceLimit] Error:', error)
        return res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to check resource limit' 
        })
      }
    }
  }
}

/**
 * ENHANCEMENT 2: POLICY COMPOSITION HELPERS
 * 
 * Middleware to require ANY of multiple features (OR logic)
 * 
 * Usage:
 * ```typescript
 * export default requiresAnyFeature('hasKDS', 'hasKDSAdvanced')(handler)
 * ```
 */
export function requiresAnyFeature(...features: (keyof PlanEntitlements)[]) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const context = await getCommercialContext(req, res)
        if (!context) return // Response already sent
        
        // Check each feature - if any is allowed, grant access
        for (const feature of features) {
          const check = checkFeatureAccess(context, feature)
          if (check.allowed) {
            // Log successful access (ENHANCEMENT 3: includes endpoint)
            logCommercialEvent({
              userId: (await getServerSession(req, res, authOptions))?.user?.id || 'unknown',
              businessId: (await getServerSession(req, res, authOptions))?.user?.businessId || 'unknown',
              planCode: context.planCode,
              feature: feature,
              allowed: true,
              inTrial: isInTrial(context),
              endpoint: req.url // ENHANCEMENT 3
            })
            
            return handler(req, res)
          }
        }
        
        // None of the features are allowed
        return res.status(402).json({
          error: 'Payment Required',
          message: `Requires one of: ${features.join(', ')}`,
          features,
          currentPlan: context.planCode,
          inTrial: isInTrial(context)
        })
        
      } catch (error) {
        console.error('[requiresAnyFeature] Error:', error)
        return res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to check feature access' 
        })
      }
    }
  }
}

/**
 * Middleware to require ALL of multiple features (AND logic)
 * 
 * Usage:
 * ```typescript
 * export default requiresAllFeatures('hasMultiBranchDashboard', 'hasKDS')(handler)
 * ```
 */
export function requiresAllFeatures(...features: (keyof PlanEntitlements)[]) {
  return (handler: ApiHandler): ApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const context = await getCommercialContext(req, res)
        if (!context) return // Response already sent
        
        const session = await getServerSession(req, res, authOptions)
        const userId = session?.user?.id || 'unknown'
        const businessId = session?.user?.businessId || 'unknown'
        
        // Check each feature - all must be allowed
        for (const feature of features) {
          const check = checkFeatureAccess(context, feature)
          
          if (!check.allowed) {
            // Log denied access (ENHANCEMENT 3: includes upgradePlan and endpoint)
            logCommercialEvent({
              userId,
              businessId,
              planCode: context.planCode,
              feature: feature,
              allowed: false,
              reason: check.reason,
              inTrial: isInTrial(context),
              upgradePlan: check.upgradePlan, // ENHANCEMENT 3
              endpoint: req.url // ENHANCEMENT 3
            })
            
            return res.status(402).json({
              error: 'Payment Required',
              message: check.reason || 'Feature not included in your plan',
              missingFeature: feature,
              currentPlan: context.planCode,
              upgradePlan: check.upgradePlan,
              requiresUpgrade: check.requiresUpgrade,
              inTrial: isInTrial(context)
            })
          }
        }
        
        // All features are allowed - log success (ENHANCEMENT 3: includes endpoint)
        logCommercialEvent({
          userId,
          businessId,
          planCode: context.planCode,
          feature: features.join('+'),
          allowed: true,
          inTrial: isInTrial(context),
          endpoint: req.url // ENHANCEMENT 3
        })
        
        return handler(req, res)
        
      } catch (error) {
        console.error('[requiresAllFeatures] Error:', error)
        return res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to check feature access' 
        })
      }
    }
  }
}

/**
 * Helper to get commercial context in API routes
 * 
 * Use this when you need to check multiple features or access entitlements directly
 * 
 * Usage:
 * ```typescript
 * const context = await getCommercialContext(req, res)
 * if (!context) return // Response already sent
 * 
 * const entitlements = getContextEntitlements(context)
 * ```
 */
export async function getCommercialContext(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<CommercialContext | null> {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return null
    }
    
    const businessId = (session.user as any).businessId
    if (!businessId) {
      res.status(400).json({ error: 'No business associated with user' })
      return null
    }
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { plan: true }
    })
    
    if (!business || !business.plan) {
      res.status(404).json({ error: 'Business or plan not found' })
      return null
    }
    
    const userRoles = (session.user as any)?.roles || []
    const isAdmin = userRoles.includes('ADMIN')
    
    return createCommercialContext({
      planCode: business.plan.code as any,
      subscriptionStatus: business.subscriptionStatus || 'ACTIVE',
      trialEndDate: business.trialEndDate,
      subscriptionEndDate: business.subscriptionEndDate,
      isAdmin
    })
    
  } catch (error) {
    console.error('[getCommercialContext] Error:', error)
    res.status(500).json({ error: 'Failed to get commercial context' })
    return null
  }
}
