import { PRICING_CONFIG } from '@/config/pricing'

/**
 * TrialPolicyService — single source of truth for trial duration.
 *
 * Default trial is 14 days (from PRICING_CONFIG.trialDays).
 * Founder Partner codes can override this up to 90 days.
 */

const DEFAULT_TRIAL_DAYS = PRICING_CONFIG.trialDays ?? 14
const MAX_TRIAL_DAYS = 90

export class TrialPolicyService {
  /**
   * Get the trial duration (in days) for a given attribution source and override.
   */
  static getTrialDays(params?: {
    source?: string
    trialDaysOverride?: number
  }): number {
    const override = params?.trialDaysOverride
    if (override != null && override > 0 && override <= MAX_TRIAL_DAYS) {
      return override
    }
    if (params?.source === 'FOUNDER_CODE') {
      // Founder Partner default is 30 days unless overridden
      return override ?? 30
    }
    return DEFAULT_TRIAL_DAYS
  }

  /**
   * Get trial days from a persisted AcquisitionAttribution row.
   * Bridges the new attribution model with trial policy without duplication.
   */
  static getTrialDaysFromAttribution(attribution: {
    sourceType: string
    trialDaysOverride?: number | null
  } | null): number {
    if (!attribution) return DEFAULT_TRIAL_DAYS
    return this.getTrialDays({
      source: attribution.sourceType,
      trialDaysOverride: attribution.trialDaysOverride ?? undefined,
    })
  }

  /**
   * Compute trial end date from a start date.
   */
  static computeTrialEndDate(startDate: Date, trialDays: number): Date {
    const end = new Date(startDate)
    end.setDate(end.getDate() + trialDays)
    return end
  }

  /**
   * Get the default trial days (for display / labels).
   */
  static getDefaultTrialDays(): number {
    return DEFAULT_TRIAL_DAYS
  }

  /**
   * Get the max allowed trial days.
   */
  static getMaxTrialDays(): number {
    return MAX_TRIAL_DAYS
  }

  /**
   * Calculate days remaining in an active trial.
   */
  static daysRemaining(trialEndDate: Date | null): number {
    if (!trialEndDate) return 0
    const now = new Date()
    const ms = trialEndDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
  }

  /**
   * Check if a trial is currently active.
   */
  static isTrialActive(trialStartDate: Date | null, trialEndDate: Date | null): boolean {
    if (!trialStartDate || !trialEndDate) return false
    const now = new Date()
    return now >= trialStartDate && now < trialEndDate
  }
}
