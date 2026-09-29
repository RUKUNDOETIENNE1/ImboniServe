import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface FinancialBriefData {
  yesterday: Array<{ label: string; value: string }>
  today: Array<{ label: string; value: string }>
  collections: Array<{ label: string; value: string }>
  forecast: Array<{ label: string; value: string }>
  outstandingLiabilities: Array<{ label: string; value: string }>
  cashOutlook: string
  pendingApprovals: Array<{ label: string; value: string }>
  risks: string[]
  recommendations: string[]
}

interface Props {
  data: FinancialBriefData | null
  loading?: boolean
}

export default function FinancialDailyBrief({ data, loading }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Financial daily brief unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse brief' : 'Expand brief'}
      >
        <h3 className="text-base font-bold text-slate-900">Financial Daily Brief</h3>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Section title="Yesterday" items={data.yesterday} />
          <Section title="Today" items={data.today} />
          <Section title="Collections" items={data.collections} />
          <Section title="Forecast" items={data.forecast} />
          <Section title="Outstanding Liabilities" items={data.outstandingLiabilities} />
          <Section title="Pending Approvals" items={data.pendingApprovals} />

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cash Outlook</p>
            <p className="text-sm text-slate-700">{data.cashOutlook}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Risks</p>
            <ul className="space-y-1">
              {data.risks.map((risk, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Recommendations</p>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, items }: { title: string; items: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-slate-600">{item.label}</span>
          <span className="font-medium text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
