import { AlertTriangle, AlertCircle, Info, ArrowRight, CheckCircle } from 'lucide-react'

export interface OpsException {
  key: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  cause: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
  affectedEntities?: string[]
  action?: string
}

interface ExceptionPanelProps {
  exceptions: OpsException[]
  onAction?: (action: string, exception: OpsException) => void
  canResolve?: boolean
}

const typeIcons: Record<string, any> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
}

const severityOrder = { high: 0, medium: 1, low: 2 }

export default function ExceptionPanel({ exceptions, onAction, canResolve }: ExceptionPanelProps) {
  const sorted = [...exceptions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Exception Investigation</h3>
        </div>
        <span className="text-xs text-slate-500">
          {exceptions.length} issue{exceptions.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      {exceptions.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-600 font-medium">No exceptions detected</p>
          <p className="text-xs text-slate-400 mt-1">All operational checks passed.</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Operational exceptions">
          {sorted.map((exc) => {
            const Icon = typeIcons[exc.type] ?? AlertCircle
            const colors = typeColors[exc.type] ?? typeColors.info
            return (
              <div
                key={exc.key}
                className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                role="listitem"
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${colors.text}`}>{exc.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${
                        exc.severity === 'high' ? 'bg-red-100 text-red-700'
                        : exc.severity === 'medium' ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        {exc.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{exc.description}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p><span className="text-slate-400 font-medium">Cause:</span> <span className="text-slate-600">{exc.cause}</span></p>
                      <p><span className="text-slate-400 font-medium">Recommendation:</span> <span className="text-slate-600">{exc.recommendation}</span></p>
                    </div>
                    {exc.affectedEntities && exc.affectedEntities.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {exc.affectedEntities.slice(0, 5).map((id) => (
                          <span key={id} className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-slate-600 font-mono">
                            {id.slice(-12)}
                          </span>
                        ))}
                        {exc.affectedEntities.length > 5 && (
                          <span className="text-xs text-slate-400">
                            +{exc.affectedEntities.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    {exc.action && canResolve && onAction && (
                      <button
                        onClick={() => onAction(exc.action!, exc)}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                        aria-label={`Take action: ${exc.title}`}
                      >
                        Resolve <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
