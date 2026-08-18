import { Trophy, ArrowRight, TrendingUp } from 'lucide-react'

export interface PartnerPerformanceData {
  topPartnersBySignups: Array<{
    id: string
    name: string
    partnerType: string
    status: string
    region: string | null
    totalSignups: number
    totalConversions: number
    totalRevenueCents: number
  }>
  topPartnersByConversions: Array<{
    id: string
    name: string
    partnerType: string
    status: string
    region: string | null
    totalSignups: number
    totalConversions: number
    totalRevenueCents: number
  }>
  topPartnersByRevenue: Array<{
    id: string
    name: string
    partnerType: string
    status: string
    region: string | null
    totalSignups: number
    totalConversions: number
    totalRevenueCents: number
  }>
  partnershipTypeLTV: Array<{
    partnerType: string
    partnerCount: number
    totalRevenueCents: number
    totalCommissionCents: number
    totalPayoutsCents: number
    avgRevenuePerPartner: number
  }>
  cacByPartnerType: Array<{
    partnerType: string
    partnerCount: number
    totalPayoutsCents: number
    totalSignups: number
    totalConversions: number
    cacPerSignup: number
    cacPerConversion: number
  }>
}

interface Props {
  data: PartnerPerformanceData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function PartnerPerformance({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Partner performance unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Partner Performance</h3>
      </div>

      {/* Top Partners by Signups */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Top Partners by Hospitality Business Acquisition</p>
        </div>
        <div className="space-y-2">
          {data.topPartnersBySignups.length > 0 ? data.topPartnersBySignups.slice(0, 5).map((p, i) => (
            <button
              key={p.id}
              onClick={() => onNavigate?.('/admin/founder-partners')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.partnerType} · {p.region || 'No region'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Signups</p>
                  <p className="text-sm font-bold text-slate-900">{p.totalSignups}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Conv.</p>
                  <p className="text-sm font-medium text-slate-700">{p.totalConversions}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Revenue</p>
                  <p className="text-sm font-medium text-emerald-600">{Math.round(p.totalRevenueCents / 100).toLocaleString()}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </button>
          )) : (
            <p className="text-sm text-slate-400">No partner performance data available.</p>
          )}
        </div>
      </div>

      {/* LTV by Partner Type */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Lifetime Value by Partner Type</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">Type</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Partners</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Total Revenue</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Avg/Partner</th>
                <th className="text-right py-2 pl-2 text-xs font-medium text-slate-500">Commissions</th>
              </tr>
            </thead>
            <tbody>
              {data.partnershipTypeLTV.length > 0 ? data.partnershipTypeLTV.map((p) => (
                <tr key={p.partnerType} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onNavigate?.('/admin/founder-partners')}
                >
                  <td className="py-2 pr-4 font-medium text-slate-900">{p.partnerType}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{p.partnerCount}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{Math.round(p.totalRevenueCents / 100).toLocaleString()} RWF</td>
                  <td className="py-2 px-2 text-right text-slate-700">{Math.round(p.avgRevenuePerPartner / 100).toLocaleString()} RWF</td>
                  <td className="py-2 pl-2 text-right text-slate-700">{Math.round(p.totalCommissionCents / 100).toLocaleString()} RWF</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">No LTV data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CAC by Partner Type */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Customer Acquisition Cost by Partner Type</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.cacByPartnerType.length > 0 ? data.cacByPartnerType.map((c) => (
            <button
              key={c.partnerType}
              onClick={() => onNavigate?.('/admin/founder-partners')}
              className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
            >
              <p className="text-xs text-slate-500 mb-1">{c.partnerType}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold text-slate-900">{Math.round(c.cacPerConversion / 100).toLocaleString()}</p>
                <p className="text-xs text-slate-400">RWF/conv</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">{c.totalConversions} conversions · {c.totalSignups} signups</p>
            </button>
          )) : (
            <p className="text-sm text-slate-400 col-span-3">No CAC data available</p>
          )}
        </div>
      </div>
    </div>
  )
}
