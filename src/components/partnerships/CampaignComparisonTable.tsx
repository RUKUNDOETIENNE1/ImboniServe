import { ArrowUpDown, Trophy, AlertCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CampaignComparisonItem {
  id: string
  name: string
  channel?: string | null
  status: string
  signups: number
  conversions: number
  conversionRate: number
  revenueCents: number
}

interface CampaignComparisonTableProps {
  campaigns: CampaignComparisonItem[]
  bestCampaignId?: string | null
  worstCampaignId?: string | null
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K`
  return `${(cents / 100).toFixed(0)}`
}

export default function CampaignComparisonTable({
  campaigns,
  bestCampaignId,
  worstCampaignId,
}: CampaignComparisonTableProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Campaign Comparison</h3>
        <p className="text-sm text-slate-400">No campaigns to compare.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Campaign Comparison</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Campaign comparison">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <th scope="col" className="px-4 py-3 text-left font-medium">Campaign</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Signups</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Conversions</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Conv. Rate</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c) => {
              const isBest = c.id === bestCampaignId
              const isWorst = c.id === worstCampaignId

              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" aria-label="Best campaign" />}
                      {isWorst && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" aria-label="Lowest performing" />}
                      <div>
                        <p className="font-medium text-slate-700">{c.name}</p>
                        {c.channel && <p className="text-xs text-slate-500">{c.channel}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{c.signups}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{c.conversions}</td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    c.conversionRate >= 20 ? 'text-green-600'
                    : c.conversionRate >= 10 ? 'text-blue-600'
                    : c.conversionRate > 0 ? 'text-amber-600'
                    : 'text-slate-400'
                  }`}>
                    {c.conversionRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatCurrency(c.revenueCents)} RWF
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
