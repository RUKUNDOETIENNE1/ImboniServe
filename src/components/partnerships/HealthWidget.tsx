import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface HealthWidgetProps {
  healthScore: any
}

export default function HealthWidget({ healthScore }: HealthWidgetProps) {
  if (!healthScore) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-700">Health Score</h4>
        </div>
        <p className="text-sm text-slate-400">Not initialized</p>
      </div>
    )
  }

  const score = healthScore.score ?? 0
  const grade = healthScore.grade ?? '—'
  const trend = healthScore.trendDirection ?? 'STABLE'

  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  const gradeColor =
    grade === 'A' ? 'bg-green-100 text-green-700'
    : grade === 'B' ? 'bg-blue-100 text-blue-700'
    : grade === 'C' ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus
  const trendColor = trend === 'UP' ? 'text-green-500' : trend === 'DOWN' ? 'text-red-500' : 'text-slate-400'

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-semibold text-slate-700">Health Score</h4>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl font-bold ${scoreColor}`} aria-label={`Health score: ${score}`}>
          {score}
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor}`} aria-label={`Grade: ${grade}`}>
          {grade}
        </div>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`} aria-label={`Trend: ${trend}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {trend}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1.5 text-xs">
        {healthScore.acquisitionScore != null && (
          <ScoreBar label="Acquisition" value={healthScore.acquisitionScore} />
        )}
        {healthScore.conversionScore != null && (
          <ScoreBar label="Conversion" value={healthScore.conversionScore} />
        )}
        {healthScore.revenueScore != null && (
          <ScoreBar label="Revenue" value={healthScore.revenueScore} />
        )}
        {healthScore.engagementScore != null && (
          <ScoreBar label="Engagement" value={healthScore.engagementScore} />
        )}
      </div>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-slate-600 w-8 text-right">{value}</span>
    </div>
  )
}
