import { ArrowRight, AlertCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface CollectionsData {
  totalCollected30d: number
  failedPayments: number
  failedPaymentImpact: number
  pendingPayouts: number
  refundAmount: number
  refundCount: number
  retrySuccessRate: number
  expectedInflow: number
}

interface Props {
  data: CollectionsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CashCollections({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Cash & collections data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Cash & Collections</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Collected (30d)"
          value={`${Math.round(data.totalCollected30d).toLocaleString()} RWF`}
          drillDownHref="/admin/revenue-operations"
          onClick={() => onNavigate?.('/admin/revenue-operations')}
        />
        <KpiCard
          label="Expected Inflow"
          value={`${Math.round(data.expectedInflow).toLocaleString()} RWF`}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="Failed Payments"
          value={data.failedPayments.toString()}
          status={data.failedPayments > 10 ? 'CRITICAL' : data.failedPayments > 5 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
        <KpiCard
          label="Pending Payouts"
          value={data.pendingPayouts.toString()}
          status={data.pendingPayouts > 0 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/payout-control"
          onClick={() => onNavigate?.('/admin/payout-control')}
        />
      </div>

      {/* Failed payment impact */}
      {data.failedPaymentImpact > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Failed Payment Impact: {Math.round(data.failedPaymentImpact).toLocaleString()} RWF</p>
            <p className="text-xs text-red-700">{data.failedPayments} failed payments in the last 30 days</p>
          </div>
        </div>
      )}

      {/* Refunds */}
      {data.refundCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Refunds: {Math.round(data.refundAmount).toLocaleString()} RWF ({data.refundCount} transactions)</p>
            <p className="text-xs text-amber-700">Review refund patterns for product or service issues</p>
          </div>
        </div>
      )}

      {/* Drill-down */}
      <button
        onClick={() => onNavigate?.('/admin/revenue-operations')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Revenue Operations</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
