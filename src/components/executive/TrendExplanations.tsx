import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface TrendExplanation {
  metric: string
  trend: 'UP' | 'DOWN' | 'FLAT'
  explanation: string
  centers: string[]
}

interface Props {
  data: TrendExplanation[] | null
  loading?: boolean
}

export default function TrendExplanations({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Trend Explanations</h3>
        </div>
        <p className="text-sm text-slate-400">No trend explanations available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-slate-900">Trend Explanations</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.length} trends</span>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => {
          const trendIcon =
            item.trend === 'UP' ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : item.trend === 'DOWN' ? (
              <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            )

          return (
            <div
              key={i}
              className={`pb-3 ${i < data.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-start gap-3">
                {trendIcon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.metric}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.centers.map((center, ci) => (
                      <span
                        key={ci}
                        className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full"
                      >
                        {center}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">{item.explanation}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
