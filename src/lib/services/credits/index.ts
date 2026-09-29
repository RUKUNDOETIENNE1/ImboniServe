/**
 * AI Credits Platform — Barrel Export
 * Single import point for all credit platform services.
 */

export { getOrCreateWallet, getWallet, getAvailableBalance, renewMonthlyAllocation, renewAllDueAllocations, adjustBalance } from './credit-wallet.service';
export type { CreditWallet } from './credit-wallet.service';

export { appendLedgerEntry, getBusinessLedger, getLedgerByRequestId, searchLedger } from './credit-ledger.service';
export type { LedgerEntry, LedgerEntryInput } from './credit-ledger.service';

export { getFeatureCost, getFeatureCostRecord, getAllFeatureCosts, updateFeatureCost, createFeatureCost, listAllFeatureCosts, seedDefaultFeatureCosts } from './feature-cost-registry.service';
export type { FeatureCost } from './feature-cost-registry.service';

export { checkCredits, reserveCredits, commitReservation, releaseReservation, expireStaleReservations, executeWithCredits, InsufficientCreditsError } from './credit-consumption-engine.service';
export type { CreditCheckResult, ReservationResult, ConsumeResult } from './credit-consumption-engine.service';

export { getPolicyValue, getPolicyInt, getPolicyBool, getPolicyJson, isFeatureAllowed, updatePolicy, createPolicy, listAllPolicies, seedDefaultPolicies } from './credit-policy.service';
export type { CreditPolicy } from './credit-policy.service';

export { getActivePackages, getPackageByCode, fulfillPurchase, grantBonusCredits, revokeCredits, seedDefaultPackages } from './credit-purchase.service';
export type { CreditPackage } from './credit-purchase.service';

export { getBusinessAnalytics, getPlatformAnalytics } from './credit-analytics.service';
export type { BusinessAnalytics, PlatformAnalytics } from './credit-analytics.service';
