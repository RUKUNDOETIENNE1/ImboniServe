import { ArrowRight, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export interface WorkflowData {
  name: string
  currentDuration: string
  targetDuration: string
  trend: string
  bottleneck: string
  link: string
}

interface Props {
  workflows: WorkflowData[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function WorkflowPerformance({ workflows, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Workflow Performance</h3>
        <p className="text-sm text-slate-400">No workflow data available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Workflow Performance</h3>

      <div className="space-y-2">
        {workflows.map((wf, i) => {
          const trendIcon = wf.trend === 'ON_TRACK'
            ? <TrendingUp className="w-4 h-4 text-emerald-500" />
            : <AlertTriangle className="w-4 h-4 text-amber-500" />

          const trendBadge = wf.trend === 'ON_TRACK'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'

          return (
            <div
              key={i}
              className="p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onNavigate?.(wf.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(wf.link) }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-slate-900">{wf.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${trendBadge}`}>{wf.trend}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Current: <span className="font-medium text-slate-700">{wf.currentDuration}</span>
                </span>
                <span>Target: <span className="font-medium text-slate-700">{wf.targetDuration}</span></span>
                {wf.bottleneck !== 'None' && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    {wf.bottleneck}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
