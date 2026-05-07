/**
 * Plan Entitlements System
 * Centralized feature gating based on subscription tier
 */

export type PlanCode = 'ESSENTIALS' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'PREMIUM' | 'ENTERPRISE'

export interface PlanEntitlements {
  // Core Operations
  hasKitchenTickets: boolean
  hasKDS: boolean
  hasKDSAdvanced: boolean
  hasBasicInventory: boolean
  hasInventoryAlerts: boolean
  hasInventoryAutoReorder: boolean
  hasRecipeManagement: boolean
  hasPrepPlans: boolean
  
  // Supplier & Procurement
  hasBasicSupplierOrders: boolean
  hasProcurementWorkflow: boolean
  hasSupplierPortal: boolean
  hasDeliveryConfirmation: boolean
  
  // Growth & Marketing
  hasWhatsAppCampaigns: boolean
  hasWhatsAppCampaignsSegments: boolean
  hasWhatsAppCampaignsAutomation: boolean
  hasABTesting: boolean
  hasABTestingUnlimited: boolean
  hasOptimizationHub: boolean
  
  // Online Presence
  hasSiteBuilderPreview: boolean
  hasSiteBuilderBasic: boolean
  hasSiteBuilderPro: boolean
  hasWhiteLabel: boolean
  hasDiscoveryListing: boolean
  hasDiscoveryFeatured: boolean
  
  // Payments & Finance
  hasPaymentMonitor: boolean
  hasPaymentAnalytics: boolean
  hasPaymentAnalyticsPro: boolean
  hasRevenueIntelligence: boolean
  
  // Intelligence & Automation
  aiCreditsPerMonth: number | 'unlimited'
  hasOptimizationInsights: boolean
  hasForecasting: boolean
  
  // Multi-location
  maxBranches: number | 'unlimited'
  maxOutlets: number | 'unlimited'
  hasMultiBranchDashboard: boolean
  
  // Support & Reliability
  supportLevel: 'standard' | 'priority' | 'premium' | 'enterprise'
  hasSLA: boolean
  hasDedicatedManager: boolean
  
  // QR & Codes
  maxQRCodes: number | 'unlimited'
  
  // Storage
  storageGB: number
  
  // Advanced Features
  hasAPIAccess: boolean
  hasCustomIntegrations: boolean
  hasSSO: boolean
  hasCustomWorkflows: boolean
  hasAuditExports: boolean
  hasOnPremiseDeployment: boolean
  
  // Staff & Access
  hasReservations: boolean
  hasStaffManagement: boolean
  hasRoleBasedAccess: boolean
  
  // Reports & Analytics
  hasBasicReports: boolean
  hasAdvancedReports: boolean
  hasBIConnectors: boolean
  hasMenuPerformance: boolean
  hasMenuPerformanceByBranch: boolean
  hasQRAnalytics: boolean
  hasQRAnalyticsDeepDive: boolean
  
  // Customer
  hasBasicCRM: boolean
  hasCustomerFeedback: boolean
  
  // Concurrent limits
  maxConcurrentABTests: number | 'unlimited'
}

/**
 * Get entitlements for a specific plan
 */
