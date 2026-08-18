import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react'

interface Exception {
  key: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  action?: string
}

interface ExceptionCenterProps {
  exceptions: Exception[]
  onAction?: (action: string) => void
}

const typeConfig = {
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
}

export default function ExceptionCenter({ exceptions, onAction }: ExceptionCenterProps) {
  const sorted = [...exceptions].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 }
    return order[a.type] - order[b.type]
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Exception Center</h3>
          <p className="text-xs text-slate-500">
            {exceptions.length > 0
              ? `${exceptions.length} operational issue${exceptions.length > 1 ? 's' : ''} detected`
              : 'No exceptions detected'}
          </p>
        </div>
      </div>

      {exceptions.length === 0 ? (
        <div className="text-center py-4">
          <Info className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-sm text-slate-500">All operations normal.</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Financial exceptions">
          {sorted.map((exc) => {
            const cfg = typeConfig[exc.type]
            const Icon = cfg.icon

            return (
              <div
                key={exc.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
                role="listitem"
              >
                <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{exc.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{exc.description}</p>
                </div>
                {exc.action && onAction && (
                  <button
                    onClick={() => onAction(exc.action!)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white text-slate-600 rounded text-xs font-medium hover:bg-slate-50 transition flex-shrink-0"
                    aria-label={`Take action: ${exc.title}`}
                  >
                    Act
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
