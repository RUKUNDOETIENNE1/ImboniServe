import { ArrowRight } from 'lucide-react'

export interface RevenueQualityData {
  bySource: { subscription: number; marketplace: number; directSales: number; total: number }
  concentration: { rate: number; status: string }
  topContributors: Array<{ customerId: string; customerName: string; revenue: number; revenuePercent: number; growth: number }>
  drivers: { newCustomerRevenue: number; expansionRevenue: number; churnedRevenue: number; contractionRevenue: number }
  segmentDistribution: { top10Percent: number; middle40Percent: number; bottom50Percent: number }
  subscriptionRevenue: number
  marketplaceRevenue: number
}

interface Props {
  data: RevenueQualityData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RevenueQualityCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 w-full bg-slate-100 rounded" />
          <div className="h-16 w-full bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Revenue quality data unavailable.</p>
      </div>
    )
  }

  const concentrationColor = data.concentration.status === 'HEALTHY' ? 'text-emerald-600' : data.concentration.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Revenue Quality Center</h3>

      {/* Revenue Mix */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Revenue Mix</p>
        <div className="space-y-2">
          <RevenueBar label="Subscription" value={data.bySource.subscription} total={data.bySource.total} color="bg-blue-500" />
          <RevenueBar label="Marketplace" value={data.bySource.marketplace} total={data.bySource.total} color="bg-purple-500" />
          <RevenueBar label="Direct Sales" value={data.bySource.directSales} total={data.bySource.total} color="bg-emerald-500" />
        </div>
      </div>

      {/* Concentration Risk */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 mb-3">
        <div>
          <p className="text-xs text-slate-500">Revenue Concentration (Top 10)</p>
          <p className={`text-lg font-bold ${concentrationColor}`}>{data.concentration.rate.toFixed(1)}%</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${data.concentration.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' : data.concentration.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {data.concentration.status}
        </span>
      </div>

      {/* Revenue Drivers */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Revenue Drivers</p>
        <div className="grid grid-cols-2 gap-2">
          <DriverCard label="New Customer" value={data.drivers.newCustomerRevenue} color="text-emerald-600" />
          <DriverCard label="Expansion" value={data.drivers.expansionRevenue} color="text-blue-600" />
          <DriverCard label="Churned" value={data.drivers.churnedRevenue} color="text-red-600" negative />
          <DriverCard label="Contraction" value={data.drivers.contractionRevenue} color="text-amber-600" negative />
        </div>
      </div>

      {/* Top Contributors */}
      {data.topContributors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top Revenue Contributors</p>
          <ul className="space-y-1.5">
            {data.topContributors.map((c, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-700">{c.customerName}</span>
                  <span className="text-xs text-slate-400 ml-2">{c.revenuePercent.toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-900">{Math.round(c.revenue).toLocaleString()} RWF</span>
                  <span className={`text-xs ml-2 ${c.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {c.growth >= 0 ? '+' : ''}{c.growth.toFixed(1)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Segment Distribution */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Customer Segment Distribution</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
          <div className="bg-blue-500" style={{ width: `${(data.segmentDistribution.top10Percent / (data.segmentDistribution.top10Percent + data.segmentDistribution.middle40Percent + data.segmentDistribution.bottom50Percent || 1)) * 100}%` }} />
          <div className="bg-purple-500" style={{ width: `${(data.segmentDistribution.middle40Percent / (data.segmentDistribution.top10Percent + data.segmentDistribution.middle40Percent + data.segmentDistribution.bottom50Percent || 1)) * 100}%` }} />
          <div className="bg-emerald-500" style={{ width: `${(data.segmentDistribution.bottom50Percent / (data.segmentDistribution.top10Percent + data.segmentDistribution.middle40Percent + data.segmentDistribution.bottom50Percent || 1)) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Top 10%: {Math.round(data.segmentDistribution.top10Percent).toLocaleString()} RWF</span>
          <span>Mid 40%: {Math.round(data.segmentDistribution.middle40Percent).toLocaleString()} RWF</span>
          <span>Bottom 50%: {Math.round(data.segmentDistribution.bottom50Percent).toLocaleString()} RWF</span>
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

function DriverCard({ label, value, color, negative }: { label: string; value: number; color: string; negative?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${color}`}>
        {negative ? '-' : ''}{Math.round(value).toLocaleString()} RWF
      </p>
    </div>
  )
}
