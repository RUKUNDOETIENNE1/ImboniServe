import { Users2, Tag, Rocket, DollarSign, ArrowRight } from 'lucide-react'

export interface FounderEcosystemData {
  activePartners: number
  pendingApplications: number
  topPartners: Array<{ name?: string; partnerType?: string; totalRevenueCents?: number; totalConversions?: number }>
  campaignPerformance: Array<{ name?: string; conversions?: number; revenueCents?: number; status?: string }>
  inactivePartners: number
  commissionSummary: Array<{ status: string; count: number; totalAmountCents: number }>
  totalCommissionLiability: { totalLiabilityCents: number; pendingCount: number }
  expiringAgreements: Array<{ id: string; partnership?: { name?: string }; endDate?: Date }>
}

interface FounderEcosystemProps {
  data: FounderEcosystemData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function FounderEcosystem({ data, loading, onNavigate }: FounderEcosystemProps) {
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
        <p className="text-sm text-slate-400">Founder ecosystem data unavailable.</p>
      </div>
    )
  }

  const pendingCommissions = data.commissionSummary.find(c => c.status === 'PENDING')
  const paidCommissions = data.commissionSummary.find(c => c.status === 'PAID')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users2 className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Founder Ecosystem</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <button
          type="button"
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs text-slate-500">Active Partners</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.activePartners}</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/partnership-applications')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs text-slate-500">Pending Applications</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.pendingApplications}</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('/admin/payout-control')}
          className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs text-slate-500">Commission Liability</p>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {Math.round((data.totalCommissionLiability?.totalLiabilityCents || 0) / 100).toLocaleString()} RWF
          </p>
          <p className="text-xs text-slate-400">{data.totalCommissionLiability?.pendingCount || 0} pending</p>
        </button>
      </div>

      {/* Top Partners */}
      {data.topPartners.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top Founder Partners</p>
          <ul className="space-y-1">
            {data.topPartners.slice(0, 3).map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{p.name || `Partner ${i + 1}`}</span>
                <span className="font-medium text-slate-900">
                  {Math.round((p.totalRevenueCents || 0) / 100).toLocaleString()} RWF
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Campaign Performance */}
      {data.campaignPerformance.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top Campaigns</p>
          <ul className="space-y-1">
            {data.campaignPerformance.slice(0, 3).map((c, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{c.name || `Campaign ${i + 1}`}</span>
                <span className="font-medium text-slate-900">{c.conversions || 0} conversions</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expiring Agreements */}
      {data.expiringAgreements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Expiring Agreements (30 days)</p>
          <ul className="space-y-1">
            {data.expiringAgreements.slice(0, 3).map((a, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{a.partnership?.name || 'Unknown'}</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/admin/founder-partners')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
