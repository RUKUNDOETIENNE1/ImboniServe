import { ArrowRight, Brain, CheckCircle } from 'lucide-react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface CooRecommendation {
  question: string
  answer: string
  evidence: string[]
  confidence: number
  expectedImpact?: string
  suggestedActions: string[]
}

interface Props {
  recommendations: CooRecommendation[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AIOperationsAssistant({ recommendations, loading, onNavigate }: Props) {
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

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900">AI Operations Assistant</h3>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-emerald-900">No operational issues detected. All systems are running smoothly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-500" />
        <h3 className="text-base font-bold text-slate-900">AI Operations Assistant</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const confidenceColor = rec.confidence >= 80 ? 'bg-emerald-500' : rec.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'

          return (
            <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">{rec.question}</p>
              <p className="text-sm text-slate-900 mb-3">{rec.answer}</p>

              {/* Evidence */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Evidence:</p>
                <ul className="space-y-0.5">
                  {rec.evidence.map((e, j) => (
                    <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Confidence</span>
                  <span className="text-xs font-medium text-slate-700">{rec.confidence}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${confidenceColor}`} style={{ width: `${rec.confidence}%` }} />
                </div>
                {rec.confidence < 60 && <div className="mt-1.5"><LowConfidenceWarning /></div>}
              </div>

              {/* Expected Impact */}
              {rec.expectedImpact && (
                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 p-2">
                  <p className="text-xs text-slate-500 mb-0.5">Expected Impact</p>
                  <p className="text-xs text-blue-700">{rec.expectedImpact}</p>
                </div>
              )}

              {/* Suggested Actions */}
              <div>
                <p className="text-xs text-slate-500 mb-1">Suggested Actions:</p>
                <div className="flex flex-wrap gap-2">
                  {rec.suggestedActions.map((action, j) => (
                    <button
                      key={j}
                      onClick={() => onNavigate?.('/admin/operations-intelligence')}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <span>{action}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AIDisclaimer />
    </div>
  )
}
