import { Target, TrendingUp, ArrowRight, Activity } from 'lucide-react'

export interface CampaignIntelligenceData {
  campaignPerformance: Array<{
    id: string
    name: string
    partnership: { id: string; name: string }
    channel: string | null
    status: string
    signups: number
    conversions: number
    conversionRate: number
    revenueCents: number
    targetSignups: number | null
    targetConversions: number | null
  }>
  activeCampaigns: number
  draftCampaigns: number
  pausedCampaigns: number
  completedCampaigns: number
  activeCodes: number
  totalCodes: number
  exhaustedCodes: number
  expiredCodes: number
  regionalPerformance: Array<{
    region: string
    partnerCount: number
    totalSignups: number
    totalConversions: number
    conversionRate: number
  }>
}

interface Props {
  data: CampaignIntelligenceData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CampaignIntelligence({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Campaign intelligence unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const totalSignups = data.campaignPerformance.reduce((sum, c) => sum + c.signups, 0)
  const totalConversions = data.campaignPerformance.reduce((sum, c) => sum + c.conversions, 0)
  const avgConversionRate = data.campaignPerformance.length > 0
    ? data.campaignPerformance.reduce((sum, c) => sum + c.conversionRate, 0) / data.campaignPerformance.length
    : 0
  const totalRevenue = data.campaignPerformance.reduce((sum, c) => sum + c.revenueCents, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Campaign Intelligence</h3>
      </div>

      {/* Campaign Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Active Campaigns</p>
          <p className="text-xl font-bold text-slate-900">{data.activeCampaigns}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Total Signups</p>
          <p className="text-xl font-bold text-slate-900">{totalSignups}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Avg Conversion</p>
          <p className="text-xl font-bold text-slate-900">{avgConversionRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900">{Math.round(totalRevenue / 100).toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top Campaigns</p>
        <div className="space-y-2">
          {data.campaignPerformance.length > 0 ? data.campaignPerformance.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate?.('/admin/founder-partners')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-400">{c.partnership.name} · {c.channel || 'No channel'}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Signups</p>
                  <p className="text-sm font-medium text-slate-900">{c.signups}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Conv.</p>
                  <p className="text-sm font-medium text-slate-900">{c.conversions}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Rate</p>
                  <p className="text-sm font-medium text-emerald-600">{c.conversionRate.toFixed(1)}%</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </button>
          )) : (
            <p className="text-sm text-slate-400">No campaign performance data available.</p>
          )}
        </div>
      </div>

      {/* Founder Code Usage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Active Codes</p>
          <p className="text-lg font-bold text-emerald-700">{data.activeCodes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Total Codes</p>
          <p className="text-lg font-bold text-slate-900">{data.totalCodes}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Exhausted</p>
          <p className="text-lg font-bold text-amber-700">{data.exhaustedCodes}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Expired</p>
          <p className="text-lg font-bold text-slate-700">{data.expiredCodes}</p>
        </div>
      </div>
    </div>
  )
}
