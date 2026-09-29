import { Lightbulb, ArrowRight, Rocket } from 'lucide-react'

export interface PartnershipOpportunity {
  type: string
  title: string
  description: string
  action: string
  expectedImpact: string
  link: string
}

interface Props {
  opportunities: PartnershipOpportunity[]
  loading?: boolean
  onNavigate?: (link: string) => void
}

const typeIcon: Record<string, string> = {
  PARTNER_TYPE_EXPANSION: '🤝',
  REGIONAL_EXPANSION: '🌍',
  CAMPAIGN_LAUNCH: '🚀',
  PIPELINE_CONVERSION: '📊',
  TOP_PARTNER_EXPANSION: '⭐',
}

export default function PartnershipOpportunityCenter({ opportunities, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Partnership Opportunities</h3>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-slate-400">No opportunities identified at this time.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <button
              key={i}
              onClick={() => onNavigate?.(opp.link)}
              className="flex items-start gap-3 w-full rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50/30 to-white p-4 hover:shadow-md transition-all text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">
                {typeIcon[opp.type] || '💡'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 mb-1">{opp.title}</p>
                <p className="text-xs text-slate-600 mb-2">{opp.description}</p>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 mb-2">
                  <p className="text-xs text-blue-700">{opp.expectedImpact}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Rocket className="w-3 h-3" />
                  {opp.action}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
