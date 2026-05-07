export const SALES_STATUS = [
  'Lead',
  'Demo Done',
  'Trial Active',
  'Trial Ending Soon',
  'Converted',
  'Lost',
] as const

export type SalesStatus = typeof SALES_STATUS[number]

const UPPER_TO_PRETTY: Record<string, SalesStatus> = {
  LEAD: 'Lead',
  DEMO_DONE: 'Demo Done',
  TRIAL_ACTIVE: 'Trial Active',
  TRIAL_ENDING_SOON: 'Trial Ending Soon',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

const PRETTY_TO_TOKEN: Record<SalesStatus, string> = {
  'Lead': 'LEAD',
  'Demo Done': 'DEMO_DONE',
  'Trial Active': 'TRIAL_ACTIVE',
  'Trial Ending Soon': 'TRIAL_ENDING_SOON',
  'Converted': 'CONVERTED',
  'Lost': 'LOST',
}

export function normalizeSalesStatus(input?: string | null): SalesStatus {
  if (!input) return 'Lead'
  if ((SALES_STATUS as readonly string[]).includes(input as any)) return input as SalesStatus
  const key = input.replace(/\s+/g, '_').toUpperCase()
  return UPPER_TO_PRETTY[key] || 'Lead'
}

export function toSalesStatusToken(input?: string | null): string {
  if (!input) return 'LEAD'
  const pretty = normalizeSalesStatus(input)
  return PRETTY_TO_TOKEN[pretty]
}

export function fromSalesStatusToken(token?: string | null): SalesStatus {
  if (!token) return 'Lead'
  const key = token.toUpperCase()
  return UPPER_TO_PRETTY[key] || 'Lead'
}
