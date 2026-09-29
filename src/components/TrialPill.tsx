import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface TrialStatus {
  isActive: boolean
  daysRemaining: number
  trialEndDate: string | null
  trialStartDate: string | null
  approvalStatus: string
}

/**
 * TrialPill — compact widget showing trial days remaining on the business dashboard.
 * Shows nothing if the business is not on trial (no visual clutter for paid businesses).
 */
export function TrialPill() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<TrialStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchTrialStatus() {
      try {
        const res = await fetch('/api/dashboard/trial-status')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setStatus(data)
        }
      } catch {
        // Silently fail — trial pill is non-critical UI
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTrialStatus()
    return () => { cancelled = true }
  }, [])

  if (loading || !status) return null

  // Pending approval
  if (status.approvalStatus === 'PENDING') {
    return (
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" />
        {t('trial.pending_approval', 'Pending approval — trial starts once approved')}
      </div>
    )
  }

  // Trial active
  if (status.isActive) {
    const days = status.daysRemaining
    const urgent = days <= 3
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        urgent
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-blue-50 border border-blue-200 text-blue-700'
      }`}>
        <Clock className="w-4 h-4" />
        {urgent
          ? t('trial.ending_soon', `${days} day${days === 1 ? '' : 's'} left in trial`)
          : t('trial.days_remaining', `${days} day${days === 1 ? '' : 's'} remaining in trial`)}
      </div>
    )
  }

  // Trial expired
  if (status.trialEndDate && !status.isActive) {
    return (
      <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        {t('trial.expired', 'Trial ended — subscribe to continue')}
      </div>
    )
  }

  // No trial (e.g. supplier or already subscribed)
  return null
}

export default TrialPill
