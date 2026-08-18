import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import KpiCard from './KpiCard'

export interface RevenueOverviewData {
  mrr: number
  mrrChange: number
  mrrStatus: string
  arr: number
  arrChange: number
  gmv: number
  gmvChange: number
  subscriptionRevenue: number
  marketplaceRevenue: number
  directSalesRevenue: number
  growthRate30d: number
  growthRate90d: number
  growthStatus: string
  mrrTrend: number[]
  forecastVariance: number
}

interface Props {
  data: RevenueOverviewData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RevenueOverview({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <p className="text-sm text-slate-400">Revenue overview unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Revenue Overview</h3>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="MRR"
          value={`${Math.round(data.mrr).toLocaleString()} RWF`}
          trend={data.mrrChange >= 2 ? 'UP' : data.mrrChange <= -2 ? 'DOWN' : 'FLAT'}
          trendValue={`${data.mrrChange >= 0 ? '+' : ''}${data.mrrChange.toFixed(1)}%`}
          status={data.mrrStatus === 'GROWTH' ? 'HEALTHY' : data.mrrStatus === 'DECLINE' ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="ARR"
          value={`${Math.round(data.arr).toLocaleString()} RWF`}
          trend={data.arrChange >= 2 ? 'UP' : data.arrChange <= -2 ? 'DOWN' : 'FLAT'}
          trendValue={`${data.arrChange >= 0 ? '+' : ''}${data.arrChange.toFixed(1)}%`}
          status={data.mrrStatus === 'GROWTH' ? 'HEALTHY' : data.mrrStatus === 'DECLINE' ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="GMV (30d)"
          value={`${Math.round(data.gmv).toLocaleString()} RWF`}
          trend={data.gmvChange >= 0 ? 'UP' : 'DOWN'}
          trendValue={`${data.gmvChange >= 0 ? '+' : ''}${data.gmvChange.toFixed(1)}%`}
          drillDownHref="/admin/revenue-operations"
          onClick={() => onNavigate?.('/admin/revenue-operations')}
        />
        <KpiCard
          label="Growth Rate"
          value={`${data.growthRate30d.toFixed(1)}%`}
          status={data.growthStatus === 'STRONG' || data.growthStatus === 'MODERATE' ? 'HEALTHY' : data.growthStatus === 'NEGATIVE' ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
      </div>

      {/* Revenue by Source */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue by Source (30d)</p>
        <div className="space-y-2">
          <RevenueBar label="Subscription" value={data.subscriptionRevenue} total={data.subscriptionRevenue + data.marketplaceRevenue + data.directSalesRevenue} color="bg-blue-500" />
          <RevenueBar label="Marketplace" value={data.marketplaceRevenue} total={data.subscriptionRevenue + data.marketplaceRevenue + data.directSalesRevenue} color="bg-purple-500" />
          <RevenueBar label="Direct Sales" value={data.directSalesRevenue} total={data.subscriptionRevenue + data.marketplaceRevenue + data.directSalesRevenue} color="bg-emerald-500" />
        </div>
      </div>

      {/* Forecast Variance */}
      <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-50">
        <div>
          <p className="text-xs text-slate-500">Forecast Variance (30d vs 90d)</p>
          <p className="text-sm font-medium text-slate-900">
            {data.forecastVariance >= 0 ? '+' : ''}{data.forecastVariance.toFixed(1)}%
          </p>
        </div>
        <div className={`flex items-center gap-1 ${data.forecastVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {data.forecastVariance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-xs">{data.forecastVariance >= 0 ? 'Ahead' : 'Behind'}</span>
        </div>
      </div>

      {/* MRR Trend Sparkline */}
      {data.mrrTrend.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">MRR Trend (6 months)</p>
          <Sparkline data={data.mrrTrend} />
        </div>
      )}

      {/* Drill-down link */}
      <button
        onClick={() => onNavigate?.('/admin/revenue-operations')}
        className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Revenue Operations</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function RevenueBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{Math.round(value).toLocaleString()} RWF ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
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
