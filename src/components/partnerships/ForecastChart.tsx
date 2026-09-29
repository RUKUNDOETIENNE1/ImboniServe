import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'

interface ForecastData {
  nextMonthRevenue: number
  nextMonthCommission: number
  expectedPayoutVolume: number
  projectedPartnerGrowth: number
  recurringRevenueTrend: 'GROWING' | 'DECLINING' | 'STABLE'
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  actual: { currentMrrCents: number; lastMonthRevenueCents: number }
  projected: { nextMonthRevenueCents: number; nextMonthCommissionCents: number; expectedPayoutVolumeCents: number }
}

interface ForecastChartProps {
  forecast: ForecastData
  trend: Array<{ month: string; revenueCents: number }>
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M RWF`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K RWF`
  return `${(cents / 100).toLocaleString()} RWF`
}

export default function ForecastChart({ forecast, trend }: ForecastChartProps) {
  const TrendIcon = forecast.recurringRevenueTrend === 'GROWING' ? TrendingUp
    : forecast.recurringRevenueTrend === 'DECLINING' ? TrendingDown : Minus
  const trendColor = forecast.recurringRevenueTrend === 'GROWING' ? 'text-green-600'
    : forecast.recurringRevenueTrend === 'DECLINING' ? 'text-red-600' : 'text-slate-400'
  const trendBg = forecast.recurringRevenueTrend === 'GROWING' ? 'bg-green-50'
    : forecast.recurringRevenueTrend === 'DECLINING' ? 'bg-red-50' : 'bg-slate-50'

  const confidenceColor = forecast.confidenceLevel === 'HIGH' ? 'text-green-600 bg-green-50'
    : forecast.confidenceLevel === 'MEDIUM' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

  const maxRevenue = Math.max(...trend.map((t) => t.revenueCents), forecast.nextMonthRevenue, 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Revenue Forecasting</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendBg}`} aria-label={`Revenue trend: ${forecast.recurringRevenueTrend}`}>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span className={`text-xs font-bold ${trendColor}`}>{forecast.recurringRevenueTrend}</span>
        </div>
      </div>

      {/* Confidence level */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500">Confidence Level</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${confidenceColor}`}>
          {forecast.confidenceLevel}
        </span>
      </div>

      {/* Actual vs Projected */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Actual (Current MRR)</p>
          <p className="text-lg font-bold text-slate-700">{formatCurrency(forecast.actual.currentMrrCents)}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-500 mb-1">Projected Next Month</p>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(forecast.projected.nextMonthRevenueCents)}</p>
        </div>
      </div>

      {/* Bar chart trend */}
      {trend.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-600 mb-2">6-Month Revenue Trend</p>
          <div className="flex items-end gap-2 h-24" role="img" aria-label="Revenue trend chart">
            {trend.map((t) => (
              <div key={t.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-400 rounded-t transition-all duration-500"
                  style={{ height: `${(t.revenueCents / maxRevenue) * 100}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-slate-400 mt-1">{t.month.split('-')[1]}</span>
              </div>
            ))}
            {/* Projected next month */}
            <div className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-300 rounded-t border-2 border-dashed border-blue-400 transition-all duration-500"
                style={{ height: `${(forecast.nextMonthRevenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                aria-label="Projected next month"
              />
              <span className="text-xs text-blue-500 mt-1 font-medium">→</span>
            </div>
          </div>
        </div>
      )}

      {/* Additional projections */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
        <div>
          <p className="text-slate-500">Commission</p>
          <p className="font-bold text-slate-700">{formatCurrency(forecast.nextMonthCommission)}</p>
        </div>
        <div>
          <p className="text-slate-500">Payout Volume</p>
          <p className="font-bold text-slate-700">{formatCurrency(forecast.expectedPayoutVolume)}</p>
        </div>
        <div>
          <p className="text-slate-500">Growth</p>
          <p className={`font-bold ${forecast.projectedPartnerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {forecast.projectedPartnerGrowth >= 0 ? '+' : ''}{forecast.projectedPartnerGrowth}%
          </p>
        </div>
      </div>
    </div>
  )
}
