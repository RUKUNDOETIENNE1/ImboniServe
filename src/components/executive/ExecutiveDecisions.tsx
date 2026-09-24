import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

export interface ExecutiveDecision {
  decision: string
  evidence: Array<{ source: string; metric: string; value: string }>
  reasoning: string
  confidence: number
  expectedImpact: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  suggestedActions: string[]
  centers: string[]
}

interface Props {
  data: ExecutiveDecision[] | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const severityConfig = {
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
}

function confidenceColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function ExecutiveDecisions({ data, loading }: Props) {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({})

  const toggle = (idx: number) =>
    setExpandedMap((prev) => ({ ...prev, [idx]: !prev[idx] }))

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-bold text-slate-900">Executive Decisions</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No AI-synthesized decisions available at this time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="text-base font-bold text-slate-900">Executive Decisions</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.length} decisions</span>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => {
          const cfg = severityConfig[item.priority]
          const isExpanded = !!expandedMap[i]

          return (
            <div key={i} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
              {/* Header row */}
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {item.priority}
                </span>
                <p className="text-sm font-medium text-slate-900 flex-1">{item.decision}</p>
              </div>

              {/* Centers */}
              <div className="flex flex-wrap gap-1 mb-2">
                {item.centers.map((center, ci) => (
                  <span key={ci} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                    {center}
                  </span>
                ))}
              </div>

              {/* Reasoning */}
              <p className="text-xs text-slate-600 mb-2">{item.reasoning}</p>

              {/* Confidence bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Confidence</span>
                  <span className="text-xs font-medium text-slate-700">{item.confidence}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${confidenceColor(item.confidence)}`}
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
              </div>

              {/* Expected impact */}
              <p className="text-xs text-slate-500 mb-2">
                <span className="font-medium">Expected Impact:</span> {item.expectedImpact}
              </p>

              {/* Suggested actions */}
              {item.suggestedActions.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">Suggested Actions</p>
                  <ul className="space-y-1">
                    {item.suggestedActions.map((action, ai) => (
                      <li key={ai} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className={`${cfg.color} font-bold`}>•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expandable evidence section */}
              {item.evidence.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                  >
                    {isExpanded ? 'Hide' : 'Show'} Evidence ({item.evidence.length})
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 rounded-lg bg-white/60 border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-3 gap-px bg-slate-200 text-xs font-medium text-slate-500">
                        <div className="bg-slate-50 px-2 py-1">Source</div>
                        <div className="bg-slate-50 px-2 py-1">Metric</div>
                        <div className="bg-slate-50 px-2 py-1">Value</div>
                      </div>
                      {item.evidence.map((ev, ei) => (
                        <div key={ei} className="grid grid-cols-3 gap-px bg-slate-200 text-xs text-slate-700">
                          <div className="bg-white px-2 py-1">{ev.source}</div>
                          <div className="bg-white px-2 py-1">{ev.metric}</div>
                          <div className="bg-white px-2 py-1 font-medium">{ev.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
