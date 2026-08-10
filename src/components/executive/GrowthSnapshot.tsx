import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'

export interface GrowthSnapshotData {
  revenueTrend: 'UP' | 'DOWN' | 'FLAT'
  revenueChangePercent: number
  newCustomers: number
  churnedCustomers: number
  netCustomerChange: number
  newSubscriptions: number
  cancellations: number
  churnRate: number
  activeBusinesses: number
  activePartners: number
  regionalPerformance: Array<{ region: string; _count: number; _sum: { totalRevenueCents?: number } }>
}

interface GrowthSnapshotProps {
  data: GrowthSnapshotData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const trendIcon = { UP: TrendingUp, DOWN: TrendingDown, FLAT: Minus }
const trendColor = { UP: 'text-emerald-600', DOWN: 'text-red-600', FLAT: 'text-slate-500' }

export default function GrowthSnapshot({ data, loading, onNavigate }: GrowthSnapshotProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Growth data unavailable.</p>
      </div>
    )
  }

  const RevenueIcon = trendIcon[data.revenueTrend]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Growth Snapshot</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <button
          type="button"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <RevenueIcon className={`w-3.5 h-3.5 ${trendColor[data.revenueTrend]}`} />
            <p className="text-xs text-slate-500">Revenue Growth</p>
          </div>
          <p className={`text-xl font-bold ${trendColor[data.revenueTrend]}`}>
            {data.revenueChangePercent >= 0 ? '+' : ''}{data.revenueChangePercent.toFixed(1)}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs text-slate-500">Net New Customers</p>
          </div>
          <p className={`text-xl font-bold ${data.netCustomerChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.netCustomerChange >= 0 ? '+' : ''}{data.netCustomerChange}
          </p>
          <p className="text-xs text-slate-400">{data.newCustomers} new, {data.churnedCustomers} churned</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-xs text-slate-500">Subscription Churn</p>
          </div>
          <p className={`text-xl font-bold ${data.churnRate <= 5 ? 'text-emerald-600' : data.churnRate <= 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {data.churnRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">{data.newSubscriptions} new, {data.cancellations} cancelled</p>
        </button>
      </div>

      {/* Regional Performance */}
      {data.regionalPerformance.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Regional Performance</p>
          <ul className="space-y-1">
            {data.regionalPerformance.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{r.region || 'Unknown'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{r._count} partners</span>
                  <span className="font-medium text-slate-900">
                    {Math.round((r._sum.totalRevenueCents || 0) / 100).toLocaleString()} RWF
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
