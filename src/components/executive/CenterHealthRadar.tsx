import { Radar, ArrowRight } from 'lucide-react'

export interface CenterHealthRadarData {
  centers: Array<{
    name: string
    score: number
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    link: string
  }>
}

interface Props {
  data: CenterHealthRadarData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const statusConfig = {
  HEALTHY: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  WARNING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
}

export default function CenterHealthRadar({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Center health radar unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Radar className="w-5 h-5 text-sky-600" />
        <h3 className="text-base font-bold text-slate-900">Center Health Radar</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.centers.length} centers</span>
      </div>

      {data.centers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No center data available.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.centers.map((center, i) => {
            const cfg = statusConfig[center.status]
            return (
              <li key={i} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{center.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {center.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(Math.max(center.score, 0), 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${cfg.color}`}>{center.score}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(center.link)}
                    className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color} hover:underline shrink-0`}
                  >
                    Drill down
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
