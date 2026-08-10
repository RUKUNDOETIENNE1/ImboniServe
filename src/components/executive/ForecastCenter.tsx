import { TrendingUp, TrendingDown, ArrowRight, Gauge } from 'lucide-react'
import KpiCard from './KpiCard'

export interface ForecastData {
  expectedMRR: number
  expectedARR: number
  revenueGrowthRate30d: number
  revenueGrowthRate90d: number
  growthStatus: string
  mrrTrend: number[]
  confidence: number
}

interface Props {
  data: ForecastData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function ForecastCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Forecast data unavailable.</p>
      </div>
    )
  }

  const confidenceColor = data.confidence >= 75 ? 'text-emerald-600' : data.confidence >= 50 ? 'text-amber-600' : 'text-red-600'
  const confidenceBg = data.confidence >= 75 ? 'bg-emerald-50 border-emerald-200' : data.confidence >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Forecast Center</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Expected MRR (next)"
          value={`${Math.round(data.expectedMRR).toLocaleString()} RWF`}
          trend={data.revenueGrowthRate30d >= 0 ? 'UP' : 'DOWN'}
          trendValue={`${data.revenueGrowthRate30d >= 0 ? '+' : ''}${data.revenueGrowthRate30d.toFixed(1)}%`}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="Expected ARR"
          value={`${Math.round(data.expectedARR).toLocaleString()} RWF`}
          trend={data.revenueGrowthRate30d >= 0 ? 'UP' : 'DOWN'}
          trendValue={`${data.revenueGrowthRate30d >= 0 ? '+' : ''}${data.revenueGrowthRate30d.toFixed(1)}%`}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="Growth Rate (30d)"
          value={`${data.revenueGrowthRate30d.toFixed(1)}%`}
          status={data.growthStatus === 'STRONG' || data.growthStatus === 'MODERATE' ? 'HEALTHY' : data.growthStatus === 'NEGATIVE' ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="Growth Rate (90d)"
          value={`${data.revenueGrowthRate90d.toFixed(1)}%`}
          status={data.growthStatus === 'STRONG' || data.growthStatus === 'MODERATE' ? 'HEALTHY' : data.growthStatus === 'NEGATIVE' ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
      </div>

      {/* MRR Trend Sparkline */}
      {data.mrrTrend.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">MRR Trend (6 months)</p>
          <Sparkline data={data.mrrTrend} />
        </div>
      )}

      {/* Scenario comparison */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <ScenarioCard
          label="Conservative"
          value={Math.round(data.expectedMRR * 0.9).toLocaleString()}
          note="-10% scenario"
        />
        <ScenarioCard
          label="Base Case"
          value={Math.round(data.expectedMRR).toLocaleString()}
          note="Current trend"
          highlighted
        />
        <ScenarioCard
          label="Optimistic"
          value={Math.round(data.expectedMRR * 1.1).toLocaleString()}
          note="+10% scenario"
        />
      </div>

      {/* Forecast confidence */}
      <div className={`rounded-xl border p-3 mb-3 ${confidenceBg}`}>
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-slate-600" />
          <div className="flex-1">
            <p className="text-xs text-slate-500">Forecast Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${data.confidence >= 75 ? 'bg-emerald-500' : data.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${data.confidence}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${confidenceColor}`}>{data.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down */}
      <button
        onClick={() => onNavigate?.('/admin/revenue-analytics')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Revenue Intelligence</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function ScenarioCard({ label, value, note, highlighted }: { label: string; value: string; note: string; highlighted?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlighted ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${highlighted ? 'text-blue-700' : 'text-slate-900'}`}>{value} RWF</p>
      <p className="text-xs text-slate-400">{note}</p>
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 200
  const height = 40
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
      />
    </svg>
  )
}
