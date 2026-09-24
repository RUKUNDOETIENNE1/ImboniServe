import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface HealthSignal {
  name: string
  score: number
  status: 'healthy' | 'warning' | 'critical'
  detail: string
}

interface SystemHealthWidgetProps {
  signals: HealthSignal[]
  overallScore: number
  overallStatus: 'healthy' | 'warning' | 'critical'
}

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  healthy: { color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle, label: 'Healthy' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-500', icon: AlertTriangle, label: 'Warning' },
  critical: { color: 'text-red-600', bg: 'bg-red-500', icon: XCircle, label: 'Critical' },
}

export default function SystemHealthWidget({ signals, overallScore, overallStatus }: SystemHealthWidgetProps) {
  const overall = statusConfig[overallStatus] ?? statusConfig.healthy
  const OverallIcon = overall.icon

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">System Health Signals</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${overall.bg} ${overallStatus === 'healthy' ? '' : 'animate-pulse'}`} />
          <span className={`text-xs font-medium ${overall.color}`}>
            {overall.label} ({overallScore})
          </span>
        </div>
      </div>

      {/* Overall score gauge */}
      <div className="mb-4" aria-label={`Overall system health: ${overallScore}%`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Overall Health</span>
          <span className={`text-sm font-bold ${overall.color}`}>{overallScore}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${overall.bg} rounded-full transition-all`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Individual signals */}
      <div className="space-y-2.5" role="list" aria-label="System health signals">
        {signals.map((signal) => {
          const cfg = statusConfig[signal.status] ?? statusConfig.healthy
          const Icon = cfg.icon
          return (
            <div key={signal.name} className="flex items-center gap-3" role="listitem">
              <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{signal.name}</span>
                  <span className={`text-xs font-medium ${cfg.color}`}>{signal.score}%</span>
                </div>
                <p className="text-xs text-slate-400 truncate">{signal.detail}</p>
              </div>
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className={`h-full ${cfg.bg} rounded-full`}
                  style={{ width: `${signal.score}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
