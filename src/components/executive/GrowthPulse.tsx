import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface GrowthPulseData {
  growthScore: number
  restaurantGrowth: { active: number; new7d: number; new30d: number; growthRate7d: string; activationRate: number }
  founderGrowth: { total: number; active: number; new7d: number; growthRate7d: string }
  campaignMomentum: { active: number; draft: number; paused: number }
  conversionRate: string
  regionalExpansion: { byRegion: Array<{ region: string; signups: number }> }
  acquisitionTrend: string
  marketingHealth: string
  todaySummary: string
}

interface Props {
  data: GrowthPulseData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function GrowthPulse({ data, loading, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-full bg-slate-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Growth pulse unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const scoreColor = data.growthScore >= 70 ? 'text-emerald-600' : data.growthScore >= 40 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = data.growthScore >= 70 ? 'bg-emerald-50 border-emerald-200' : data.growthScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
  const scoreIcon = data.growthScore >= 70 ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : data.growthScore >= 40 ? <AlertTriangle className="w-6 h-6 text-amber-500" /> : <XCircle className="w-6 h-6 text-red-500" />

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse growth pulse' : 'Expand growth pulse'}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">Growth Pulse</h2>
          <p className="text-xs text-slate-500 mt-0.5">Growth Intelligence Command Center</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${scoreBg}`}>
            <div className="flex items-center gap-3">
              {scoreIcon}
              <div>
                <p className="text-xs text-slate-500">Overall Growth Score</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>{data.growthScore}/100</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">{data.todaySummary}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Hospitality Business Growth (7d)"
              value={data.restaurantGrowth.new7d.toString()}
              subValue={`${data.restaurantGrowth.growthRate7d}% rate`}
              trend={data.restaurantGrowth.new7d > 0 ? 'UP' : 'FLAT'}
              status={data.restaurantGrowth.new7d > 0 ? 'HEALTHY' : 'WARNING'}
              drillDownHref="/admin/restaurants"
              onClick={() => onNavigate?.('/admin/restaurants')}
            />
            <KpiCard
              label="Founder Growth (7d)"
              value={data.founderGrowth.new7d.toString()}
              subValue={`${data.founderGrowth.growthRate7d}% rate`}
              trend={data.founderGrowth.new7d > 0 ? 'UP' : 'FLAT'}
              status={data.founderGrowth.new7d > 0 ? 'HEALTHY' : 'WARNING'}
              drillDownHref="/admin/founder-partners"
              onClick={() => onNavigate?.('/admin/founder-partners')}
            />
            <KpiCard
              label="Campaign Momentum"
              value={data.campaignMomentum.active.toString()}
              subValue={`${data.campaignMomentum.draft} draft, ${data.campaignMomentum.paused} paused`}
              status={data.campaignMomentum.active > 0 ? 'HEALTHY' : 'WARNING'}
              drillDownHref="/admin/founder-partners"
              onClick={() => onNavigate?.('/admin/founder-partners')}
            />
            <KpiCard
              label="Conversion Rate"
              value={`${data.conversionRate}%`}
              status={parseFloat(data.conversionRate) >= 15 ? 'HEALTHY' : parseFloat(data.conversionRate) >= 5 ? 'WARNING' : 'CRITICAL'}
              drillDownHref="/admin/founder-partners"
              onClick={() => onNavigate?.('/admin/founder-partners')}
            />
            <KpiCard
              label="Regional Expansion"
              value={data.regionalExpansion.byRegion.length.toString()}
              subValue="active regions"
              drillDownHref="/admin/operations-intelligence"
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
            />
            <KpiCard
              label="Acquisition Trend"
              value={data.acquisitionTrend}
              trend={data.acquisitionTrend === 'ACCELERATING' ? 'UP' : data.acquisitionTrend === 'DECLINING' ? 'DOWN' : 'FLAT'}
              status={data.acquisitionTrend === 'ACCELERATING' ? 'HEALTHY' : data.acquisitionTrend === 'DECLINING' ? 'CRITICAL' : 'WARNING'}
              drillDownHref="/admin/restaurants"
              onClick={() => onNavigate?.('/admin/restaurants')}
            />
            <KpiCard
              label="Marketing Health"
              value={data.marketingHealth}
              status={data.marketingHealth === 'HEALTHY' ? 'HEALTHY' : data.marketingHealth === 'WARNING' ? 'WARNING' : 'CRITICAL'}
              drillDownHref="/admin/founder-partners"
              onClick={() => onNavigate?.('/admin/founder-partners')}
            />
            <KpiCard
              label="Activation Rate"
              value={`${data.restaurantGrowth.activationRate}%`}
              status={data.restaurantGrowth.activationRate >= 70 ? 'HEALTHY' : data.restaurantGrowth.activationRate >= 50 ? 'WARNING' : 'CRITICAL'}
              drillDownHref="/admin/restaurants"
              onClick={() => onNavigate?.('/admin/restaurants')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
