import { AlertCircle, ArrowRight, AlertTriangle, AlertOctagon, Info } from 'lucide-react'

export interface FinancialAttentionItem {
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action: string
  link: string
}

interface Props {
  items: FinancialAttentionItem[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function FinancialAttentionCenter({ items, loading, onNavigate }: Props) {
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
        <h3 className="text-base font-bold text-slate-900 mb-2">Financial Attention Center</h3>
        <p className="text-sm text-slate-400">No financial items requiring attention. All systems operational.</p>
      </div>
    )
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sorted = [...items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Financial Attention Center</h3>

      <ul className="space-y-2">
        {sorted.map((item, i) => {
          const config = severityConfig(item.severity)
          return (
            <li
              key={i}
              className={`rounded-xl border p-3 ${config.bg} ${config.border} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => onNavigate?.(item.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(item.link) }}
            >
              <div className="flex items-start gap-3">
                {config.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>{item.severity}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-blue-600 font-medium">{item.action}</span>
                    <ArrowRight className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function severityConfig(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        icon: <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />,
      }
    case 'HIGH':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-700',
        icon: <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />,
      }
    case 'MEDIUM':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />,
      }
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />,
      }
  }
}
