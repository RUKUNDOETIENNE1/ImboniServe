import { TrendingUp, Users, FileText, Target, Tag, Heart, Activity, ArrowRight } from 'lucide-react'
import KpiCard from './KpiCard'

export interface PartnershipPulseData {
  partnershipHealthScore: number
  totalPartners: number
  activePartners: number
  newApplications: number
  pendingApprovals: number
  activeCampaigns: number
  activeCodes: number
  relationshipHealth: string
  todaySummary: string
}

interface Props {
  data: PartnershipPulseData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function PartnershipPulse({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Partnership pulse unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const healthStatus = data.partnershipHealthScore >= 70 ? 'HEALTHY' : data.partnershipHealthScore >= 40 ? 'WARNING' : 'CRITICAL'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Partnership Pulse</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Health Score</span>
          <span className={`text-2xl font-bold ${healthStatus === 'HEALTHY' ? 'text-emerald-600' : healthStatus === 'WARNING' ? 'text-amber-600' : 'text-red-600'}`}>
            {data.partnershipHealthScore}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">{data.todaySummary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Partners"
          value={data.totalPartners.toString()}
          status={data.totalPartners > 20 ? 'HEALTHY' : data.totalPartners > 5 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
        <KpiCard
          label="Active Partners"
          value={data.activePartners.toString()}
          subValue={`${data.totalPartners > 0 ? Math.round((data.activePartners / data.totalPartners) * 100) : 0}% of total`}
          status={data.activePartners > 10 ? 'HEALTHY' : data.activePartners > 3 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
        <KpiCard
          label="New Applications"
          value={data.newApplications.toString()}
          trend={data.newApplications > 0 ? 'UP' : 'FLAT'}
          status={data.newApplications > 0 ? 'HEALTHY' : 'WARNING'}
          drillDownHref="/admin/partnership-applications"
          onClick={() => onNavigate?.('/admin/partnership-applications')}
        />
        <KpiCard
          label="Pending Approvals"
          value={data.pendingApprovals.toString()}
          status={data.pendingApprovals === 0 ? 'HEALTHY' : data.pendingApprovals > 5 ? 'CRITICAL' : 'WARNING'}
          drillDownHref="/admin/partnership-applications"
          onClick={() => onNavigate?.('/admin/partnership-applications')}
        />
        <KpiCard
          label="Active Campaigns"
          value={data.activeCampaigns.toString()}
          trend={data.activeCampaigns > 0 ? 'UP' : 'FLAT'}
          status={data.activeCampaigns > 3 ? 'HEALTHY' : data.activeCampaigns > 0 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
        <KpiCard
          label="Active Founder Codes"
          value={data.activeCodes.toString()}
          status={data.activeCodes > 10 ? 'HEALTHY' : data.activeCodes > 0 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/founder-codes"
          onClick={() => onNavigate?.('/admin/founder-codes')}
        />
        <KpiCard
          label="Relationship Health"
          value={data.relationshipHealth}
          status={data.relationshipHealth === 'HEALTHY' ? 'HEALTHY' : data.relationshipHealth === 'WARNING' ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
        <KpiCard
          label="Ecosystem Score"
          value={`${data.partnershipHealthScore}/100`}
          status={healthStatus as any}
          explanation="Composite of active ratio, suspension rate, campaign activity, and partner health"
          drillDownHref="/admin/founder-partners"
          onClick={() => onNavigate?.('/admin/founder-partners')}
        />
      </div>
    </div>
  )
}
