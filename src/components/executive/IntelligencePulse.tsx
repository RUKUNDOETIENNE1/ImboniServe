import { Brain } from 'lucide-react'
import KpiCard from './KpiCard'

export interface IntelligencePulseData {
  overallScore: number
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  centerScores: Record<string, { score: number; status: string; center: string }>
  topDecision: string
  criticalItems: number
  highItems: number
  totalRisks: number
  totalOpportunities: number
}

interface Props {
  data: IntelligencePulseData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function IntelligencePulse({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Intelligence pulse unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const scoreColor = data.overallStatus === 'HEALTHY' ? 'text-emerald-600' : data.overallStatus === 'WARNING' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-600" />
          <h3 className="text-base font-bold text-slate-900">Intelligence Pulse</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Overall Score</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {data.overallScore}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">{data.topDecision}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Critical Items"
          value={data.criticalItems.toString()}
          status={data.criticalItems === 0 ? 'HEALTHY' : 'CRITICAL'}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
        <KpiCard
          label="High Priority Items"
          value={data.highItems.toString()}
          status={data.highItems === 0 ? 'HEALTHY' : 'WARNING'}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
        <KpiCard
          label="Total Risks"
          value={data.totalRisks.toString()}
          status={data.totalRisks === 0 ? 'HEALTHY' : data.totalRisks > 5 ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
        <KpiCard
          label="Total Opportunities"
          value={data.totalOpportunities.toString()}
          trend={data.totalOpportunities > 0 ? 'UP' : 'FLAT'}
          status={data.totalOpportunities > 0 ? 'HEALTHY' : 'WARNING'}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
      </div>
    </div>
  )
}
