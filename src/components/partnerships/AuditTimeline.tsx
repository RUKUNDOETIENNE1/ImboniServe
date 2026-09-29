import { History, User, Edit, CheckCircle, XCircle } from 'lucide-react'

export interface AuditEntry {
  id: string
  action: string
  performedBy: string
  oldValue: string | null
  newValue: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string | Date
}

interface AuditTimelineProps {
  entries: AuditEntry[]
  loading?: boolean
}

function getActionIcon(action: string) {
  if (action.includes('APPROVED') || action.includes('ACTIVATED') || action.includes('REACTIVATED')) {
    return <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
  }
  if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('TERMINATED') || action.includes('CLAWED')) {
    return <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
  }
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('AMENDED')) {
    return <Edit className="w-4 h-4 text-amber-600" aria-hidden="true" />
  }
  return <History className="w-4 h-4 text-slate-400" aria-hidden="true" />
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export default function AuditTimeline({ entries, loading }: AuditTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading audit trail">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History className="w-8 h-8 text-slate-300 mb-2" aria-hidden="true" />
        <p className="text-sm text-slate-500">No audit records</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Audit trail">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th scope="col" className="py-2 px-3 font-medium text-slate-600">Action</th>
            <th scope="col" className="py-2 px-3 font-medium text-slate-600">From</th>
            <th scope="col" className="py-2 px-3 font-medium text-slate-600">To</th>
            <th scope="col" className="py-2 px-3 font-medium text-slate-600">Performed By</th>
            <th scope="col" className="py-2 px-3 font-medium text-slate-600">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const date = typeof entry.createdAt === 'string' ? new Date(entry.createdAt) : entry.createdAt
            return (
              <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {getActionIcon(entry.action)}
                    <span className="font-medium text-slate-800">{formatAction(entry.action)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{entry.oldValue || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{entry.newValue || '—'}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="text-xs">{entry.performedBy || 'System'}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-slate-500 text-xs" title={date.toLocaleString()}>
                  <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
