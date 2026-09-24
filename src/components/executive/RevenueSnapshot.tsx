import { DollarSign, ArrowRight } from 'lucide-react'

export interface RevenueSnapshotData {
  mrr: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    status: string
    trend: number[]
  }
  arr: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    status: string
  }
  gmv: {
    value: number
    previousValue: number
    change: number
    changePercent: number
    period: string
  }
  revenueChurn: {
    rate: number
    amount: number
    status: string
  }
  netRevenueRetention: {
    rate: number
    status: string
  }
  revenueGrowth: {
    rate30d: number
    rate90d: number
    status: string
  }
  totalCommissionLiability: { totalLiabilityCents: number; pendingCount: number }
}

interface RevenueSnapshotProps {
  data: RevenueSnapshotData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

function formatRWF(cents: number): string {
  return Math.round(cents / 100).toLocaleString() + ' RWF'
}

export default function RevenueSnapshot({ data, loading, onNavigate }: RevenueSnapshotProps) {
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
        <p className="text-sm text-slate-400">Revenue data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Revenue Snapshot</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          type="button"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">MRR</p>
          <p className="text-lg font-bold text-slate-900">{formatRWF(data.mrr.value)}</p>
          <p className={`text-xs ${data.mrr.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.mrr.changePercent >= 0 ? '+' : ''}{data.mrr.changePercent.toFixed(1)}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">ARR</p>
          <p className="text-lg font-bold text-slate-900">{formatRWF(data.arr.value)}</p>
          <p className={`text-xs ${data.arr.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.arr.changePercent >= 0 ? '+' : ''}{data.arr.changePercent.toFixed(1)}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/revenue-operations')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">GMV (30d)</p>
          <p className="text-lg font-bold text-slate-900">{formatRWF(data.gmv.value)}</p>
          <p className={`text-xs ${data.gmv.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.gmv.changePercent >= 0 ? '+' : ''}{data.gmv.changePercent.toFixed(1)}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/payout-control')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Outstanding Liability</p>
          <p className="text-lg font-bold text-slate-900">{formatRWF(data.totalCommissionLiability.totalLiabilityCents)}</p>
          <p className="text-xs text-slate-400">{data.totalCommissionLiability.pendingCount} pending</p>
        </button>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Revenue Churn</p>
          <p className={`text-sm font-bold ${data.revenueChurn.status === 'HEALTHY' ? 'text-emerald-600' : data.revenueChurn.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>
            {data.revenueChurn.rate.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Net Revenue Retention</p>
          <p className={`text-sm font-bold ${data.netRevenueRetention.rate >= 100 ? 'text-emerald-600' : data.netRevenueRetention.rate >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
            {data.netRevenueRetention.rate.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Growth Rate (30d)</p>
          <p className={`text-sm font-bold ${data.revenueGrowth.rate30d >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.revenueGrowth.rate30d >= 0 ? '+' : ''}{data.revenueGrowth.rate30d.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* MRR Sparkline */}
      {data.mrr.trend.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">MRR Trend (6 months)</p>
          <div className="flex items-end gap-1 h-12">
            {data.mrr.trend.map((val, i) => {
              const max = Math.max(...data.mrr.trend, 1)
              const heightPercent = max > 0 ? (val / max) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 bg-emerald-400 rounded-t-sm min-w-[8px]"
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                  title={formatRWF(val)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
