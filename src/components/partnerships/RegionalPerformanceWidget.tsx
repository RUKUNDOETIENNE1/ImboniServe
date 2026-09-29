import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react'

interface RegionalDatum {
  region: string
  partnerCount: number
  totalSignups: number
  totalConversions: number
  totalRevenueCents: number
  conversionRate: number
}

interface RegionalPerformanceWidgetProps {
  data: RegionalDatum[]
  currentRegion?: string | null
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K`
  return `${(cents / 100).toFixed(0)}`
}

export default function RegionalPerformanceWidget({
  data,
  currentRegion,
}: RegionalPerformanceWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Regional Performance</h3>
        </div>
        <p className="text-sm text-slate-400">No regional data available.</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.totalSignups - a.totalSignups)
  const maxSignups = Math.max(...sorted.map((d) => d.totalSignups), 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Regional Performance</h3>
      </div>

      <div className="space-y-3" role="list" aria-label="Regional performance breakdown">
        {sorted.slice(0, 8).map((region) => {
          const isCurrent = currentRegion && region.region === currentRegion
          const width = (region.totalSignups / maxSignups) * 100

          return (
            <div
              key={region.region}
              className={`p-3 rounded-lg ${isCurrent ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50'}`}
              role="listitem"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {region.region}
                  {isCurrent && (
                    <span className="ml-1.5 text-xs text-purple-600 font-medium">(This partner)</span>
                  )}
                </span>
                <span className="text-xs text-slate-500">{region.partnerCount} partners</span>
              </div>

              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${isCurrent ? 'bg-purple-500' : 'bg-blue-400'}`}
                  style={{ width: `${Math.max(width, 2)}%` }}
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  {region.totalSignups}
                </span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  {region.conversionRate.toFixed(1)}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  {formatCurrency(region.totalRevenueCents)} RWF
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
