import { Wallet, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export interface CommissionPayoutData {
  commissionSummary: {
    byStatus: Array<{ status: string; count: number; totalCents: number }>
    totalLiabilityCents: number
    totalPaidCents: number
    totalClawedBackCents: number
  }
  totalCommissionLiability: {
    totalLiabilityCents: number
    totalCommissionCount: number
    topLiabilities: Array<{ partnershipId: string; totalCents: number; commissionCount: number }>
  }
  pendingPayouts: Array<{
    id: string
    partnershipId: string
    partnershipName: string
    amountCents: number
    currency: string
    method: string
    status: string
    createdAt: string
    recipientPhone: string | null
  }>
  recentPayouts: Array<{
    id: string
    partnershipName: string
    amountCents: number
    currency: string
    method: string
    status: string
    paidAt: string | null
    createdAt: string
  }>
  paidPayouts30d: { totalCents: number; count: number }
  failedPayouts: number
}

interface Props {
  data: CommissionPayoutData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  VALIDATED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-cyan-100 text-cyan-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-slate-100 text-slate-500',
  CLAWED_BACK: 'bg-red-100 text-red-700',
}

export default function CommissionPayoutOverview({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Commission & payout overview unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Commission & Payout Overview</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Outstanding Liability</p>
          <p className="text-lg font-bold text-amber-700">{Math.round(data.totalCommissionLiability.totalLiabilityCents / 100).toLocaleString()} RWF</p>
          <p className="text-xs text-slate-400">{data.totalCommissionLiability.totalCommissionCount} commissions</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Paid (All Time)</p>
          <p className="text-lg font-bold text-emerald-700">{Math.round(data.commissionSummary.totalPaidCents / 100).toLocaleString()} RWF</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Paid (30d)</p>
          <p className="text-lg font-bold text-blue-700">{Math.round(data.paidPayouts30d.totalCents / 100).toLocaleString()} RWF</p>
          <p className="text-xs text-slate-400">{data.paidPayouts30d.count} payouts</p>
        </div>
        <div className={`rounded-xl border p-3 ${data.failedPayouts > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
          <p className="text-xs text-slate-500 mb-1">Failed Payouts</p>
          <p className={`text-lg font-bold ${data.failedPayouts > 0 ? 'text-red-700' : 'text-slate-900'}`}>{data.failedPayouts}</p>
        </div>
      </div>

      {/* Commission by Status */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Commission by Status</p>
        <div className="flex flex-wrap gap-2">
          {data.commissionSummary.byStatus.map((s) => (
            <div key={s.status} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusColor[s.status] || 'bg-slate-100 text-slate-700'}`}>
              {s.status}: {s.count} ({Math.round(s.totalCents / 100).toLocaleString()} RWF)
            </div>
          ))}
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Payout Approval Queue</p>
        </div>
        {data.pendingPayouts.length > 0 ? (
          <div className="space-y-2">
            {data.pendingPayouts.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate?.('/admin/payout-control')}
                className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.partnershipName}</p>
                  <p className="text-xs text-slate-400">{p.method} · {p.recipientPhone || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{Math.round(p.amountCents / 100).toLocaleString()} RWF</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No pending payouts.</p>
        )}
      </div>

      {/* Recent Payouts */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Recent Payouts</p>
        {data.recentPayouts.length > 0 ? (
          <div className="space-y-2">
            {data.recentPayouts.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate?.('/admin/payout-control')}
                className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {p.status === 'PAID' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.partnershipName}</p>
                    <p className="text-xs text-slate-400">{p.method} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{Math.round(p.amountCents / 100).toLocaleString()} RWF</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status] || 'bg-slate-100 text-slate-700'}`}>
                    {p.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No recent payouts.</p>
        )}
      </div>
    </div>
  )
}
