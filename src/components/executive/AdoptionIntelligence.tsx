import { Zap, Building2, Users, Activity, ArrowRight } from 'lucide-react'

export interface AdoptionIntelligenceData {
  adoptionRate: number
  businessesWithRecentSales: number
  totalBusinesses: number
  qrEnabledBusinesses: number
  remoteOrderEnabledBusinesses: number
  activeBranches: number
  totalBranches: number
  activeUsers7d: number
  activeUsers30d: number
  totalUsers: number
  totalSales7d: number
  totalSales30d: number
  underutilizedFeatures: { label: string; count: number; link: string }[]
}

interface Props {
  data: AdoptionIntelligenceData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function AdoptionIntelligence({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Adoption intelligence unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const userActiveRate7d = data.totalUsers > 0 ? Math.round((data.activeUsers7d / data.totalUsers) * 100) : 0
  const branchActiveRate = data.totalBranches > 0 ? Math.round((data.activeBranches / data.totalBranches) * 100) : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-600" />
        <h3 className="text-base font-bold text-slate-900">Adoption Intelligence</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Adoption Rate</p>
          <p className="text-xl font-bold text-slate-900">{data.adoptionRate}%</p>
          <p className="text-xs text-slate-400">{data.businessesWithRecentSales}/{data.totalBusinesses} active</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Active Branches</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.activeBranches}</p>
          <p className="text-xs text-slate-400">{branchActiveRate}% of {data.totalBranches}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/users')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Active Users (7d)</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.activeUsers7d}</p>
          <p className="text-xs text-slate-400">{userActiveRate7d}% of {data.totalUsers}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/restaurants')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Sales (7d)</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.totalSales7d}</p>
          <p className="text-xs text-slate-400">{data.totalSales30d} in 30d</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Feature Adoption</p>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate?.('/admin/restaurants')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium text-slate-900">QR In-Venue Ordering</span>
              <span className="text-sm font-bold text-emerald-600">{data.qrEnabledBusinesses}</span>
            </button>
            <button
              onClick={() => onNavigate?.('/admin/restaurants')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <span className="text-sm font-medium text-slate-900">Remote Ordering</span>
              <span className="text-sm font-bold text-blue-600">{data.remoteOrderEnabledBusinesses}</span>
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Usage Activity</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Active Users (30d)</span>
              <span className="text-sm font-medium text-slate-900">{data.activeUsers30d}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Active Users (7d)</span>
              <span className="text-sm font-medium text-slate-900">{data.activeUsers7d}</span>
            </div>
          </div>
        </div>
      </div>

      {data.underutilizedFeatures.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Underutilized Features</p>
          <div className="space-y-2">
            {data.underutilizedFeatures.map((feat, i) => (
              <button
                key={i}
                onClick={() => onNavigate?.(feat.link)}
                className="flex items-center justify-between w-full rounded-xl border border-amber-200 bg-amber-50 p-3 hover:shadow-md transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{feat.label}</p>
                  <p className="text-xs text-slate-500">{feat.count} businesses not using this feature</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
