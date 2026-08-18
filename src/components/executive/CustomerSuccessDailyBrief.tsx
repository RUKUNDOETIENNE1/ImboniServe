import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, AlertTriangle, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react'

export interface CustomerSuccessBriefData {
  yesterday: { label: string; value: string }[]
  todayPriorities: { label: string; value: string }[]
  newActivations: { label: string; value: string }[]
  customersRequiringAttention: { label: string; value: string }[]
  successHighlights: string[]
  retentionRisks: string[]
  recommendations: string[]
}

interface Props {
  data: CustomerSuccessBriefData | null
  loading?: boolean
}

export default function CustomerSuccessDailyBrief({ data, loading }: Props) {
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
        <p className="text-sm text-slate-400">Daily brief unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">Customer Success Daily Brief</h3>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Yesterday</p>
              <div className="space-y-1">
                {data.yesterday.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Today&apos;s Priorities</p>
              <div className="space-y-1">
                {data.todayPriorities.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">New Activations</p>
              <div className="space-y-1">
                {data.newActivations.length > 0 ? data.newActivations.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No new activations</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Customers Requiring Attention</p>
              <div className="space-y-1">
                {data.customersRequiringAttention.length > 0 ? data.customersRequiringAttention.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No customers requiring attention</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Success Highlights</p>
              </div>
              {data.successHighlights.length > 0 ? (
                <ul className="space-y-1">
                  {data.successHighlights.map((item, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">No success highlights</p>}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Retention Risks</p>
              </div>
              {data.retentionRisks.length > 0 ? (
                <ul className="space-y-1">
                  {data.retentionRisks.map((risk, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">No retention risks</p>}
            </div>
          </div>

          {data.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recommendations</p>
              </div>
              <ul className="space-y-1">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-purple-700 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
