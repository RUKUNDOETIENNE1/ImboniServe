import { Activity, CheckCircle, XCircle, AlertTriangle, FileText, Gift, DollarSign, Wallet, Bell, User, RefreshCw } from 'lucide-react'

interface OperationsTimelineEntry {
  id: string
  type: string
  entityType: string
  entityId: string
  timestamp: string
  triggeredBy?: string | null
  payload?: any
}

interface OperationsTimelineProps {
  entries: OperationsTimelineEntry[]
  total: number
  page: number
  limit: number
  onPageChange?: (page: number) => void
  loading?: boolean
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function getEventIcon(type: string) {
  if (type.includes('APPROVED') || type.includes('PAID') || type.includes('ACTIVATED') || type.includes('SIGNED') || type.includes('REACTIVATED') || type.includes('CONVERTED') || type.includes('ONBOARDED'))
    return <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
  if (type.includes('REJECTED') || type.includes('SUSPENDED') || type.includes('TERMINATED') || type.includes('FAILED') || type.includes('CLAWED') || type.includes('VOIDED') || type.includes('CANCELLED') || type.includes('EXPIRED'))
    return <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
  if (type.includes('PAUSED') || type.includes('REVOKED') || type.includes('RISK'))
    return <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
  if (type.includes('CODE') || type.includes('REDEEMED'))
    return <Gift className="w-4 h-4 text-purple-600" aria-hidden="true" />
  if (type.includes('COMMISSION'))
    return <DollarSign className="w-4 h-4 text-blue-600" aria-hidden="true" />
  if (type.includes('PAYOUT'))
    return <Wallet className="w-4 h-4 text-indigo-600" aria-hidden="true" />
  if (type.includes('AGREEMENT'))
    return <FileText className="w-4 h-4 text-slate-600" aria-hidden="true" />
  if (type.includes('CAMPAIGN'))
    return <Activity className="w-4 h-4 text-pink-600" aria-hidden="true" />
  if (type.includes('ATTRIBUTION'))
    return <User className="w-4 h-4 text-cyan-600" aria-hidden="true" />
  if (type.includes('TRIAL'))
    return <RefreshCw className="w-4 h-4 text-teal-600" aria-hidden="true" />
  if (type.includes('NOTIFICATION'))
    return <Bell className="w-4 h-4 text-slate-500" aria-hidden="true" />
  return <Activity className="w-4 h-4 text-slate-400" aria-hidden="true" />
}

export default function OperationsTimeline({ entries, total, page, limit, onPageChange, loading }: OperationsTimelineProps) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Operations Timeline</h3>
        </div>
        <span className="text-xs text-slate-500">{total} event{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Loading timeline">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No timeline events found.</p>
      ) : (
        <>
          <div className="space-y-0" role="list" aria-label="Operations timeline events">
            {entries.map((entry, idx) => {
              const isLast = idx === entries.length - 1
              return (
                <div key={entry.id} className="flex gap-3" role="listitem">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getEventIcon(entry.type)}
                    </div>
                    {!isLast && <div className="w-px h-full bg-slate-200" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700">{formatType(entry.type)}</p>
                      <time className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(entry.timestamp).toLocaleString()}
                      </time>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>{entry.entityType}</span>
                      <span className="font-mono">{entry.entityId.slice(-12)}</span>
                      {entry.triggeredBy && <span>by {entry.triggeredBy}</span>}
                    </div>
                    {entry.payload && typeof entry.payload === 'object' && (
                      <div className="mt-1 text-xs text-slate-400">
                        {Object.entries(entry.payload).slice(0, 3).map(([key, val]) => (
                          <span key={key} className="mr-3">
                            {key}: {String(val).slice(0, 50)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
                className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
                className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
