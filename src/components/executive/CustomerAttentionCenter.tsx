import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'

export interface CustomerAttentionData {
  items: Array<{
    title: string
    description: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    action: string
    link: string
  }>
}

interface Props {
  data: CustomerAttentionData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const severityConfig = {
  CRITICAL: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'CRITICAL' },
  HIGH: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', label: 'HIGH' },
  MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'MEDIUM' },
  LOW: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'LOW' },
}

const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function CustomerAttentionCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Customer Attention Center</h3>
        </div>
        <p className="text-sm text-emerald-700">All clear. No customer success items require immediate attention.</p>
      </div>
    )
  }

  const sorted = [...data.items].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="text-base font-bold text-slate-900">Customer Attention Center</h3>
        <span className="ml-auto text-xs font-medium text-slate-500">{data.items.length} item{data.items.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {sorted.map((item, i) => {
          const config = severityConfig[item.severity]
          return (
            <button
              key={i}
              onClick={() => onNavigate?.(item.link)}
              className={`block w-full text-left rounded-xl border ${config.border} ${config.bg} p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${config.color} flex-shrink-0`} />
              </div>
              <p className="text-sm text-slate-600 mb-2">{item.description}</p>
              <p className="text-xs">
                <span className="text-slate-400">Action: </span>
                <span className="font-medium text-slate-700">{item.action}</span>
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
