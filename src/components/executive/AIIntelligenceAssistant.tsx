import { Sparkles, ArrowRight } from 'lucide-react'
import AIDisclaimer, { LowConfidenceWarning } from './AIDisclaimer'

export interface IntelligenceInsight {
  question: string
  answer: string
  evidence: Array<{ source: string; metric: string; value: string }>
  confidence: number
  expectedImpact?: string
  centers: string[]
  suggestedActions: string[]
}

interface Props {
  data: IntelligenceInsight[] | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const centerLinkMap: Record<string, string> = {
  'CEO': '/admin/executive/ceo',
  'CFO': '/admin/executive/cfo',
  'COO': '/admin/executive/coo',
  'CMO': '/admin/executive/cmo',
  'Partnership Director': '/admin/executive/partnership-director',
  'Customer Success Director': '/admin/executive/customer-success-director',
}

export default function AIIntelligenceAssistant({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-4" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl mb-3" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">AI Intelligence Assistant</h3>
        </div>
        <p className="text-sm text-slate-400">No cross-center insights available at this time.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-bold text-slate-900">AI Intelligence Assistant</h3>
      </div>

      <div className="space-y-3">
        {data.map((insight, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
              {insight.question}
            </p>
            <p className="text-sm font-medium text-slate-900 mb-2">{insight.answer}</p>

            {insight.evidence.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evidence</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                  {insight.evidence.map((e, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">{e.source}</span>
                      <span className="text-slate-300">:</span>
                      <span className="text-slate-600">{e.metric}</span>
                      <span className="text-slate-300">=</span>
                      <span className="font-medium text-slate-900">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.centers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {insight.centers.map((center, ci) => (
                  <span
                    key={ci}
                    className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {center}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">Confidence:</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${insight.confidence >= 75 ? 'bg-emerald-500' : insight.confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, insight.confidence)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600">{insight.confidence}%</span>
            </div>

            {insight.confidence < 50 && <LowConfidenceWarning />}

            {insight.expectedImpact && (
              <div className="mb-2 rounded-lg bg-purple-50 border border-purple-100 p-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Expected Impact</p>
                <p className="text-xs text-purple-700">{insight.expectedImpact}</p>
              </div>
            )}

            {insight.suggestedActions.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Suggested Actions</p>
                <ul className="space-y-0.5">
                  {insight.suggestedActions.map((action, ai) => {
                    const targetLink = insight.centers.length > 0
                      ? centerLinkMap[insight.centers[0]] || '/admin/executive/executive-intelligence'
                      : '/admin/executive/executive-intelligence'
                    return (
                      <li key={ai}>
                        <button
                          onClick={() => onNavigate?.(targetLink)}
                          className="text-xs text-purple-600 hover:text-purple-700 flex items-start gap-1.5 w-full text-left"
                        >
                          <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <AIDisclaimer />
    </div>
  )
}
