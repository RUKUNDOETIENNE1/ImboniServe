import { Lightbulb, AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react'

export interface Opportunity {
  key: string
  type: 'warning' | 'info' | 'success'
  title: string
  description: string
  action?: string
}

interface OpportunityCenterProps {
  opportunities: Opportunity[]
  onAction?: (action: string) => void
}

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
}

export default function OpportunityCenter({ opportunities, onAction }: OpportunityCenterProps) {
  const sorted = [...opportunities].sort((a, b) => {
    const order = { warning: 0, info: 1, success: 2 }
    return order[a.type] - order[b.type]
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Opportunity Center</h3>
          <p className="text-xs text-slate-500">
            {opportunities.length > 0
              ? `${opportunities.length} actionable insight${opportunities.length > 1 ? 's' : ''}`
              : 'No opportunities detected'}
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">All clear. No opportunities detected.</p>
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Growth opportunities">
          {sorted.map((opp) => {
            const cfg = typeConfig[opp.type]
            const Icon = cfg.icon

            return (
              <div
                key={opp.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
                role="listitem"
              >
                <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{opp.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{opp.description}</p>
                </div>
                {opp.action && onAction && (
                  <button
                    onClick={() => onAction(opp.action!)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white text-slate-600 rounded text-xs font-medium hover:bg-slate-50 transition flex-shrink-0"
                    aria-label={`Take action: ${opp.title}`}
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
