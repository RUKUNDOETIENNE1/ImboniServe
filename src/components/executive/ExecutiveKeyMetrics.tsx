import { BarChart3 } from 'lucide-react'
import KpiCard from './KpiCard'

export interface ExecutiveKeyMetricsData {
  activeBusinesses: number
  totalBusinesses: number
  inactiveBusinesses: number
  newBusinesses7d: number
  activeSubscriptions: number
  trialSubscriptions: number
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  retentionRate: number
  churnRate: number
  adoptionRate: number
  activePartners: number
  totalPartnerships: number
  totalCustomers: number
  activeCustomers30d: number
  openSupportConversations: number
  totalBranches: number
  activeBranches: number
  qrEnabledBusinesses: number
  remoteOrderEnabledBusinesses: number
}

interface Props {
  data: ExecutiveKeyMetricsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function ExecutiveKeyMetrics({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Executive Key Metrics</h3>
        </div>
        <p className="text-sm text-slate-400">Key metrics unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const activeRatio = data.totalBusinesses > 0 ? data.activeBusinesses / data.totalBusinesses : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Executive Key Metrics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Active Businesses"
          value={data.activeBusinesses.toString()}
          subValue={`of ${data.totalBusinesses}`}
          status={activeRatio >= 0.7 ? 'HEALTHY' : activeRatio >= 0.4 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="New Businesses (7d)"
          value={data.newBusinesses7d.toString()}
          trend={data.newBusinesses7d > 0 ? 'UP' : 'FLAT'}
        />
        <KpiCard
          label="Active Subscriptions"
          value={data.activeSubscriptions.toString()}
          drillDownHref="/admin/subscriptions"
          onClick={() => onNavigate?.('/admin/subscriptions')}
        />
        <KpiCard
          label="Retention Rate"
          value={`${data.retentionRate}%`}
          status={data.retentionRate >= 90 ? 'HEALTHY' : data.retentionRate >= 70 ? 'WARNING' : 'CRITICAL'}
        />
        <KpiCard
          label="Churn Rate"
          value={`${data.churnRate}%`}
          status={data.churnRate <= 3 ? 'HEALTHY' : data.churnRate <= 10 ? 'WARNING' : 'CRITICAL'}
        />
        <KpiCard
          label="Active Partners"
          value={data.activePartners.toString()}
          subValue={`of ${data.totalPartnerships}`}
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
        <KpiCard
          label="Active Customers (30d)"
          value={data.activeCustomers30d.toString()}
          subValue={`of ${data.totalCustomers} total`}
        />
        <KpiCard
          label="Adoption Rate"
          value={`${data.adoptionRate}%`}
          status={data.adoptionRate >= 60 ? 'HEALTHY' : data.adoptionRate >= 30 ? 'WARNING' : 'CRITICAL'}
        />
        <KpiCard
          label="Grace Period"
          value={data.gracePeriodSubscriptions.toString()}
          status={data.gracePeriodSubscriptions === 0 ? 'HEALTHY' : 'WARNING'}
        />
        <KpiCard
          label="Past Due"
          value={data.pastDueSubscriptions.toString()}
          status={data.pastDueSubscriptions === 0 ? 'HEALTHY' : 'CRITICAL'}
        />
        <KpiCard
          label="Open Support"
          value={data.openSupportConversations.toString()}
        />
        <KpiCard
          label="QR Enabled"
          value={data.qrEnabledBusinesses.toString()}
          subValue={`of ${data.totalBusinesses}`}
        />
      </div>
    </div>
  )
}
