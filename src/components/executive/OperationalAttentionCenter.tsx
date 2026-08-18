import { ArrowRight, AlertOctagon } from 'lucide-react'

export interface AttentionItem {
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  link: string
}

interface Props {
  items: AttentionItem[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function OperationalAttentionCenter({ items, loading, onNavigate }: Props) {
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

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Operational Attention Center</h3>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <AlertOctagon className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-emerald-900">No operational items require attention. All systems are running smoothly.</p>
        </div>
      </div>
    )
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sorted = [...items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const severityConfig = {
    CRITICAL: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: 'text-red-500' },
    HIGH: { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-500' },
    MEDIUM: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
    LOW: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500' },
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Operational Attention Center</h3>

      <div className="space-y-2">
        {sorted.map((item, i) => {
          const cfg = severityConfig[item.severity]
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${cfg.bg} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => onNavigate?.(item.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(item.link) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{item.severity}</span>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{item.description}</p>
                  <p className="text-xs text-slate-500">Action: <span className="font-medium">{item.action}</span></p>
                </div>
                <ArrowRight className={`w-4 h-4 ${cfg.icon} flex-shrink-0 mt-1`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
