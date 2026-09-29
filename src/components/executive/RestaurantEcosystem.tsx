import { Building2, TrendingUp, Heart, ArrowRight } from 'lucide-react'

export interface RestaurantEcosystemData {
  activeBusinesses: number
  topPerformer: { id: string; name: string; score: number } | null
  bottomPerformer: { id: string; name: string; score: number } | null
  newSubscriptions: number
  failedRenewals: number
  inGrace: number
  customerHealthDistribution: {
    excellent: number
    healthy: number
    atRisk: number
    critical: number
  }
  activeCustomers: number
}

interface RestaurantEcosystemProps {
  data: RestaurantEcosystemData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RestaurantEcosystem({ data, loading, onNavigate }: RestaurantEcosystemProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4" />
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
        <p className="text-sm text-slate-400">Hospitality business ecosystem data unavailable.</p>
      </div>
    )
  }

  const totalCustomers = data.activeCustomers || 0
  const atRiskPercent = totalCustomers > 0
    ? Math.round(((data.customerHealthDistribution.atRisk + data.customerHealthDistribution.critical) / totalCustomers) * 100)
    : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Hospitality Business Ecosystem</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <button
          type="button"
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs text-slate-500">Active Businesses</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.activeBusinesses}</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs text-slate-500">New Subscriptions</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.newSubscriptions}</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-3.5 h-3.5 text-red-500" />
            <p className="text-xs text-slate-500">At-Risk Customers</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{atRiskPercent}%</p>
        </button>
      </div>

      {/* Branch Performance */}
      {(data.topPerformer || data.bottomPerformer) && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Branch Performance</p>
          {data.topPerformer && (
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700">{data.topPerformer.name}</span>
                <span className="text-xs text-emerald-600 font-medium">Top</span>
              </div>
              <span className="font-medium text-slate-900">{data.topPerformer.score}/100</span>
            </div>
          )}
          {data.bottomPerformer && (
            <div className="flex items-center justify-between text-sm py-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-700">{data.bottomPerformer.name}</span>
                <span className="text-xs text-red-600 font-medium">Needs Attention</span>
              </div>
              <span className="font-medium text-slate-900">{data.bottomPerformer.score}/100</span>
            </div>
          )}
        </div>
      )}

      {/* Customer Health Distribution */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Customer Health</p>
        <div className="flex items-center gap-1 h-6 rounded-full overflow-hidden bg-slate-100">
          {totalCustomers > 0 && (
            <>
              <div className="bg-emerald-500 h-full" style={{ width: `${(data.customerHealthDistribution.excellent / totalCustomers) * 100}%` }} />
              <div className="bg-emerald-300 h-full" style={{ width: `${(data.customerHealthDistribution.healthy / totalCustomers) * 100}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${(data.customerHealthDistribution.atRisk / totalCustomers) * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${(data.customerHealthDistribution.critical / totalCustomers) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Excellent ({data.customerHealthDistribution.excellent})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" /> Healthy ({data.customerHealthDistribution.healthy})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> At Risk ({data.customerHealthDistribution.atRisk})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical ({data.customerHealthDistribution.critical})</span>
        </div>
      </div>

      {data.failedRenewals > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-red-50 border border-red-100">
          <p className="text-xs text-red-700">
            {data.failedRenewals} failed renewal(s) in the last 24 hours
          </p>
        </div>
      )}
    </div>
  )
}
