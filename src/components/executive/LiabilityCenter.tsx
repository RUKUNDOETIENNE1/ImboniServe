import { ArrowRight, AlertCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface LiabilityData {
  totalCommissionLiabilityCents: number
  commissionCount: number
  topLiabilities: Array<{ partnerName?: string; amountCents?: number; status?: string }>
  pendingPayouts: number
  refundObligations: number
  refundCount: number
}

interface Props {
  data: LiabilityData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function LiabilityCenter({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Liability data unavailable.</p>
      </div>
    )
  }

  const totalLiabilityRWF = Math.round(data.totalCommissionLiabilityCents / 100)
  const refundRWF = Math.round(data.refundObligations / 100)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Liability Center</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Commission Liability"
          value={`${totalLiabilityRWF.toLocaleString()} RWF`}
          status={totalLiabilityRWF > 0 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/payout-control"
          onClick={() => onNavigate?.('/admin/payout-control')}
        />
        <KpiCard
          label="Pending Commissions"
          value={data.commissionCount.toString()}
          drillDownHref="/admin/payout-control"
          onClick={() => onNavigate?.('/admin/payout-control')}
        />
        <KpiCard
          label="Pending Payouts"
          value={data.pendingPayouts.toString()}
          status={data.pendingPayouts > 0 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/payout-control"
          onClick={() => onNavigate?.('/admin/payout-control')}
        />
        <KpiCard
          label="Refund Obligations"
          value={`${refundRWF.toLocaleString()} RWF`}
          status={data.refundCount > 0 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/revenue-operations"
          onClick={() => onNavigate?.('/admin/revenue-operations')}
        />
      </div>

      {/* Top liabilities */}
      {data.topLiabilities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Largest Outstanding Liabilities</p>
          <ul className="space-y-2">
            {data.topLiabilities.map((liab, i) => (
              <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">{liab.partnerName || `Partner ${i + 1}`}</p>
                  <p className="text-xs text-slate-500">{liab.status || 'Pending'}</p>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {Math.round((liab.amountCents || 0) / 100).toLocaleString()} RWF
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aging buckets placeholder */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Aging Buckets</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <AgingBucket label="0-30d" value={totalLiabilityRWF} color="text-emerald-600" />
          <AgingBucket label="31-60d" value={0} color="text-amber-600" />
          <AgingBucket label="61-90d" value={0} color="text-orange-600" />
          <AgingBucket label="90d+" value={0} color="text-red-600" />
        </div>
        <p className="text-xs text-slate-400 mt-2 italic">Detailed aging requires schema enhancement for due date tracking.</p>
      </div>

      {/* Drill-down */}
      <button
        onClick={() => onNavigate?.('/admin/payout-control')}
        className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Payout Operations</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function AgingBucket({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value.toLocaleString()} RWF</p>
    </div>
  )
}
