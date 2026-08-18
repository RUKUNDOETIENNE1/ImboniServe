import { Activity, Bell, CheckCircle, FileText, RefreshCw, AlertTriangle } from 'lucide-react'

export interface TimelineEntry {
  type: 'activity' | 'event'
  id: string
  timestamp: string | Date
  activityType?: string
  eventType?: string
  description?: string
  metadata?: Record<string, unknown> | null
  payload?: Record<string, unknown> | null
  triggeredBy?: string | null
}

interface TimelineProps {
  entries: TimelineEntry[]
  loading?: boolean
  emptyMessage?: string
}

function formatTimestamp(ts: string | Date): { relative: string; absolute: string } {
  const date = typeof ts === 'string' ? new Date(ts) : ts
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  let relative: string
  if (diffMin < 1) relative = 'Just now'
  else if (diffMin < 60) relative = `${diffMin}m ago`
  else if (diffHr < 24) relative = `${diffHr}h ago`
  else if (diffDay < 7) relative = `${diffDay}d ago`
  else relative = date.toLocaleDateString()

  return {
    relative,
    absolute: date.toLocaleString(),
  }
}

function getEntryIcon(entry: TimelineEntry) {
  const type = entry.activityType || entry.eventType || ''
  if (type.includes('APPROVED') || type.includes('PAID') || type.includes('SIGNED') || type.includes('ACTIVATED')) {
    return <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
  }
  if (type.includes('REJECTED') || type.includes('SUSPENDED') || type.includes('TERMINATED') || type.includes('FAILED') || type.includes('CLAWED')) {
    return <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
  }
  if (type.includes('SUBMITTED') || type.includes('CREATED') || type.includes('NOTE')) {
    return <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
  }
  if (type.includes('REVIEW') || type.includes('UPDATED') || type.includes('CHANGED')) {
    return <RefreshCw className="w-4 h-4 text-amber-600" aria-hidden="true" />
  }
  return <Activity className="w-4 h-4 text-slate-400" aria-hidden="true" />
}

export default function Timeline({ entries, loading, emptyMessage = 'No activity yet' }: TimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading timeline">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bell className="w-8 h-8 text-slate-300 mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ol className="space-y-1" role="feed" aria-label="Activity timeline">
      {entries.map((entry, idx) => {
        const { relative, absolute } = formatTimestamp(entry.timestamp)
        const label = entry.description || entry.eventType || entry.activityType || 'Event'
        const actor = entry.triggeredBy || 'System'

        return (
          <li key={`${entry.type}-${entry.id}-${idx}`} className="flex gap-3 py-2.5">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                {getEntryIcon(entry)}
              </div>
              {idx < entries.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-800">{label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    entry.type === 'activity'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-purple-50 text-purple-600'
                  }`}
                >
                  {entry.type}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <time
                  className="text-xs text-slate-500"
                  dateTime={typeof entry.timestamp === 'string' ? entry.timestamp : entry.timestamp.toISOString()}
                  title={absolute}
                >
                  {relative}
                </time>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">by {actor}</span>
              </div>
              {entry.description && entry.type === 'event' && (
                <p className="text-xs text-slate-500 mt-1">{entry.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