export function getPlanEntitlements(planCode: PlanCode): PlanEntitlements {
  const baseEntitlements: PlanEntitlements = {
    hasKitchenTickets: false,
    hasKDS: false,
    hasKDSAdvanced: false,
    hasBasicInventory: false,
    hasInventoryAlerts: false,
    hasInventoryAutoReorder: false,
    hasRecipeManagement: false,
    hasPrepPlans: false,
    hasBasicSupplierOrders: false,
    hasProcurementWorkflow: false,
    hasSupplierPortal: false,
    hasDeliveryConfirmation: false,
    hasWhatsAppCampaigns: false,
    hasWhatsAppCampaignsSegments: false,
    hasWhatsAppCampaignsAutomation: false,
    hasABTesting: false,
    hasABTestingUnlimited: false,
    hasOptimizationHub: false,
    hasSiteBuilderPreview: false,
    hasSiteBuilderBasic: false,
    hasSiteBuilderPro: false,
    hasWhiteLabel: false,
    hasDiscoveryListing: false,
    hasDiscoveryFeatured: false,
    hasPaymentMonitor: false,
    hasPaymentAnalytics: false,
    hasPaymentAnalyticsPro: false,
    hasRevenueIntelligence: false,
    aiCreditsPerMonth: 0,
    hasOptimizationInsights: false,
    hasForecasting: false,
    maxBranches: 1,
    maxOutlets: 1,
    hasMultiBranchDashboard: false,
    supportLevel: 'standard',
    hasSLA: false,
    hasDedicatedManager: false,
    maxQRCodes: 0,
    storageGB: 2,
    hasAPIAccess: false,
    hasCustomIntegrations: false,
    hasSSO: false,
    hasCustomWorkflows: false,
    hasAuditExports: false,
    hasOnPremiseDeployment: false,
    hasReservations: false,
    hasStaffManagement: false,
    hasRoleBasedAccess: false,
    hasBasicReports: false,
    hasAdvancedReports: false,
    hasBIConnectors: false,
    hasMenuPerformance: false,
    hasMenuPerformanceByBranch: false,
    hasQRAnalytics: false,
    hasQRAnalyticsDeepDive: false,
    hasBasicCRM: false,
    hasCustomerFeedback: false,
    maxConcurrentABTests: 0,
  }

  switch (planCode) {
    case 'ESSENTIALS':
    case 'STARTER':
      return {
        ...baseEntitlements,
        hasKitchenTickets: true,
        hasBasicInventory: true,
        hasBasicSupplierOrders: true,
        hasBasicReports: true,
        hasBasicCRM: true,
        hasDiscoveryListing: true,
        hasSiteBuilderPreview: true,
        aiCreditsPerMonth: 20,
        maxQRCodes: 5,
        maxBranches: 1,
        maxOutlets: 1,
        storageGB: 2,
        supportLevel: 'standard',
      }

    case 'PROFESSIONAL':
      return {
        ...baseEntitlements,
        hasKitchenTickets: true,
        hasBasicInventory: true,
        hasInventoryAlerts: true,
        hasBasicSupplierOrders: true,
        hasProcurementWorkflow: true,
        hasWhatsAppCampaigns: true, // Basic only
        hasReservations: true,
        hasStaffManagement: true,
        hasRoleBasedAccess: true,
        hasPaymentMonitor: true,
        hasPaymentAnalytics: true,
        hasBasicReports: true,
        hasMenuPerformance: true,
        hasBasicCRM: true,
        hasDiscoveryListing: true,
        hasSiteBuilderBasic: true,
        aiCreditsPerMonth: 50,
        maxQRCodes: 20,
        maxBranches: 1,
        maxOutlets: 'unlimited',
        storageGB: 5,
        supportLevel: 'priority',
      }

    case 'BUSINESS':
      return {
        ...baseEntitlements,
        hasKitchenTickets: true,
        hasKDS: true,
        hasBasicInventory: true,
        hasInventoryAlerts: true,
        hasBasicSupplierOrders: true,
        hasProcurementWorkflow: true,
        hasSupplierPortal: true,
        hasDeliveryConfirmation: true,
        hasWhatsAppCampaigns: true,
        hasWhatsAppCampaignsSegments: true, // Pro features
        hasABTesting: true, // Lite: 1 concurrent
        hasReservations: true,
        hasStaffManagement: true,
        hasRoleBasedAccess: true,
        hasPaymentMonitor: true,
        hasPaymentAnalytics: true,
        hasPaymentAnalyticsPro: true,
        hasBasicReports: true,
        hasMenuPerformance: true,
        hasMenuPerformanceByBranch: true,
        hasQRAnalytics: true,
        hasQRAnalyticsDeepDive: true,
        hasBasicCRM: true,
        hasDiscoveryListing: true,
        hasDiscoveryFeatured: true,
        hasSiteBuilderPro: true,
        aiCreditsPerMonth: 200,
        maxQRCodes: 'unlimited',
        maxBranches: 3,
        maxOutlets: 'unlimited',
        hasMultiBranchDashboard: true,
        storageGB: 20,
        supportLevel: 'priority',
        maxConcurrentABTests: 1,
      }

    case 'PREMIUM':
      return {
        ...baseEntitlements,
        hasKitchenTickets: true,
        hasKDS: true,
        hasKDSAdvanced: true,
        hasBasicInventory: true,
        hasInventoryAlerts: true,
        hasInventoryAutoReorder: true,
        hasRecipeManagement: true,
        hasPrepPlans: true,
        hasBasicSupplierOrders: true,
        hasProcurementWorkflow: true,
        hasSupplierPortal: true,
        hasDeliveryConfirmation: true,
        hasWhatsAppCampaigns: true,
        hasWhatsAppCampaignsSegments: true,
        hasWhatsAppCampaignsAutomation: true,
        hasABTesting: true,
        hasABTestingUnlimited: true,
        hasOptimizationHub: true,
        hasReservations: true,
        hasStaffManagement: true,
        hasRoleBasedAccess: true,
        hasPaymentMonitor: true,
        hasPaymentAnalytics: true,
        hasPaymentAnalyticsPro: true,
        hasRevenueIntelligence: true,
        hasBasicReports: true,
        hasAdvancedReports: true,
        hasBIConnectors: true,
        hasMenuPerformance: true,
        hasMenuPerformanceByBranch: true,
        hasQRAnalytics: true,
        hasQRAnalyticsDeepDive: true,
        hasBasicCRM: true,
        hasCustomerFeedback: true,
        hasDiscoveryListing: true,
        hasDiscoveryFeatured: true,
        hasSiteBuilderPro: true,
        hasWhiteLabel: true,
        hasAPIAccess: true,
        hasOptimizationInsights: true,
        hasForecasting: true,
        aiCreditsPerMonth: 'unlimited',
        maxQRCodes: 'unlimited',
        maxBranches: 'unlimited',
        maxOutlets: 'unlimited',
        hasMultiBranchDashboard: true,
        storageGB: 100,
        supportLevel: 'premium',
        maxConcurrentABTests: 'unlimited',
      }

    case 'ENTERPRISE':
      return {
        ...baseEntitlements,
        hasKitchenTickets: true,
        hasKDS: true,
        hasKDSAdvanced: true,
        hasBasicInventory: true,
        hasInventoryAlerts: true,
        hasInventoryAutoReorder: true,
        hasRecipeManagement: true,
        hasPrepPlans: true,
        hasBasicSupplierOrders: true,
        hasProcurementWorkflow: true,
        hasSupplierPortal: true,
        hasDeliveryConfirmation: true,
        hasWhatsAppCampaigns: true,
        hasWhatsAppCampaignsSegments: true,
        hasWhatsAppCampaignsAutomation: true,
        hasABTesting: true,
        hasABTestingUnlimited: true,
        hasOptimizationHub: true,
        hasReservations: true,
        hasStaffManagement: true,
        hasRoleBasedAccess: true,
        hasPaymentMonitor: true,
        hasPaymentAnalytics: true,
        hasPaymentAnalyticsPro: true,
        hasRevenueIntelligence: true,
        hasBasicReports: true,
        hasAdvancedReports: true,
        hasBIConnectors: true,
        hasMenuPerformance: true,
        hasMenuPerformanceByBranch: true,
        hasQRAnalytics: true,
        hasQRAnalyticsDeepDive: true,
        hasBasicCRM: true,
        hasCustomerFeedback: true,
        hasDiscoveryListing: true,
        hasDiscoveryFeatured: true,
        hasSiteBuilderPro: true,
        hasWhiteLabel: true,
        hasAPIAccess: true,
        hasCustomIntegrations: true,
        hasSSO: true,
        hasCustomWorkflows: true,
        hasAuditExports: true,
        hasOnPremiseDeployment: true,
        hasOptimizationInsights: true,
        hasForecasting: true,
        aiCreditsPerMonth: 'unlimited',
        maxQRCodes: 'unlimited',
        maxBranches: 'unlimited',
        maxOutlets: 'unlimited',
        hasMultiBranchDashboard: true,
        storageGB: 'unlimited' as any,
        supportLevel: 'enterprise',
        hasSLA: true,
        hasDedicatedManager: true,
        maxConcurrentABTests: 'unlimited',
      }

    default:
      return baseEntitlements
  }
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  userPlanCode: PlanCode | undefined,
  featureKey: keyof PlanEntitlements
): boolean {
  if (!userPlanCode) return false
  const entitlements = getPlanEntitlements(userPlanCode)
  const value = entitlements[featureKey]
  
  // Handle boolean features
  if (typeof value === 'boolean') return value
  
  // Handle numeric/unlimited features (consider them as "has access")
  if (typeof value === 'number') return value > 0
  if (value === 'unlimited') return true
  
  return false
}

/**
 * Get upgrade target plan for a feature
 */
export function getUpgradePlanForFeature(featureKey: keyof PlanEntitlements): PlanCode | null {
  const plans: PlanCode[] = ['ESSENTIALS', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'PREMIUM', 'ENTERPRISE']
  
  for (const plan of plans) {
    if (hasFeatureAccess(plan, featureKey)) {
      return plan
    }
  }
  
  return null
}
