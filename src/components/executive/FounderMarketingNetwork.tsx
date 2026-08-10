import { ArrowRight, Award, MapPin } from 'lucide-react'
import KpiCard from './KpiCard'

export interface FounderMarketingData {
  topBySignups: Array<{
    id: string
    name: string
    partnerType: string
    status: string
    region: string
    signups: number
    conversions: number
    conversionRate: string
    revenueRWF: number
  }>
  topByConversions: Array<{ id: string; name: string; conversions: number; region: string }>
  topByRevenue: Array<{ id: string; name: string; revenueRWF: number; region: string }>
  healthScores: Array<{
    partnerName: string
    score: number
    grade: string
    signups: number
    conversions: number
    region: string
  }>
  codeStats: {
    total: number
    active: number
    expired: number
    redemptions: number
    redemptions30d: number
  }
}

interface Props {
  data: FounderMarketingData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function FounderMarketingNetwork({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Founder marketing network data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Founder Marketing Network</h3>

      {/* Code Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Total Codes" value={data.codeStats.total.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Active Codes" value={data.codeStats.active.toString()} status={data.codeStats.active > 0 ? 'HEALTHY' : 'WARNING'} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Redemptions" value={data.codeStats.redemptions.toString()} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
        <KpiCard label="Redemptions (30d)" value={data.codeStats.redemptions30d.toString()} trend={data.codeStats.redemptions30d > 0 ? 'UP' : 'FLAT'} drillDownHref="/admin/founder-partners" onClick={() => onNavigate?.('/admin/founder-partners')} />
      </div>

      {/* Top by Signups */}
      {data.topBySignups.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Top Founder Partners by Signups</p>
          <div className="space-y-2">
            {data.topBySignups.slice(0, 5).map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => onNavigate?.('/admin/founder-partners')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('/admin/founder-partners') }}
              >
                <div className="flex items-center gap-3">
                  {i < 3 && <Award className={`w-4 h-4 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : 'text-amber-600'}`} />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.region} - {p.partnerType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{p.signups}</p>
                    <p className="text-slate-400">signups</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{p.conversions}</p>
                    <p className="text-slate-400">conv.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{p.conversionRate}%</p>
                    <p className="text-slate-400">rate</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Scores */}
      {data.healthScores.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Partner Health Scores</p>
          <ul className="space-y-1.5">
            {data.healthScores.slice(0, 5).map((h, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{h.partnerName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{h.score}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${h.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : h.grade === 'B' ? 'bg-blue-100 text-blue-700' : h.grade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {h.grade}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
