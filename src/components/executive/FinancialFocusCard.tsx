import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown, Shield, Wallet } from 'lucide-react'

export interface FinancialFocusData {
  greeting: string
  revenueYesterday: number
  revenueYesterdayChange: number
  collections: number
  cashPosition: number
  outstandingLiabilities: number
  integrityScore: number
  criticalAlerts: Array<{ title: string; description: string }>
  aiSummary: string
}

interface Props {
  data: FinancialFocusData | null
  loading?: boolean
}

export default function FinancialFocusCard({ data, loading }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-full bg-slate-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Financial focus unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const integrityColor = data.integrityScore >= 80 ? 'text-emerald-600' : data.integrityScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const revenueTrendIcon = data.revenueYesterdayChange >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse financial focus' : 'Expand financial focus'}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">{data.greeting}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Financial Focus</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Key metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500">Revenue Yesterday</p>
              </div>
              <p className="text-base font-bold text-slate-900">{Math.round(data.revenueYesterday).toLocaleString()} RWF</p>
              <div className="flex items-center gap-1 mt-0.5">
                {revenueTrendIcon}
                <span className={`text-xs ${data.revenueYesterdayChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.revenueYesterdayChange >= 0 ? '+' : ''}{data.revenueYesterdayChange.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500">Collections (30d)</p>
              </div>
              <p className="text-base font-bold text-slate-900">{Math.round(data.collections).toLocaleString()} RWF</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500">Outstanding Liabilities</p>
              </div>
              <p className="text-base font-bold text-slate-900">{Math.round(data.outstandingLiabilities).toLocaleString()} RWF</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-xs text-slate-500">Integrity Score</p>
              </div>
              <p className={`text-base font-bold ${integrityColor}`}>{data.integrityScore}/100</p>
            </div>
          </div>

          {/* Critical alerts */}
          {data.criticalAlerts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">Critical Finance Alerts</p>
              <ul className="space-y-1.5">
                {data.criticalAlerts.slice(0, 3).map((alert, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-600">{alert.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Summary */}
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">AI Financial Summary</p>
            <p className="text-sm text-slate-700">{data.aiSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
