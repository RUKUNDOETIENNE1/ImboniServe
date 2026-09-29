import { ShieldAlert } from 'lucide-react'

export interface BusinessRisk {
  risk: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
  mitigationActions: string[]
  centers: string[]
}

interface Props {
  data: BusinessRisk[] | null
  loading?: boolean
}

const severityConfig = {
  CRITICAL: 'bg-red-100 text-red-700 border border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border border-amber-200',
  LOW: 'bg-blue-100 text-blue-700 border border-blue-200',
}

export default function BusinessRisks({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-bold text-slate-900">Business Risks</h3>
        </div>
        <p className="text-sm text-slate-400">No business risks identified. All clear.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-red-500" />
        <h3 className="text-base font-bold text-slate-900">Business Risks</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.length} risks</span>
      </div>

      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityConfig[item.severity]}`}
                  >
                    {item.severity}
                  </span>
                  <p className="text-sm font-medium text-slate-900">{item.risk}</p>
                </div>
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
                <p className="text-xs text-slate-600 mt-2">{item.explanation}</p>
                {item.mitigationActions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {item.mitigationActions.map((action, ai) => (
                      <li key={ai} className="flex items-start gap-2 text-xs text-slate-500">
                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
