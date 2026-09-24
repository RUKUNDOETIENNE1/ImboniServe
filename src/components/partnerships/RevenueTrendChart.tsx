import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'

interface RevenueTrendChartProps {
  trend: Array<{ month: string; revenueCents: number }>
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K`
  return `${(cents / 100).toLocaleString()}`
}

export default function RevenueTrendChart({ trend }: RevenueTrendChartProps) {
  if (!trend || trend.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3>
        </div>
        <p className="text-sm text-slate-400">No trend data available.</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...trend.map((t) => t.revenueCents), 1)
  const first = trend[0]?.revenueCents ?? 0
  const last = trend[trend.length - 1]?.revenueCents ?? 0
  const isGrowing = last > first
  const isStable = last === first

  const TrendIcon = isGrowing ? TrendingUp : isStable ? Minus : TrendingDown
  const trendColor = isGrowing ? 'text-green-600' : isStable ? 'text-slate-400' : 'text-red-600'
  const trendBg = isGrowing ? 'bg-green-50' : isStable ? 'bg-slate-50' : 'bg-red-50'
  const trendLabel = isGrowing ? 'GROWING' : isStable ? 'STABLE' : 'DECLINING'

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendBg}`} aria-label={`Revenue trend: ${trendLabel}`}>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={`text-xs font-bold ${trendColor}`}>{trendLabel}</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-32 mb-3" role="img" aria-label="Monthly revenue trend">
        {trend.map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col justify-end h-full">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500"
                style={{ height: `${(t.revenueCents / maxRevenue) * 100}%`, minHeight: '4px' }}
              />
            </div>
            <span className="text-xs text-slate-400 mt-1.5">{t.month.split('-')[1]}</span>
            <span className="text-xs text-slate-500 font-medium">{formatCurrency(t.revenueCents)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
