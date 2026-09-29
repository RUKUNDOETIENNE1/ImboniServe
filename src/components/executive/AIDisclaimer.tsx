import { Info, AlertTriangle } from 'lucide-react'

/**
 * Shared advisory disclaimer for all AI assistant components.
 *
 * Trust principle (EGR-009): Every customer interaction must increase trust.
 * AI recommendations are advisory only — they must never create false certainty.
 * This disclaimer is displayed at the point of decision, not buried in legal terms,
 * so executives understand the nature of the insights before acting on them.
 */
export default function AIDisclaimer() {
  return (
    <div className="mt-4 flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-100 p-2">
      <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-slate-500 leading-relaxed">
        AI-generated insights are advisory only, derived from your business data.
        Always use your judgment before acting. Confidence scores reflect data quality, not certainty.
      </p>
    </div>
  )
}

/**
 * Low-confidence warning shown when a recommendation's confidence is below 50%.
 * Communicates uncertainty honestly so executives verify before acting.
 */
export function LowConfidenceWarning() {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
      <p className="text-[11px] text-red-600 font-medium">
        Low confidence — verify with your data before acting.
      </p>
    </div>
  )
}
