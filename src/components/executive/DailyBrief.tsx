import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface DailyBriefData {
  yesterday: { label: string; value: string }[]
  today: { label: string; value: string }[]
  risks: string[]
  opportunities: string[]
  pendingApprovals: { label: string; value: string }[]
  founderActivity: string[]
  restaurantActivity: string[]
  financialSummary: string
  strategicRecommendation: string
}

interface DailyBriefProps {
  data: DailyBriefData | null
  loading?: boolean
}

export default function DailyBrief({ data, loading }: DailyBriefProps) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Daily brief unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        aria-label={expanded ? 'Collapse daily brief' : 'Expand daily brief'}
      >
        <h3 className="text-base font-bold text-slate-900">Executive Daily Brief</h3>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Yesterday */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Yesterday</p>
            {data.yesterday.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Today */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today</p>
            {data.today.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Risks */}
          {data.risks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Risks</p>
              <ul className="space-y-1">
                {data.risks.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {data.opportunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Opportunities</p>
              <ul className="space-y-1">
                {data.opportunities.map((o, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pending Approvals */}
          {data.pendingApprovals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pending Approvals</p>
              {data.pendingApprovals.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Founder Activity */}
          {data.founderActivity.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Founder Activity</p>
              <ul className="space-y-1">
                {data.founderActivity.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700">{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Business Activity */}
          {data.restaurantActivity.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Activity</p>
              <ul className="space-y-1">
                {data.restaurantActivity.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Financial Summary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Financial Summary</p>
            <p className="text-sm text-slate-700">{data.financialSummary}</p>
          </div>

          {/* Strategic Recommendation */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Strategic Recommendation</p>
            <p className="text-sm text-slate-700">{data.strategicRecommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
