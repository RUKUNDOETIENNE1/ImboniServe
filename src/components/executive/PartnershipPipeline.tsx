import { ArrowRight, AlertTriangle, Clock } from 'lucide-react'

export interface PipelineData {
  prospect: number
  applied: number
  onboarded: number
  active: number
  suspended: number
  terminated: number
  pendingApplications: number
  underReviewApplications: number
  approvedApplications: number
  activeAgreements: number
  activeCampaigns: number
}

interface Props {
  data: PipelineData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const stages = [
  { key: 'prospect', label: 'Prospect', color: 'bg-slate-100 text-slate-700', link: '/admin/founder-partners' },
  { key: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700', link: '/admin/partnership-applications' },
  { key: 'underReview', label: 'Under Review', color: 'bg-indigo-100 text-indigo-700', link: '/admin/partnership-applications' },
  { key: 'approved', label: 'Approved', color: 'bg-cyan-100 text-cyan-700', link: '/admin/partnership-applications' },
  { key: 'onboarded', label: 'Onboarded', color: 'bg-teal-100 text-teal-700', link: '/admin/founder-partners' },
  { key: 'activeAgreements', label: 'Agreements', color: 'bg-emerald-100 text-emerald-700', link: '/admin/founder-partners' },
  { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700', link: '/admin/founder-partners' },
  { key: 'activeCampaigns', label: 'Campaigns', color: 'bg-purple-100 text-purple-700', link: '/admin/founder-partners' },
  { key: 'suspended', label: 'Suspended', color: 'bg-amber-100 text-amber-700', link: '/admin/founder-partners' },
  { key: 'terminated', label: 'Terminated', color: 'bg-red-100 text-red-700', link: '/admin/founder-partners' },
]

export default function PartnershipPipeline({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 w-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Partnership pipeline unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const stageData: Record<string, number> = {
    prospect: data.prospect,
    applied: data.applied,
    underReview: data.underReviewApplications,
    approved: data.approvedApplications,
    onboarded: data.onboarded,
    activeAgreements: data.activeAgreements,
    active: data.active,
    activeCampaigns: data.activeCampaigns,
    suspended: data.suspended,
    terminated: data.terminated,
  }

  const bottleneck = stages.reduce((max, stage) => {
    const count = stageData[stage.key] || 0
    return count > max.count ? { stage: stage.label, count } : max
  }, { stage: '', count: 0 })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Partnership Pipeline</h3>
        {bottleneck.count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bottleneck: {bottleneck.stage} ({bottleneck.count})</span>
          </div>
        )}
      </div>

      {/* Pipeline Flow */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const count = stageData[stage.key] || 0
          return (
            <div key={stage.key} className="flex items-center flex-shrink-0">
              <button
                onClick={() => onNavigate?.(stage.link)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`px-3 py-2 rounded-xl ${stage.color} min-w-[80px] text-center transition-all group-hover:shadow-md`}>
                  <p className="text-xs font-medium opacity-75">{stage.label}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              </button>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-300 mx-0.5 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* SLA & Aging */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Pending Applications</p>
          </div>
          <p className="text-lg font-bold text-slate-900">{data.pendingApplications}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Under Review</p>
          </div>
          <p className="text-lg font-bold text-slate-900">{data.underReviewApplications}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Active Agreements</p>
          <p className="text-lg font-bold text-slate-900">{data.activeAgreements}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Active Campaigns</p>
          <p className="text-lg font-bold text-slate-900">{data.activeCampaigns}</p>
        </div>
      </div>
    </div>
  )
}
