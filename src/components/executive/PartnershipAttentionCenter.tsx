import { AlertOctagon, ArrowRight } from 'lucide-react'

export interface PartnershipAttentionItem {
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  link: string
}

interface Props {
  items: PartnershipAttentionItem[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

const severityConfig = {
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
}

export default function PartnershipAttentionCenter({ items, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Partnership Attention Center</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No items require attention at this time.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const config = severityConfig[item.severity]
            return (
              <button
                key={i}
                onClick={() => onNavigate?.(item.link)}
                className={`flex items-start gap-3 w-full rounded-xl border ${config.border} ${config.bg} p-4 hover:shadow-md transition-all text-left`}
              >
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} mt-2`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{item.description}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.action}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
