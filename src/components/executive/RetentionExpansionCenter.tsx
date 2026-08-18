import { TrendingUp, AlertTriangle, Rocket, DollarSign, ArrowRight } from 'lucide-react'

export interface RetentionExpansionData {
  retentionRate: number
  churnRate: number
  activeSubscriptions: number
  trialSubscriptions: number
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  cancelledSubscriptions30d: number
  renewalsNext30d: number
  subscriptionsRenewingSoon: Array<{
    id: string
    nextBillingDate: string
    amountCents: number
    business: { id: string; name: string; city: string; businessType: string | null }
  }>
  expansionCandidates: Array<{
    id: string
    name: string
    city: string
    businessType: string | null
    branchCount: number
    customerCount: number
  }>
}

interface Props {
  data: RetentionExpansionData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RetentionExpansionCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Retention & expansion center unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Retention & Expansion Center</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className={`rounded-xl border p-3 text-left hover:shadow-md transition-all ${data.retentionRate >= 90 ? 'border-emerald-200 bg-emerald-50' : data.retentionRate >= 75 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}
        >
          <p className="text-xs text-slate-500 mb-1">Retention Rate</p>
          <p className={`text-xl font-bold ${data.retentionRate >= 90 ? 'text-emerald-700' : data.retentionRate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{data.retentionRate}%</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className={`rounded-xl border p-3 text-left hover:shadow-md transition-all ${data.churnRate <= 3 ? 'border-emerald-200 bg-emerald-50' : data.churnRate <= 10 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}
        >
          <p className="text-xs text-slate-500 mb-1">Churn Rate</p>
          <p className={`text-xl font-bold ${data.churnRate <= 3 ? 'text-emerald-700' : data.churnRate <= 10 ? 'text-amber-700' : 'text-red-700'}`}>{data.churnRate}%</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Active Subscriptions</p>
          <p className="text-xl font-bold text-slate-900">{data.activeSubscriptions}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/subscriptions')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Renewals (30d)</p>
          <p className="text-xl font-bold text-blue-700">{data.renewalsNext30d}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Renewal Risk</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate?.('/admin/subscriptions')}
              className={`flex items-center justify-between w-full rounded-xl border p-3 hover:shadow-md transition-all ${data.gracePeriodSubscriptions > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200'}`}
            >
              <span className="text-sm text-slate-600">Grace Period</span>
              <span className={`text-sm font-bold ${data.gracePeriodSubscriptions > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{data.gracePeriodSubscriptions}</span>
            </button>
            <button
              onClick={() => onNavigate?.('/admin/subscriptions')}
              className={`flex items-center justify-between w-full rounded-xl border p-3 hover:shadow-md transition-all ${data.pastDueSubscriptions > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}
            >
              <span className="text-sm text-slate-600">Past Due</span>
              <span className={`text-sm font-bold ${data.pastDueSubscriptions > 0 ? 'text-red-700' : 'text-slate-900'}`}>{data.pastDueSubscriptions}</span>
            </button>
            <button
              onClick={() => onNavigate?.('/admin/subscriptions')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <span className="text-sm text-slate-600">Cancelled (30d)</span>
              <span className="text-sm font-bold text-slate-900">{data.cancelledSubscriptions30d}</span>
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Rocket className="w-3.5 h-3.5 text-purple-600" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expansion Opportunities</p>
          </div>
          <div className="space-y-2">
            {data.expansionCandidates.length > 0 ? data.expansionCandidates.slice(0, 4).map((b) => (
              <button
                key={b.id}
                onClick={() => onNavigate?.('/admin/restaurants')}
                className="flex items-center justify-between w-full rounded-xl border border-purple-200 bg-purple-50 p-3 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.city} · {b.branchCount} branches · {b.customerCount} customers</p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </button>
            )) : (
              <p className="text-sm text-slate-400">No expansion candidates identified.</p>
            )}
          </div>
        </div>
      </div>

      {data.subscriptionsRenewingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upcoming Renewals (30 days)</p>
          </div>
          <div className="space-y-2">
            {data.subscriptionsRenewingSoon.slice(0, 5).map((sub) => {
              const daysLeft = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / 86400000)
              return (
                <button
                  key={sub.id}
                  onClick={() => onNavigate?.('/admin/subscriptions')}
                  className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sub.business.name}</p>
                    <p className="text-xs text-slate-400">{sub.business.city} · {sub.business.businessType || 'Unknown type'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">{Math.round(sub.amountCents / 100).toLocaleString()} RWF</span>
                    <span className={`text-xs font-medium ${daysLeft <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                      {daysLeft} day{daysLeft > 1 ? 's' : ''}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
