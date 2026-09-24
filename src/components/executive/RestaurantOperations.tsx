import { ArrowRight, MapPin } from 'lucide-react'
import KpiCard from './KpiCard'

export interface RestaurantOpsData {
  awaitingApproval: number
  inactiveBusinesses: number
  activeBusinesses: number
  totalBusinesses: number
  newYesterday: number
  activationRate: number
  followUpNeeded: number
  regionalDistribution: Array<{ region: string; signups: number; conversions: number }>
}

interface Props {
  data: RestaurantOpsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function RestaurantOperations({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Hospitality business operations data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Hospitality Business Operations</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Active Businesses"
          value={data.activeBusinesses.toString()}
          status="HEALTHY"
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Inactive"
          value={data.inactiveBusinesses.toString()}
          status={data.inactiveBusinesses > data.activeBusinesses * 0.3 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="New Yesterday"
          value={data.newYesterday.toString()}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Activation Rate"
          value={`${data.activationRate}%`}
          status={data.activationRate >= 70 ? 'HEALTHY' : data.activationRate >= 50 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
      </div>

      {/* Follow-up needed */}
      {data.followUpNeeded > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-900">
            {data.followUpNeeded} businesses need follow-up (10+ days without action)
          </p>
        </div>
      )}

      {/* Regional Distribution */}
      {data.regionalDistribution.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Regional Distribution</p>
          <ul className="space-y-1.5">
            {data.regionalDistribution.slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{r.region || 'Unknown'}</span>
                <span className="font-medium text-slate-900">{r.signups} signups, {r.conversions} conversions</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => onNavigate?.('/admin/restaurants')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View All Businesses</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
