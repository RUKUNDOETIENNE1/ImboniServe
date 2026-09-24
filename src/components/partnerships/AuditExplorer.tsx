import { History, User, Edit, CheckCircle, XCircle, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface AuditEntry {
  id: string
  action: string
  actorId?: string | null
  oldValue?: string | null
  newValue?: string | null
  metadata?: any
  createdAt: string
}

interface AuditExplorerProps {
  entries: AuditEntry[]
  total: number
  page: number
  limit: number
  onPageChange?: (page: number) => void
}

function formatAction(action: string): string {
  return action.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

function getActionIcon(action: string) {
  if (action.includes('APPROVED') || action.includes('ACTIVATED') || action.includes('REACTIVATED'))
    return <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
  if (action.includes('REJECTED') || action.includes('SUSPENDED') || action.includes('TERMINATED') || action.includes('CLAWED'))
    return <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('AMENDED'))
    return <Edit className="w-4 h-4 text-amber-600" aria-hidden="true" />
  return <History className="w-4 h-4 text-slate-400" aria-hidden="true" />
}

export default function AuditExplorer({ entries, total, page, limit, onPageChange }: AuditExplorerProps) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter.trim()) return entries
    const q = filter.toLowerCase()
    return entries.filter((e) =>
      e.action.toLowerCase().includes(q) ||
      (e.actorId?.toLowerCase().includes(q)) ||
      (e.oldValue?.toLowerCase().includes(q)) ||
      (e.newValue?.toLowerCase().includes(q))
    )
  }, [entries, filter])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Audit Center</h3>
        </div>
        <span className="text-xs text-slate-500">{total} record{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter audit records..."
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          aria-label="Filter audit records"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No audit records found.</p>
      ) : (
        <>
          <div className="space-y-0" role="list" aria-label="Audit records">
            {filtered.slice(0, 30).map((entry, idx) => {
              const isLast = idx === filtered.length - 1
              return (
                <div key={entry.id} className="flex gap-3" role="listitem">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getActionIcon(entry.action)}
                    </div>
                    {!isLast && <div className="w-px h-full bg-slate-200" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700">{formatAction(entry.action)}</p>
                      <time className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(entry.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {entry.actorId && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" aria-hidden="true" />
                          {entry.actorId.slice(-8)}
                        </span>
                      )}
                    </div>
                    {(entry.oldValue || entry.newValue) && (
                      <div className="mt-1 text-xs flex items-center gap-2">
                        {entry.oldValue && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 line-through">
                            {entry.oldValue.slice(0, 40)}
                          </span>
                        )}
                        {entry.newValue && (
                          <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                            {entry.newValue.slice(0, 40)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
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
