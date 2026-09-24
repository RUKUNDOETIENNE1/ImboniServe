import { useState, useEffect } from 'react'
import { PRICING_CONFIG } from '@/config/pricing'

interface TrialLengthLabelProps {
  /** Override trial days (e.g. from Founder Partner code). */
  trialDays?: number
  /** Show "no credit card" suffix. */
  showNoCard?: boolean
  className?: string
}

/**
 * Renders the trial duration text dynamically based on the configured
 * or overridden trial length. Replaces hardcoded "14-day" literals.
 */
export function TrialLengthLabel({
  trialDays,
  showNoCard = true,
  className = '',
}: TrialLengthLabelProps) {
  const [days, setDays] = useState(trialDays ?? PRICING_CONFIG.trialDays ?? 14)

  useEffect(() => {
    if (trialDays != null && trialDays > 0) {
      setDays(trialDays)
    }
  }, [trialDays])

  return (
    <span className={className}>
      {days}-day free trial{showNoCard ? ' — no credit card required' : ''}
    </span>
  )
}

export default TrialLengthLabel
