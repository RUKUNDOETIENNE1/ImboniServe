import type { BusinessInsightType } from '@/lib/die/business-intelligence/reasoning-engine'

export type CanonicalDomain =
  | 'Finance'
  | 'Operations'
  | 'Supply Chain'
  | 'Marketing'
  | 'Customer Experience'
  | 'Dining Operations'
  | 'Reservations'
  | 'Core'

export interface InsightDefinition {
  canonical: string
  domain: CanonicalDomain
  description: string
}

export const InsightDictionary: Record<BusinessInsightType, InsightDefinition> = {
  REVENUE_GROWTH_DETECTED: { canonical: 'Revenue Growth Detected', domain: 'Finance', description: 'Observed increase in revenue vs baseline trend.' },
  REVENUE_DECLINE_DETECTED: { canonical: 'Revenue Decline Detected', domain: 'Finance', description: 'Observed decrease in revenue vs baseline trend.' },
  REVENUE_RISK_DETECTED: { canonical: 'Revenue Risk Detected', domain: 'Finance', description: 'Rising payment exceptions indicative of revenue risk.' },
  REFUND_SPIKE_DETECTED: { canonical: 'Refund Spike Detected', domain: 'Finance', description: 'Increase in refunds suggesting service or product issues.' },
  PAYMENT_PROVIDER_DEGRADATION: { canonical: 'Payment Provider Degradation', domain: 'Finance', description: 'Elevated provider failures or latency impacting payments.' },
  COLLECTION_RISK_DETECTED: { canonical: 'Collection Risk Detected', domain: 'Finance', description: 'Efficiency of collections deteriorating vs baseline.' },
  FINANCIAL_HEALTH_WARNING: { canonical: 'Financial Health Warning', domain: 'Finance', description: 'Overall financial health indicator is deteriorating.' },
  KITCHEN_BOTTLENECK_IDENTIFIED: { canonical: 'Kitchen Bottleneck Identified', domain: 'Operations', description: 'Operational congestion concentrated in kitchen workflows.' },
  OPERATIONAL_CONGESTION: { canonical: 'Operational Congestion', domain: 'Operations', description: 'Generalized operational pressure rising across the venue.' },
  SUPPLY_CHAIN_DEGRADATION: { canonical: 'Supply Chain Degradation', domain: 'Supply Chain', description: 'Supplier or logistics related degradation detected.' },
  DEMAND_SURGE_DETECTED: { canonical: 'Demand Surge Detected', domain: 'Reservations', description: 'Increased customer demand vs baseline expectation.' },
  CUSTOMER_CHURN_RISK: { canonical: 'Customer Churn Risk', domain: 'Customer Experience', description: 'Signals suggest higher risk of customer churn or inactivity.' },
  TABLE_TURNOVER_INEFFICIENCY: { canonical: 'Table Turnover Inefficiency', domain: 'Dining Operations', description: 'Reduced table turnover efficiency observed.' },
  CAMPAIGN_EFFECTIVENESS_DROP: { canonical: 'Campaign Effectiveness Drop', domain: 'Marketing', description: 'Marketing campaign deliverability or impact weakening.' },
}

export interface EventCodeDefinition {
  canonical: string
  category: 'engagement' | 'operations' | 'supply' | 'payments' | 'marketing'
  description: string
}

export const EventCodeDictionary: Record<string, EventCodeDefinition> = {
  SESSION_STARTED: { canonical: 'Session Started', category: 'engagement', description: 'A user session has started.' },
  RESERVATION_CREATED: { canonical: 'Reservation Created', category: 'engagement', description: 'A reservation was created.' },
  KDS_BACKLOG_ALERT: { canonical: 'KDS Backlog Alert', category: 'operations', description: 'Kitchen Display System backlog threshold exceeded.' },
  WAITER_CALL_CREATED: { canonical: 'Waiter Call Created', category: 'operations', description: 'A waiter call was triggered, indicating service pressure.' },
  DELIVERY_DELAYED: { canonical: 'Delivery Delayed', category: 'supply', description: 'Delivery is delayed beyond expected window.' },
  SUPPLIER_DELIVERY_DELAYED: { canonical: 'Supplier Delivery Delayed', category: 'supply', description: 'Supplier-reported delay in delivery.' },
  PAYMENT_EXCEPTION: { canonical: 'Payment Exception', category: 'payments', description: 'A payment exception/failure occurred.' },
  CAMPAIGN_DELIVERABILITY_WEAK: { canonical: 'Campaign Deliverability Weak', category: 'marketing', description: 'Campaign deliverability is weak; do not conflate with conversion.' },
}

export interface FinanceMetricDefinition {
  key: string
  description: string
  unit?: string
}

export const FinanceMetricDictionary: Record<string, FinanceMetricDefinition> = {
  'finance.revenue': { key: 'finance.revenue', description: 'Total revenue over time window', unit: 'currency' },
  'finance.refunds': { key: 'finance.refunds', description: 'Total refunds over time window', unit: 'currency' },
  'finance.providerFailures': { key: 'finance.providerFailures', description: 'Payment provider failure count or rate' },
  'finance.collectionEfficiency': { key: 'finance.collectionEfficiency', description: 'Collections efficiency score', unit: 'score' },
  'finance.healthScore': { key: 'finance.healthScore', description: 'Composite financial health score', unit: 'score' },
  'finance.paymentExceptions': { key: 'finance.paymentExceptions', description: 'Payment exception count in window' },
}

export interface TemporalMetricDefinition {
  key: string
  description: string
}

export const TemporalMetricDictionary: Record<string, TemporalMetricDefinition> = {
  'temporal.demand': { key: 'temporal.demand', description: 'Relative demand trend vs baseline' },
  'temporal.operationalPressure': { key: 'temporal.operationalPressure', description: 'Operational pressure trend vs baseline' },
  'temporal.supplyRisk': { key: 'temporal.supplyRisk', description: 'Supply risk trend vs baseline' },
  'temporal.customerActivity': { key: 'temporal.customerActivity', description: 'Customer activity trend vs baseline' },
}
