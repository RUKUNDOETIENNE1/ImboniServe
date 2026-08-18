import { ArrowRight, MapPin, TrendingUp } from 'lucide-react'

export interface RegionalGrowthData {
  byRegion: Array<{
    region: string
    partnerCount: number
    signups: number
    conversions: number
    conversionRate: string
    revenueRWF: number
  }>
  byCity: Array<{ city: string; businessCount: number }>
  untappedRegions: Array<{ region: string; signups: number; opportunity: string }>
}

interface Props {
  data: RegionalGrowthData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RegionalGrowthIntelligence({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 w-full bg-slate-100 rounded" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Regional Growth Intelligence</h3>
        <p className="text-sm text-slate-400">No regional growth data available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Regional Growth Intelligence</h3>

      {/* By Region */}
      {data.byRegion.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Growth by Region</p>
          <div className="space-y-2">
            {data.byRegion.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => onNavigate?.('/admin/operations-intelligence')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('/admin/operations-intelligence') }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.region}</p>
                    <p className="text-xs text-slate-500">{r.partnerCount} partners</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{r.signups}</p>
                    <p className="text-slate-400">signups</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{r.conversions}</p>
                    <p className="text-slate-400">conv.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{r.conversionRate}%</p>
                    <p className="text-slate-400">rate</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By City */}
      {data.byCity.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Hospitality Business Density by City</p>
          <ul className="space-y-1.5">
            {data.byCity.slice(0, 5).map((c, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{c.city}</span>
                <span className="font-medium text-slate-900">{c.businessCount} businesses</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Untapped Regions */}
      {data.untappedRegions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Untapped Regions</p>
          <div className="space-y-2">
            {data.untappedRegions.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">{r.region}</p>
                  <p className="text-xs text-amber-700">{r.opportunity}</p>
                </div>
                <span className="text-xs text-amber-600">{r.signups} signups</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
