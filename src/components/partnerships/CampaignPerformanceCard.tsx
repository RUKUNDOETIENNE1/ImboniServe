import { Megaphone, Calendar, Target, TrendingUp, DollarSign, Users } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CampaignPerformanceCardProps {
  campaign: {
    id: string
    name: string
    channel?: string | null
    status: string
    signups: number
    conversions: number
    conversionRate: number
    revenueCents: number
    targetSignups?: number | null
    targetConversions?: number | null
    startDate?: string | null
    endDate?: string | null
    commissionCount?: number
  }
  canManage?: boolean
  onAction?: (action: string, data?: Record<string, unknown>) => void
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M RWF`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K RWF`
  return `${(cents / 100).toFixed(0)} RWF`
}

export default function CampaignPerformanceCard({
  campaign,
  canManage,
  onAction,
}: CampaignPerformanceCardProps) {
  const targetProgress = campaign.targetSignups
    ? Math.min((campaign.signups / campaign.targetSignups) * 100, 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 truncate">{campaign.name}</h4>
          {campaign.channel && (
            <p className="text-xs text-slate-500 mt-0.5">Channel: {campaign.channel}</p>
          )}
        </div>
        <StatusBadge status={campaign.status} size="sm" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Metric icon={Users} label="Signups" value={campaign.signups} />
        <Metric icon={TrendingUp} label="Conversions" value={campaign.conversions} />
        <Metric icon={DollarSign} label="Revenue" value={formatCurrency(campaign.revenueCents)} />
      </div>

      {/* Conversion rate */}
      <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg mb-3">
        <span className="text-xs text-slate-500">Conversion Rate</span>
        <span className={`text-sm font-bold ${
          campaign.conversionRate >= 20 ? 'text-green-600'
          : campaign.conversionRate >= 10 ? 'text-blue-600'
          : campaign.conversionRate > 0 ? 'text-amber-600'
          : 'text-slate-400'
        }`}>
          {campaign.conversionRate.toFixed(1)}%
        </span>
      </div>

      {/* Target progress */}
      {campaign.targetSignups != null && campaign.targetSignups > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Target: {campaign.signups}/{campaign.targetSignups}
            </span>
            <span>{targetProgress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${targetProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {campaign.startDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(campaign.startDate).toLocaleDateString()}
          </span>
        )}
        {campaign.endDate && (
          <span>→ {new Date(campaign.endDate).toLocaleDateString()}</span>
        )}
      </div>

      {/* Actions */}
      {canManage && onAction && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {campaign.status === 'DRAFT' && (
            <button
              onClick={() => onAction('launchCampaign', { campaignId: campaign.id })}
              className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
            >
              Launch
            </button>
          )}
          {campaign.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => onAction('pauseCampaign', { campaignId: campaign.id })}
                className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition"
              >
                Pause
              </button>
              <button
                onClick={() => onAction('completeCampaign', { campaignId: campaign.id })}
                className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition"
              >
                Complete
              </button>
            </>
          )}
          {campaign.status === 'PAUSED' && (
            <button
              onClick={() => onAction('resumeCampaign', { campaignId: campaign.id })}
              className="px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition"
            >
              Resume
            </button>
          )}
          {campaign.status === 'COMPLETED' && (
            <button
              onClick={() => onAction('renewCampaign', { campaignId: campaign.id })}
              className="px-2.5 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition"
            >
              Renew
            </button>
          )}
          {campaign.status !== 'CANCELLED' && (
            <button
              onClick={() => onAction('cancelCampaign', { campaignId: campaign.id })}
              className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onAction('duplicateCampaign', { campaignId: campaign.id })}
            className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 transition"
          >
            Duplicate
          </button>
        </div>
      )}
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-bold text-slate-700">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
