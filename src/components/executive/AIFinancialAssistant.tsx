import { Brain, ArrowRight, CheckCircle } from 'lucide-react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface FinancialRecommendation {
  question: string
  answer: string
  evidence: string[]
  confidence: number
  expectedImpact?: string
  suggestedActions: string[]
}

interface Props {
  recommendations: FinancialRecommendation[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AIFinancialAssistant({ recommendations, loading, onNavigate }: Props) {
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
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">AI Financial Assistant</h3>
        </div>
        <p className="text-sm text-slate-400">No financial recommendations available at this time.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-bold text-slate-900">AI Financial Assistant</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const confidenceColor = rec.confidence >= 75 ? 'text-emerald-600' : rec.confidence >= 50 ? 'text-amber-600' : 'text-red-600'
          const confidenceBar = rec.confidence >= 75 ? 'bg-emerald-500' : rec.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'

          return (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">{rec.question}</p>
              <p className="text-sm text-slate-900 font-medium mb-3">{rec.answer}</p>

              {/* Evidence */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Evidence:</p>
                <ul className="space-y-1">
                  {rec.evidence.map((e, j) => (
                    <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className={`text-xs font-bold ${confidenceColor}`}>{rec.confidence}%</p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${confidenceBar}`} style={{ width: `${rec.confidence}%` }} />
                </div>
                {rec.confidence < 50 && <div className="mt-1.5"><LowConfidenceWarning /></div>}
              </div>

              {/* Expected Impact */}
              {rec.expectedImpact && (
                <div className="mb-3 rounded-lg bg-purple-50 border border-purple-100 p-2">
                  <p className="text-xs text-slate-500 mb-0.5">Expected Impact</p>
                  <p className="text-xs text-purple-700">{rec.expectedImpact}</p>
                </div>
              )}

              {/* Suggested Actions */}
              <div>
                <p className="text-xs text-slate-500 mb-1">Suggested Actions:</p>
                <ul className="space-y-1">
                  {rec.suggestedActions.map((action, k) => (
                    <li key={k}>
                      <button
                        onClick={() => onNavigate?.('/admin/revenue-operations')}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      <AIDisclaimer />
    </div>
  )
}
