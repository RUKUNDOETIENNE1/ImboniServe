import { ArrowRight, Rocket, Pause, TrendingUp, MapPin, Users, RefreshCw } from 'lucide-react'

export interface OpportunityData {
  title: string
  description: string
  type: 'SCALE' | 'LAUNCH' | 'OPTIMIZE' | 'EXPAND' | 'PAUSE' | 'SUPPORT'
  action: string
  link: string
  impact: string
}

interface Props {
  opportunities: OpportunityData[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

const typeConfig = {
  SCALE: { icon: Rocket, bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', iconColor: 'text-emerald-500' },
  LAUNCH: { icon: Rocket, bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-500' },
  OPTIMIZE: { icon: RefreshCw, bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', iconColor: 'text-amber-500' },
  EXPAND: { icon: MapPin, bg: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', iconColor: 'text-purple-500' },
  PAUSE: { icon: Pause, bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', iconColor: 'text-red-500' },
  SUPPORT: { icon: Users, bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', iconColor: 'text-orange-500' },
}

export default function MarketingOpportunityCenter({ opportunities, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 w-full bg-slate-100 rounded" />)}
        </div>
      </div>
    )
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Marketing Opportunity Center</h3>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <p className="text-sm text-slate-500">No specific opportunities detected at this time. Monitor growth metrics for emerging patterns.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Marketing Opportunity Center</h3>

      <div className="space-y-2">
        {opportunities.map((opp, i) => {
          const cfg = typeConfig[opp.type]
          const Icon = cfg.icon

          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${cfg.bg} cursor-pointer hover:shadow-sm transition-shadow`}
              onClick={() => onNavigate?.(opp.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.(opp.link) }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{opp.type}</span>
                      <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{opp.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">Action: <span className="font-medium">{opp.action}</span></span>
                      <span className="text-slate-500">Impact: <span className="font-medium">{opp.impact}</span></span>
                    </div>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 ${cfg.iconColor} flex-shrink-0 mt-1`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
