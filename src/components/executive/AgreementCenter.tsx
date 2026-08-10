import { FileText, AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react'

export interface AgreementCenterData {
  activeAgreements: number
  draftAgreements: number
  expiredAgreements: number
  terminatedAgreements: number
  pendingSignatures: number
  expiringAgreements: Array<{
    id: string
    version: string
    status: string
    effectiveAt: string | null
    expiresAt: string | null
    partnership: { id: string; name: string; email: string; phone: string | null }
  }>
}

interface Props {
  data: AgreementCenterData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AgreementCenter({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Agreement center unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Agreement Center</h3>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <button
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-xs text-slate-500">Active</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.activeAgreements}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Draft</p>
          <p className="text-xl font-bold text-slate-900">{data.draftAgreements}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-xs text-slate-500">Pending Signature</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.pendingSignatures}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Expired</p>
          <p className="text-xl font-bold text-slate-900">{data.expiredAgreements}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/founder-partners')}
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Terminated</p>
          <p className="text-xl font-bold text-slate-900">{data.terminatedAgreements}</p>
        </button>
      </div>

      {/* Expiring Agreements */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upcoming Expirations (30 days)</p>
        </div>
        {data.expiringAgreements.length > 0 ? (
          <div className="space-y-2">
            {data.expiringAgreements.slice(0, 8).map((a) => {
              const daysLeft = a.expiresAt ? Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / 86400000) : 0
              const isCritical = daysLeft <= 7
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigate?.('/admin/founder-partners')}
                  className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.partnership.name}</p>
                      <p className="text-xs text-slate-400">v{a.version} · {a.partnership.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No agreements expiring within 30 days.</p>
        )}
      </div>
    </div>
  )
}
