import { Sparkles, ArrowRight } from 'lucide-react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface AIRecommendation {
  question: string
  answer: string
  evidence: string[]
  confidence: number
  expectedImpact?: string
  suggestedActions: string[]
}

interface AIAssistantProps {
  recommendations: AIRecommendation[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AIAssistant({ recommendations, loading, onNavigate }: AIAssistantProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl mb-3" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-bold text-slate-900">AI Executive Assistant</h3>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-slate-400">No recommendations available at this time.</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
                {rec.question}
              </p>
              <p className="text-sm font-medium text-slate-900 mb-2">{rec.answer}</p>

              {rec.evidence.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evidence</p>
                  <ul className="space-y-0.5">
                    {rec.evidence.map((e, j) => (
                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400">Confidence:</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${rec.confidence >= 75 ? 'bg-emerald-500' : rec.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, rec.confidence)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">{rec.confidence}%</span>
              </div>

              {rec.confidence < 50 && <LowConfidenceWarning />}

              {rec.expectedImpact && (
                <div className="mb-2 rounded-lg bg-purple-50 border border-purple-100 p-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Expected Impact</p>
                  <p className="text-xs text-purple-700">{rec.expectedImpact}</p>
                </div>
              )}

              {rec.suggestedActions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Suggested Actions</p>
                  <ul className="space-y-0.5">
                    {rec.suggestedActions.map((a, j) => (
                      <li key={j}>
                        <button
                          onClick={() => onNavigate?.('/admin/operations-intelligence')}
                          className="text-xs text-purple-600 hover:text-purple-700 flex items-start gap-1.5 w-full text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span>{a}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AIDisclaimer />
    </div>
  )
}
