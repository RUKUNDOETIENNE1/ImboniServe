import { ArrowRight, QrCode, Link2, Mail, BarChart3 } from 'lucide-react'
import KpiCard from './KpiCard'

export interface BrandEngagementData {
  qrAdoption: {
    totalCodes: number
    totalScans: number
    scans30d: number
    avgScansPerCode: number
  }
  referralActivity: {
    totalLinks: number
    clicks30d: number
    signups: number
  }
  businessInvites: {
    total: number
    signedUp: number
    conversionRate: string
  }
  platformUsage: {
    activeBusinesses: number
    activeSubscriptions: number
    trialSubscriptions: number
    totalUsers: number
  }
  attributionBreakdown: Array<{ source: string; count: number; percentage: string }>
}

interface Props {
  data: BrandEngagementData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function BrandEngagementOverview({ data, loading, onNavigate }: Props) {
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
        <h3 className="text-base font-bold text-slate-900 mb-2">Brand & Engagement Overview</h3>
        <p className="text-sm text-slate-400">No brand engagement data available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Brand & Engagement Overview</h3>

      {/* QR Adoption */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <QrCode className="w-3 h-3" /> QR Adoption
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="QR Codes" value={data.qrAdoption.totalCodes.toString()} drillDownHref="/admin/restaurants" onClick={() => onNavigate?.('/admin/restaurants')} />
          <KpiCard label="Total Scans" value={data.qrAdoption.totalScans.toLocaleString()} drillDownHref="/admin/restaurants" onClick={() => onNavigate?.('/admin/restaurants')} />
          <KpiCard label="Scans (30d)" value={data.qrAdoption.scans30d.toLocaleString()} trend={data.qrAdoption.scans30d > 0 ? 'UP' : 'FLAT'} drillDownHref="/admin/restaurants" onClick={() => onNavigate?.('/admin/restaurants')} />
          <KpiCard label="Avg Scans/Code" value={data.qrAdoption.avgScansPerCode.toString()} drillDownHref="/admin/restaurants" onClick={() => onNavigate?.('/admin/restaurants')} />
        </div>
      </div>

      {/* Referral & Invites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Referral Activity
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Links</span>
              <span className="font-medium text-slate-900">{data.referralActivity.totalLinks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Clicks (30d)</span>
              <span className="font-medium text-slate-900">{data.referralActivity.clicks30d}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Signups</span>
              <span className="font-medium text-slate-900">{data.referralActivity.signups}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Business Invites
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Invites</span>
              <span className="font-medium text-slate-900">{data.businessInvites.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Signed Up</span>
              <span className="font-medium text-slate-900">{data.businessInvites.signedUp}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Conversion Rate</span>
              <span className="font-medium text-blue-600">{data.businessInvites.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Usage */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <BarChart3 className="w-3 h-3" /> Platform Usage
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Active Businesses</p>
            <p className="text-lg font-bold text-slate-900">{data.platformUsage.activeBusinesses}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Active Subscriptions</p>
            <p className="text-lg font-bold text-slate-900">{data.platformUsage.activeSubscriptions}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Trials</p>
            <p className="text-lg font-bold text-amber-600">{data.platformUsage.trialSubscriptions}</p>
          </div>
        </div>
      </div>

      {/* Attribution Breakdown */}
      {data.attributionBreakdown.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Acquisition Source Breakdown</p>
          <ul className="space-y-1.5">
            {data.attributionBreakdown.map((a, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{a.source.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="font-medium text-slate-900">{a.count} ({a.percentage}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
