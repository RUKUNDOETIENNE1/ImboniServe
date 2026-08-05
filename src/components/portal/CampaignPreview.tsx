/**
 * CampaignPreview — Compact campaign card with performance metrics and actions.
 */

import { Megaphone, Pause, Play, Copy, Archive, BarChart3, Calendar } from 'lucide-react'

export interface CampaignData {
  id: string
  name: string
  description: string | null
  channel: string | null
  status: string
  startDate: string | null
  endDate: string | null
  targetSignups: number | null
  targetConversions: number | null
  actualSignups: number
  actualConversions: number
  actualRevenueCents: number
  budgetCents: number | null
  conversionRate: number
  codeCount: number
}

interface CampaignPreviewProps {
  campaign: CampaignData
  onAction?: (action: string, campaignId: string) => void
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function CampaignPreview({ campaign, onAction }: CampaignPreviewProps) {
  const signupPct = campaign.targetSignups ? Math.min((campaign.actualSignups / campaign.targetSignups) * 100, 100) : 0
  const convPct = campaign.targetConversions ? Math.min((campaign.actualConversions / campaign.targetConversions) * 100, 100) : 0

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
            {campaign.channel && <p className="text-xs text-slate-500">{campaign.channel}</p>}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[campaign.status] || 'bg-slate-100 text-slate-600'}`}>
          {campaign.status}
        </span>
      </div>

      {campaign.description && <p className="text-sm text-slate-600 mb-3">{campaign.description}</p>}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500">Signups</p>
          <p className="text-lg font-bold text-slate-800">{campaign.actualSignups}</p>
          {campaign.targetSignups && (
            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${signupPct}%` }} />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500">Conversions</p>
          <p className="text-lg font-bold text-slate-800">{campaign.actualConversions}</p>
          {campaign.targetConversions && (
            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${convPct}%` }} />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(campaign.actualRevenueCents)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{campaign.conversionRate.toFixed(1)}% conversion rate</span>
        <span className="text-slate-300">•</span>
        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{campaign.codeCount} codes</span>
      </div>

      {onAction && campaign.status !== 'CANCELLED' && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          {campaign.status === 'ACTIVE' && (
            <button
              onClick={() => onAction('pauseCampaign', campaign.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
            >
              <Pause className="w-3.5 h-3.5" aria-hidden="true" /> Pause
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button
              onClick={() => onAction('resumeCampaign', campaign.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" /> Resume
            </button>
          )}
          <button
            onClick={() => onAction('duplicateCampaign', campaign.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Duplicate
          </button>
          <button
            onClick={() => onAction('archiveCampaign', campaign.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" /> Archive
          </button>
        </div>
      )}
    </div>
  )
}
