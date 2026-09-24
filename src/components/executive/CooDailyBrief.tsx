import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface CooBriefData {
  yesterday: Array<{ label: string; value: string }>
  todayWorkload: Array<{ label: string; value: string }>
  achievements: string[]
  pendingWork: Array<{ label: string; value: string }>
  risks: string[]
  escalations: string[]
  recommendations: string[]
  resourceConstraints: string[]
}

interface Props {
  data: CooBriefData | null
  loading?: boolean
}

export default function CooDailyBrief({ data, loading }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">COO daily brief unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse brief' : 'Expand brief'}
      >
        <h3 className="text-base font-bold text-slate-900">COO Daily Brief</h3>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Section title="Yesterday" items={data.yesterday} />
          <Section title="Today's Workload" items={data.todayWorkload} />
          <Section title="Pending Work" items={data.pendingWork} />

          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Achievements</p>
            <ul className="space-y-1">
              {data.achievements.map((a, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

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

          <div className="space-y-2">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Escalations</p>
            <ul className="space-y-1">
              {data.escalations.map((e, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Recommendations</p>
            <ul className="space-y-1">
              {data.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Resource Constraints</p>
            <ul className="space-y-1">
              {data.resourceConstraints.map((r, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-slate-600">{item.label}</span>
          <span className="font-medium text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
