import { ArrowRight, TrendingUp, Target } from 'lucide-react'
import KpiCard from './KpiCard'

export interface CampaignMetricsData {
  active: number
  draft: number
  paused: number
  completed: number
  total: number
  topCampaigns: Array<{
    id: string
    name: string
    partnerName: string
    channel: string
    status: string
    signups: number
    conversions: number
    conversionRate: string
    revenueRWF: number
    targetProgress: number
  }>
  byChannel: Array<{
    channel: string
    count: number
    signups: number
    conversions: number
    revenueCents: number
  }>
}

interface Props {
  data: CampaignMetricsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CampaignPerformanceCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Campaign performance data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Campaign Performance Center</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Active Campaigns" value={data.active.toString()} status={data.active > 0 ? 'HEALTHY' : 'WARNING'} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Draft" value={data.draft.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Paused" value={data.paused.toString()} status={data.paused > data.active ? 'WARNING' : 'HEALTHY'} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Completed" value={data.completed.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
      </div>

      {/* Top Campaigns */}
      {data.topCampaigns.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top-Performing Campaigns</p>
          <div className="space-y-2">
            {data.topCampaigns.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => onNavigate?.('/admin/founder-partners')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('/admin/founder-partners') }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.partnerName} - {c.channel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.status}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {c.signups} signups</span>
                  <span>{c.conversions} conversions</span>
                  <span className="font-medium text-slate-700">{c.conversionRate}% conversion</span>
                  <span>{c.revenueRWF.toLocaleString()} RWF</span>
                  {c.targetProgress > 0 && (
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {c.targetProgress}% of target</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Channel */}
      {data.byChannel.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Channel Performance</p>
          <ul className="space-y-1.5">
            {data.byChannel.map((ch, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{ch.channel}</span>
                <span className="font-medium text-slate-900">{ch.count} campaigns, {ch.signups} signups, {ch.conversions} conversions</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
