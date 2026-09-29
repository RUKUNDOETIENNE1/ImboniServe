import { ArrowRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export interface OperationalHealthArea {
  area: string
  health: string
  trend: string
  risk: string
  link: string
}

interface Props {
  areas: OperationalHealthArea[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function OperationalHealthCenter({ areas, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!areas || areas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Operational Health Center</h3>
        <p className="text-sm text-slate-400">No operational health data available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Operational Health Center</h3>

      <div className="space-y-2">
        {areas.map((area, i) => {
          const icon = area.health === 'HEALTHY'
            ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            : area.health === 'WARNING'
            ? <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />

          const badge = area.health === 'HEALTHY'
            ? 'bg-emerald-100 text-emerald-700'
            : area.health === 'WARNING'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'

          const trendColor = area.trend === 'UP' ? 'text-emerald-600' : area.trend === 'DOWN' ? 'text-red-600' : 'text-slate-500'

          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onNavigate?.(area.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(area.link) }}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <p className="text-sm font-medium text-slate-900">{area.area}</p>
                  <p className="text-xs text-slate-500">{area.risk}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${trendColor}`}>{area.trend}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badge}`}>{area.health}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
