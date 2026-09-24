import { Brain, ArrowRight, CheckCircle } from 'lucide-react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface PartnershipRecommendation {
  question: string
  answer: string
  evidence: string[]
  confidence: number
  expectedImpact: string
  suggestedActions: string[]
}

interface Props {
  recommendations: PartnershipRecommendation[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AIPartnershipAssistant({ recommendations, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">AI Partnership Assistant</h3>
      </div>

      {recommendations.length === 0 ? (
        <p className="text-sm text-slate-400">No recommendations available at this time.</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
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
                <div className="mb-2 rounded-lg bg-blue-50 border border-blue-100 p-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Expected Impact</p>
                  <p className="text-xs text-blue-700">{rec.expectedImpact}</p>
                </div>
              )}

              {rec.suggestedActions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Suggested Actions</p>
                  <ul className="space-y-0.5">
                    {rec.suggestedActions.map((a, j) => (
                      <li key={j}>
                        <button
                          onClick={() => onNavigate?.('/admin/founder-partners')}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-start gap-1.5 w-full text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
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
