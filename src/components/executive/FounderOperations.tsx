import { ArrowRight, AlertCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface FounderOpsData {
  applications: { pending: number; underReview: number; approved: number; rejected: number }
  activationPipeline: { applied: number; onboarded: number; active: number; suspended: number }
  agreementStatus: { pending: number; active: number; expired: number }
  campaignReadiness: { draft: number; active: number; paused: number }
  codeGeneration: { total: number; active: number; expired: number }
  partnerHealth: Array<{ partnerName: string; score: number; grade: string; trend: string; status: string }>
  operationalDelays: string
}

interface Props {
  data: FounderOpsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function FounderOperations({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Founder operations data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Founder Operations</h3>

      {/* Application Pipeline */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Application Pipeline</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Pending"
            value={data.applications.pending.toString()}
            status={data.applications.pending > 5 ? 'WARNING' : 'HEALTHY'}
            drillDownHref="/admin/partnership-applications"
            onClick={() => onNavigate?.('/admin/partnership-applications')}
          />
          <KpiCard
            label="Under Review"
            value={data.applications.underReview.toString()}
            drillDownHref="/admin/partnership-applications"
            onClick={() => onNavigate?.('/admin/partnership-applications')}
          />
          <KpiCard
            label="Approved"
            value={data.applications.approved.toString()}
            drillDownHref="/admin/founder-partners"
            onClick={() => onNavigate?.('/admin/founder-partners')}
          />
          <KpiCard
            label="Rejected"
            value={data.applications.rejected.toString()}
            drillDownHref="/admin/founder-partners"
            onClick={() => onNavigate?.('/admin/founder-partners')}
          />
        </div>
      </div>

      {/* Activation Pipeline */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Activation Pipeline</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Applied" value={data.activationPipeline.applied.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
          <KpiCard label="Onboarded" value={data.activationPipeline.onboarded.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
          <KpiCard label="Active" value={data.activationPipeline.active.toString()} status="HEALTHY" drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
          <KpiCard label="Suspended" value={data.activationPipeline.suspended.toString()} status={data.activationPipeline.suspended > 0 ? 'WARNING' : 'HEALTHY'} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        </div>
      </div>

      {/* Operational Delays */}
      {data.operationalDelays !== 'None' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">{data.operationalDelays}</p>
        </div>
      )}

      {/* Partner Health */}
      {data.partnerHealth.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Partner Health (Top 10)</p>
          <ul className="space-y-1.5">
            {data.partnerHealth.map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-700">{p.partnerName}</span>
                  <span className="text-xs text-slate-400 ml-2">{p.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{p.score}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${p.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : p.grade === 'B' ? 'bg-blue-100 text-blue-700' : p.grade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {p.grade}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => onNavigate?.('/admin/founder-partners')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Founder Partners</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
