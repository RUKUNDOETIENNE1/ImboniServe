import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import type { HealthStatus } from './KpiCard'

export interface HealthScoreData {
  score: number
  status: HealthStatus
  explanation: string
}

interface HealthOverviewProps {
  scores: Record<string, HealthScoreData> & {
    overall?: { score: number; status: HealthStatus }
  }
  loading?: boolean
}

const statusConfig = {
  HEALTHY: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  WARNING: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  CRITICAL: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
}

const labelMap: Record<string, string> = {
  growth: 'Growth',
  revenue: 'Revenue',
  operations: 'Operations',
  founderEcosystem: 'Founder Ecosystem',
  restaurantEcosystem: 'Restaurant Ecosystem',
  customerSuccess: 'Customer Success',
  financialHealth: 'Financial Health',
  overall: 'Overall',
}

export default function HealthOverview({ scores, loading }: HealthOverviewProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const entries = Object.entries(scores).filter(([, v]) => v && typeof v.score === 'number')
  const overall = scores.overall

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Company Health Overview</h3>

      {/* Overall Score */}
      {overall && (
        <div className={`rounded-xl p-4 mb-4 ring-2 ${statusConfig[overall.status].bg} ${statusConfig[overall.status].ring}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = statusConfig[overall.status].icon
                return <Icon className={`w-6 h-6 ${statusConfig[overall.status].color}`} />
              })()}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overall Health</p>
                <p className={`text-2xl font-bold ${statusConfig[overall.status].color}`}>{overall.score}/100</p>
              </div>
            </div>
            <span className={`text-sm font-medium ${statusConfig[overall.status].color}`}>
              {overall.status}
            </span>
          </div>
        </div>
      )}

      {/* Individual Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entries
          .filter(([key]) => key !== 'overall')
          .map(([key, data]) => {
            const d = data as HealthScoreData
            const Icon = statusConfig[d.status].icon
            return (
              <div
                key={key}
                className={`rounded-xl p-3 ring-1 ${statusConfig[d.status].bg} ${statusConfig[d.status].ring}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${statusConfig[d.status].color}`} />
                  <p className="text-xs font-medium text-slate-600">{labelMap[key] || key}</p>
                </div>
                <p className={`text-lg font-bold ${statusConfig[d.status].color}`}>{d.score}</p>
                <p className="text-xs text-slate-400 mt-1 leading-tight">{d.explanation}</p>
              </div>
            )
          })}
      </div>
    </div>
  )
}
