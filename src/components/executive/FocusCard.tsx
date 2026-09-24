import { useState } from 'react'
import { ChevronDown, ChevronUp, Sun, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react'

export interface BriefData {
  greeting: string
  yesterdaySummary: string
  companyHealth: string
  topPriorities: string[]
  criticalAlerts: string[]
  aiRecommendation: string
}

interface FocusCardProps {
  data: BriefData | null
  loading?: boolean
}

export default function FocusCard({ data, loading }: FocusCardProps) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Brief unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        aria-label={expanded ? 'Collapse focus card' : 'Expand focus card'}
      >
        <div className="flex items-center gap-3">
          <Sun className="w-5 h-5 text-amber-500" />
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-900">{data.greeting}</h2>
            <p className="text-sm text-slate-500">{data.yesterdaySummary}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Company Health */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company Health</p>
              <p className="text-sm text-slate-700">{data.companyHealth}</p>
            </div>
          </div>

          {/* Top Priorities */}
          {data.topPriorities.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Top Priorities</p>
                <ul className="space-y-1">
                  {data.topPriorities.map((p, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">{i + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Critical Alerts */}
          {data.criticalAlerts.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Critical Alerts</p>
                <ul className="space-y-1">
                  {data.criticalAlerts.map((a, i) => (
                    <li key={i} className="text-sm text-red-700">{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          {data.aiRecommendation && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">AI Recommendation</p>
                <p className="text-sm text-slate-700">{data.aiRecommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
