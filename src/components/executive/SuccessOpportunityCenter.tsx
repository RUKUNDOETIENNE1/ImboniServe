import { Rocket, ArrowRight } from 'lucide-react'

export interface SuccessOpportunityData {
  opportunities: Array<{
    type: string
    title: string
    description: string
    action: string
    expectedImpact: string
    link: string
  }>
}

interface Props {
  data: SuccessOpportunityData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
  EXPANSION: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  TRIAL_CONVERSION: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  ADOPTION_IMPROVEMENT: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  RE_ENGAGEMENT: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  FEATURE_ADOPTION: { color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  CUSTOMER_RE_ENGAGEMENT: { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  REGIONAL_EXPANSION: { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  SUCCESS_MILESTONE: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

export default function SuccessOpportunityCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Success Opportunity Center</h3>
        </div>
        <p className="text-sm text-slate-400">No opportunities identified at this time. Customer success ecosystem is stable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-bold text-slate-900">Success Opportunity Center</h3>
        <span className="ml-auto text-xs font-medium text-slate-500">{data.opportunities.length} opportunit{data.opportunities.length > 1 ? 'ies' : 'y'}</span>
      </div>

      <div className="space-y-3">
        {data.opportunities.map((opp, i) => {
          const config = typeConfig[opp.type] || { color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' }
          return (
            <button
              key={i}
              onClick={() => onNavigate?.(opp.link)}
              className={`block w-full text-left rounded-xl border ${config.border} ${config.bg} p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>{opp.type.replace(/_/g, ' ')}</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{opp.title}</p>
                </div>
                <ArrowRight className={`w-4 h-4 ${config.color} flex-shrink-0 mt-1`} />
              </div>
              <p className="text-sm text-slate-600 mb-2">{opp.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Action: </span>
                  <span className="font-medium text-slate-700">{opp.action}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="text-slate-400">Expected Impact: </span>
                {opp.expectedImpact}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
