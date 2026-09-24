import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'

interface GrowthTrendChartProps {
  trend: 'UP' | 'DOWN' | 'STABLE'
  healthScore: number
  grade: string
  signups: number
  conversions: number
  revenueCents: number
}

export default function GrowthTrendChart({
  trend,
  healthScore,
  grade,
  signups,
  conversions,
  revenueCents,
}: GrowthTrendChartProps) {
  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus
  const trendColor = trend === 'UP' ? 'text-green-600' : trend === 'DOWN' ? 'text-red-600' : 'text-slate-400'
  const trendBg = trend === 'UP' ? 'bg-green-50' : trend === 'DOWN' ? 'bg-red-50' : 'bg-slate-50'

  const conversionRate = signups > 0 ? (conversions / signups) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Growth Trend</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendBg}`} aria-label={`Growth trend: ${trend}`}>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={`text-xs font-bold ${trendColor}`}>{trend}</span>
        </div>
      </div>

      {/* Health score gauge */}
      <div className="flex items-baseline gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Health Score</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${
              healthScore >= 80 ? 'text-green-600'
              : healthScore >= 60 ? 'text-blue-600'
              : healthScore >= 40 ? 'text-amber-600'
              : 'text-red-600'
            }`}>
              {healthScore}
            </span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded ${
              grade === 'A' ? 'bg-green-100 text-green-700'
              : grade === 'B' ? 'bg-blue-100 text-blue-700'
              : grade === 'C' ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
            }`}>
              {grade}
            </span>
          </div>
        </div>
      </div>

      {/* Key growth metrics */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Signups</p>
          <p className="text-lg font-bold text-slate-700">{signups.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Conversions</p>
          <p className="text-lg font-bold text-slate-700">{conversions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Conv. Rate</p>
          <p className={`text-lg font-bold ${
            conversionRate >= 20 ? 'text-green-600'
            : conversionRate >= 10 ? 'text-blue-600'
            : 'text-amber-600'
          }`}>
            {conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
