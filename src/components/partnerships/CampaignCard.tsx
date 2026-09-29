import { Megaphone, Plus, Rocket, Calendar, Target } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CampaignCardProps {
  campaigns: any[]
  canManage: boolean
  onAction: (action: string, data?: Record<string, unknown>) => void
}

export default function CampaignCard({ campaigns, canManage, onAction }: CampaignCardProps) {
  const hasCampaigns = campaigns.length > 0
  const activeCampaign = campaigns.find((c) => c.status === 'ACTIVE' || c.status === 'DRAFT')

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Campaign</h3>
            <p className="text-xs text-slate-500">
              {hasCampaigns ? `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''}` : 'No campaigns yet'}
            </p>
          </div>
        </div>
        {hasCampaigns && activeCampaign && (
          <StatusBadge status={activeCampaign.status} size="sm" />
        )}
      </div>

      {!hasCampaigns ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-3">
            Create a default campaign to enable founder code tracking.
          </p>
          {canManage && (
            <button
              onClick={() => onAction('createCampaign', { name: 'Default Campaign', channel: 'founder_referral' })}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Default Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.slice(0, 3).map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{campaign.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {campaign.startDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </span>
                  )}
                  {campaign.targetSignups != null && (
                    <span className="inline-flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {campaign.targetSignups} signups
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={campaign.status} size="sm" />
            </div>
          ))}

          {canManage && activeCampaign?.status === 'DRAFT' && (
            <button
              onClick={() => onAction('launchCampaign', { campaignId: activeCampaign.id })}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
            >
              <Rocket className="w-4 h-4" />
              Launch Campaign
            </button>
          )}

          {canManage && (
            <button
              onClick={() => onAction('createCampaign', { name: 'New Campaign', channel: 'founder_referral' })}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Campaign
            </button>
          )}
        </div>
      )}
    </div>
  )
}
