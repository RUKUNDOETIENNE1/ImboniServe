import { Bot, ChevronDown, ChevronUp, Lightbulb, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface AICustomerSuccessAssistantData {
  recommendations: Array<{
    question: string
    answer: string
    evidence: string[]
    confidence: number
    expectedImpact: string
    suggestedActions: string[]
  }>
}

interface Props {
  data: AICustomerSuccessAssistantData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AICustomerSuccessAssistant({ data, loading, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">AI Customer Success Assistant</h3>
        </div>
        <p className="text-sm text-slate-400">No recommendations available at this time. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-900">AI Customer Success Assistant</h3>
        <span className="ml-auto text-xs font-medium text-slate-500">{data.recommendations.length} insight{data.recommendations.length > 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {data.recommendations.map((rec, i) => {
          const isOpen = expanded === i
          const confidenceColor = rec.confidence >= 80 ? 'bg-emerald-500' : rec.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
          return (
            <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="flex items-center justify-between w-full p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{rec.question}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{rec.answer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${confidenceColor}`} style={{ width: `${rec.confidence}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{rec.confidence}%</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 bg-slate-50/50">
                  {rec.confidence < 60 && <LowConfidenceWarning />}
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Evidence</p>
                    <ul className="space-y-1">
                      {rec.evidence.map((ev, j) => (
                        <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Expected Impact</p>
                    <p className="text-xs text-slate-700">{rec.expectedImpact}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Suggested Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.suggestedActions.map((action, j) => (
                        <button
                          key={j}
                          onClick={() => onNavigate?.('/admin/restaurants')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
                        >
                          <span>{action}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AIDisclaimer />
    </div>
  )
}
