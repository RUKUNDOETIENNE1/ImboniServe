import { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'

export interface PartnershipBriefData {
  yesterday: { label: string; value: string }[]
  todayPriorities: { label: string; value: string }[]
  newApplications: { label: string; value: string }[]
  upcomingRenewals: { label: string; value: string }[]
  campaignHighlights: string[]
  commissionHighlights: string[]
  risks: string[]
  recommendations: string[]
}

interface Props {
  data: PartnershipBriefData | null
  loading?: boolean
}

export default function PartnershipDailyBrief({ data, loading }: Props) {
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
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Partnership Daily Brief</h3>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Yesterday & Today */}
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

          {/* Applications & Renewals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">New Applications</p>
              <div className="space-y-1">
                {data.newApplications.length > 0 ? data.newApplications.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No new applications</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Upcoming Renewals</p>
              <div className="space-y-1">
                {data.upcomingRenewals.length > 0 ? data.upcomingRenewals.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                )) : <p className="text-sm text-slate-400">No upcoming renewals</p>}
              </div>
            </div>
          </div>

          {/* Campaign & Commission Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Campaign Highlights</p>
              </div>
              {data.campaignHighlights.length > 0 ? (
                <ul className="space-y-1">
                  {data.campaignHighlights.map((item, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">No active campaign highlights</p>}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Commission Highlights</p>
              </div>
              {data.commissionHighlights.length > 0 ? (
                <ul className="space-y-1">
                  {data.commissionHighlights.map((item, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">No commission highlights</p>}
            </div>
          </div>

          {/* Risks */}
          {data.risks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Risks</p>
              </div>
              <ul className="space-y-1">
                {data.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
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
