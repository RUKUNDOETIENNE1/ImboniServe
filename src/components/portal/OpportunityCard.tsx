/**
 * OpportunityCard — Surfaces a single growth opportunity with CTA.
 */

import { Lightbulb, ArrowRight } from 'lucide-react'

export interface Opportunity {
  type: string
  label: string
  action: string
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onAction?: (action: string) => void
}

const typeColors: Record<string, string> = {
  momentum: 'border-emerald-200 bg-emerald-50',
  conversion: 'border-amber-200 bg-amber-50',
  stalled: 'border-red-200 bg-red-50',
  create_campaign: 'border-blue-200 bg-blue-50',
  create_code: 'border-purple-200 bg-purple-50',
  share_code: 'border-teal-200 bg-teal-50',
  follow_up: 'border-amber-200 bg-amber-50',
  contact_stalled: 'border-red-200 bg-red-50',
  keep_momentum: 'border-emerald-200 bg-emerald-50',
}

export default function OpportunityCard({ opportunity, onAction }: OpportunityCardProps) {
  const bg = typeColors[opportunity.type] || 'border-slate-200 bg-slate-50'

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bg}`}>
      <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-slate-700">{opportunity.label}</p>
        {onAction && (
          <button
            onClick={() => onAction(opportunity.action)}
            className="mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
          >
            Take action <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
