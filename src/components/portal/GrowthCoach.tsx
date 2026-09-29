/**
 * GrowthCoach — Recommended next actions with priority indicators.
 * Surfaces opportunities proactively.
 */

import { Lightbulb, ArrowRight, AlertTriangle, Info } from 'lucide-react'

export interface Recommendation {
  action: string
  label: string
  priority: 'high' | 'medium' | 'low'
}

interface GrowthCoachProps {
  recommendations: Recommendation[]
  onAction?: (action: string) => void
}

const priorityConfig = {
  high: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  medium: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
}

export default function GrowthCoach({ recommendations, onAction }: GrowthCoachProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <h3 className="font-semibold text-slate-800">Recommended Next Action</h3>
        </div>
        <p className="text-sm text-slate-500">Share your Founder Code with potential restaurants to grow your network.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h3 className="font-semibold text-slate-800">Recommended Next Action</h3>
      </div>
      <ul className="space-y-2" aria-label="Growth recommendations">
        {recommendations.map((rec, idx) => {
          const config = priorityConfig[rec.priority]
          const Icon = config.icon
          return (
            <li key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${config.border} ${config.bg}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-slate-700">{rec.label}</p>
              </div>
              {onAction && (
                <button
                  onClick={() => onAction(rec.action)}
                  className="shrink-0 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                >
                  Act <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
