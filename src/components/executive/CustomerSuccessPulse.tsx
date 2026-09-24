import { Heart, Building2, Zap, AlertTriangle, CheckCircle, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import KpiCard from './KpiCard'

export interface CustomerSuccessPulseData {
  customerSuccessHealthScore: number
  activeBusinesses: number
  newActivations: number
  businessesAtRisk: number
  healthyBusinesses: number
  retentionRate: number
  expansionOpportunities: number
  todaySummary: string
}

interface Props {
  data: CustomerSuccessPulseData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CustomerSuccessPulse({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Customer success pulse unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const healthStatus = data.customerSuccessHealthScore >= 70 ? 'HEALTHY' : data.customerSuccessHealthScore >= 40 ? 'WARNING' : 'CRITICAL'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">Customer Success Pulse</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Health Score</span>
          <span className={`text-2xl font-bold ${healthStatus === 'HEALTHY' ? 'text-emerald-600' : healthStatus === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>
            {data.customerSuccessHealthScore}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">{data.todaySummary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Active Hospitality Businesses"
          value={data.activeBusinesses.toString()}
          status={data.activeBusinesses > 20 ? 'HEALTHY' : data.activeBusinesses > 5 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="New Activations"
          value={data.newActivations.toString()}
          trend={data.newActivations > 0 ? 'UP' : 'FLAT'}
          status={data.newActivations > 0 ? 'HEALTHY' : 'WARNING'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Businesses at Risk"
          value={data.businessesAtRisk.toString()}
          status={data.businessesAtRisk === 0 ? 'HEALTHY' : data.businessesAtRisk > 5 ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Healthy Businesses"
          value={data.healthyBusinesses.toString()}
          status={data.healthyBusinesses > 10 ? 'HEALTHY' : data.healthyBusinesses > 3 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Customer Health Score"
          value={`${data.customerSuccessHealthScore}/100`}
          status={healthStatus as any}
          explanation="Composite of activation rate, retention, adoption, engagement, and support burden"
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
        <KpiCard
          label="Retention Rate"
          value={`${data.retentionRate}%`}
          status={data.retentionRate >= 90 ? 'HEALTHY' : data.retentionRate >= 75 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/subscriptions"
          onClick={() => onNavigate?.('/admin/subscriptions')}
        />
        <KpiCard
          label="Expansion Opportunities"
          value={data.expansionOpportunities.toString()}
          trend={data.expansionOpportunities > 0 ? 'UP' : 'FLAT'}
          status={data.expansionOpportunities > 0 ? 'HEALTHY' : 'WARNING'}
          drillDownHref="/admin/restaurants"
          onClick={() => onNavigate?.('/admin/restaurants')}
        />
        <KpiCard
          label="Success Status"
          value={healthStatus}
          status={healthStatus as any}
          drillDownHref="/admin/operations-intelligence"
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
        />
      </div>
    </div>
  )
}
