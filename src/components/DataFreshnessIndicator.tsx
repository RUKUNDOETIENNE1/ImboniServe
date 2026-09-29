import { Clock } from 'lucide-react'

/**
 * Displays when data was last refreshed, so customers can trust data freshness.
 *
 * Trust principle (EGR-009): Every customer interaction must increase trust.
 * Financial data without a freshness indicator creates uncertainty —
 * "Is this from 5 minutes ago or 5 hours ago?" — which erodes confidence.
 * This component makes data freshness visible at a glance.
 */
interface Props {
  /** ISO timestamp of when the data was last loaded */
  lastUpdated: Date | null
  /** Whether data is currently loading */
  loading?: boolean
  /** Optional className override */
  className?: string
}

export default function DataFreshnessIndicator({ lastUpdated, loading, className = '' }: Props) {
  if (loading && !lastUpdated) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-400 ${className}`}>
        <Clock className="w-3 h-3 animate-pulse" />
        Loading...
      </span>
    )
  }

  if (!lastUpdated) return null

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-400 ${className}`}>
      <Clock className="w-3 h-3" />
      Last updated: {lastUpdated.toLocaleString()}
    </span>
  )
}
