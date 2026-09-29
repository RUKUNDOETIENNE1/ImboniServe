import { Heart, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

export interface CustomerHealthCenterData {
  overallHealthScore: number
  healthDistribution: {
    excellent: number
    healthy: number
    atRisk: number
    critical: number
  }
  highRiskBusinesses: number
  improvingBusinesses: number
  decliningBusinesses: number
  healthTrends: { label: string; value: string; trend: 'UP' | 'DOWN' | 'FLAT' }[]
}

interface Props {
  data: CustomerHealthCenterData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CustomerHealthCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Customer health center unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const total = data.healthDistribution.excellent + data.healthDistribution.healthy + data.healthDistribution.atRisk + data.healthDistribution.critical
  const healthStatus = data.overallHealthScore >= 70 ? 'HEALTHY' : data.overallHealthScore >= 40 ? 'WARNING' : 'CRITICAL'

  const segments = [
    { label: 'Excellent', count: data.healthDistribution.excellent, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { label: 'Healthy', count: data.healthDistribution.healthy, color: 'bg-teal-500', textColor: 'text-teal-600' },
    { label: 'At Risk', count: data.healthDistribution.atRisk, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { label: 'Critical', count: data.healthDistribution.critical, color: 'bg-red-500', textColor: 'text-red-600' },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-600" />
        <h3 className="text-base font-bold text-slate-900">Customer Health Center</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Overall Health Score</p>
          <p className={`text-2xl font-bold ${healthStatus === 'HEALTHY' ? 'text-emerald-600' : healthStatus === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>
            {data.overallHealthScore}
          </p>
          <p className="text-xs text-slate-400">/100</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <p className="text-xs text-slate-500">High-Risk Businesses</p>
          </div>
          <p className="text-xl font-bold text-red-700">{data.highRiskBusinesses}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs text-slate-500">Improving</p>
          </div>
          <p className="text-xl font-bold text-emerald-700">{data.improvingBusinesses}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-slate-500">Declining</p>
          </div>
          <p className="text-xl font-bold text-amber-700">{data.decliningBusinesses}</p>
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Health Distribution</p>
        <div className="flex h-6 rounded-full overflow-hidden bg-slate-100">
          {segments.map((seg) => {
            const pct = total > 0 ? (seg.count / total) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={seg.label}
                className={`${seg.color} flex items-center justify-center text-xs text-white font-medium`}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
              >
                {pct > 8 ? seg.count : ''}
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
              <span className="text-xs text-slate-600">{seg.label}: {seg.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Health Drivers</p>
        <div className="space-y-2">
          {data.healthTrends.map((trend, i) => (
            <button
              key={i}
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium text-slate-900">{trend.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700">{trend.value}</span>
                {trend.trend === 'UP' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {trend.trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend.trend === 'FLAT' && <Minus className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
