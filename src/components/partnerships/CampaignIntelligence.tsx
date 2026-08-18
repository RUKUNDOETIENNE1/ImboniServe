import { Megaphone, TrendingUp, Users, DollarSign, Percent } from 'lucide-react'

interface CampaignIntel {
  id: string
  name: string
  partnership: { id: string; name: string }
  channel?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  targetSignups?: number | null
  targetConversions?: number | null
  actualSignups: number
  actualConversions: number
  actualRevenueCents: number
  budgetCents?: number | null
  codeCount: number
  commissionCount: number
  conversionRate: number
  createdAt: string
}

interface CampaignIntelligenceProps {
  campaigns: CampaignIntel[]
}

function formatCurrency(cents: number): string {
  return `${(cents / 100).toLocaleString()} RWF`
}

function formatStatus(status: string): string {
  return status.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
  DRAFT: 'bg-slate-50 text-slate-600',
}

export default function CampaignIntelligence({ campaigns }: CampaignIntelligenceProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Campaign Intelligence</h3>
        </div>
        <span className="text-xs text-slate-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No campaigns found.</p>
      ) : (
        <div className="space-y-2" role="list" aria-label="Campaign intelligence">
          {campaigns.slice(0, 20).map((c) => {
            const progress = c.targetSignups && c.targetSignups > 0
              ? Math.min(100, Math.round((c.actualSignups / c.targetSignups) * 100))
              : 0
            const convProgress = c.targetConversions && c.targetConversions > 0
              ? Math.min(100, Math.round((c.actualConversions / c.targetConversions) * 100))
              : 0

            return (
              <div key={c.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition" role="listitem">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.partnership.name} · {c.channel ?? '—'}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[c.status] ?? 'bg-slate-50 text-slate-600'}`}>
                    {formatStatus(c.status)}
                  </span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    <div>
                      <p className="text-slate-400">Signups</p>
                      <p className="font-bold text-slate-700">{c.actualSignups}{c.targetSignups ? `/${c.targetSignups}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    <div>
                      <p className="text-slate-400">Conversions</p>
                      <p className="font-bold text-slate-700">{c.actualConversions}{c.targetConversions ? `/${c.targetConversions}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    <div>
                      <p className="text-slate-400">Conv Rate</p>
                      <p className="font-bold text-slate-700">{c.conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    <div>
                      <p className="text-slate-400">Revenue</p>
                      <p className="font-bold text-slate-700">{formatCurrency(c.actualRevenueCents)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
                      <span>Signup Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
                      <span>Conversion Progress</span>
                      <span>{convProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${convProgress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{c.codeCount} code(s)</span>
                  <span>{c.commissionCount} commission(s)</span>
                  {c.budgetCents && <span>Budget: {formatCurrency(c.budgetCents)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
