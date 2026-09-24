import { Clock, User } from 'lucide-react'

interface FinancialTimelineEntry {
  id: string
  type: string
  timestamp: string
  triggeredBy?: string | null
  payload?: any
}

interface FinancialTimelineProps {
  entries: FinancialTimelineEntry[]
  emptyMessage?: string
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

const typeColors: Record<string, string> = {
  COMMISSION_ACCRUED: 'bg-blue-500',
  COMMISSION_VALIDATED: 'bg-blue-400',
  COMMISSION_APPROVED: 'bg-green-500',
  COMMISSION_PAID: 'bg-green-600',
  COMMISSION_VOIDED: 'bg-red-400',
  COMMISSION_CLAWED_BACK: 'bg-red-600',
  PAYOUT_REQUESTED: 'bg-purple-400',
  PAYOUT_PAID: 'bg-purple-600',
  PAYOUT_REJECTED: 'bg-red-400',
}

export default function FinancialTimeline({ entries, emptyMessage = 'No financial events yet' }: FinancialTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Financial Timeline</h3>
        </div>
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Financial Timeline</h3>
      </div>

      <div className="space-y-3" role="list" aria-label="Financial timeline events">
        {entries.slice(0, 50).map((entry) => {
          const dotColor = typeColors[entry.type] ?? 'bg-slate-400'

          return (
            <div key={entry.id} className="flex gap-3" role="listitem">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                <div className="w-px h-full bg-slate-100" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{formatType(entry.type)}</p>
                  <time className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
                {entry.triggeredBy && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{entry.triggeredBy}</span>
                  </div>
                )}
                {entry.payload && typeof entry.payload === 'object' && entry.payload.amountCents != null && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amount: {(entry.payload.amountCents / 100).toLocaleString()} {entry.payload.currency ?? 'RWF'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
