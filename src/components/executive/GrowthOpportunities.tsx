import { Rocket, ArrowRight } from 'lucide-react'

export interface GrowthOpportunity {
  opportunity: string
  expectedImpact: string
  evidence: Array<{ source: string; metric: string; value: string }>
  suggestedActions: string[]
  centers: string[]
}

interface Props {
  data: GrowthOpportunity[] | null
  loading?: boolean
}

export default function GrowthOpportunities({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Growth Opportunities</h3>
        </div>
        <p className="text-sm text-slate-400">No growth opportunities identified at this time.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Growth Opportunities</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.length} opportunities</span>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-medium text-slate-900">{item.opportunity}</p>

            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.centers.map((center, ci) => (
                <span
                  key={ci}
                  className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {center}
                </span>
              ))}
            </div>

            <p className="text-xs text-emerald-600 font-medium mt-2">
              Expected Impact: {item.expectedImpact}
            </p>

            {item.evidence.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Evidence</p>
                <div className="space-y-0.5">
                  {item.evidence.map((e, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">{e.source}</span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="text-slate-600">{e.metric}</span>
                      <span className="text-slate-300">=</span>
                      <span className="font-medium text-slate-900">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.suggestedActions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Suggested Actions</p>
                <ul className="space-y-0.5">
                  {item.suggestedActions.map((action, ai) => (
                    <li key={ai} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <ArrowRight className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
