import { AlertTriangle, ArrowRight } from 'lucide-react'

export interface AttentionItem {
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  link: string
}

interface AttentionCenterProps {
  items: AttentionItem[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

const severityConfig = {
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
}

export default function AttentionCenter({ items, loading, onNavigate }: AttentionCenterProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-bold text-slate-900">Attention Center</h3>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-medium text-slate-400">{items.length} items</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No items requiring attention. All systems operational.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const cfg = severityConfig[item.severity]
            return (
              <li key={i} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {item.severity}
                      </span>
                      <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{item.description}</p>
                    <button
                      type="button"
                      onClick={() => onNavigate?.(item.link)}
                      className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color} hover:underline`}
                    >
                      {item.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
