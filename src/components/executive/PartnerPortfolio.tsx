import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface PartnerPortfolioData {
  partnersByType: Array<{ partnerType: string; count: number; totalSignups: number; totalConversions: number; totalRevenueCents: number }>
  partnersByRegion: Array<{ region: string; count: number; totalSignups: number; totalConversions: number }>
  partnersByStatus: Array<{ status: string; count: number }>
  healthScores: Array<{
    partnershipId: string
    partnership: { id: string; name: string; status: string; partnerType: string; region: string | null }
    score: number
    grade: string
    trendDirection: string | null
  }>
}

interface Props {
  data: PartnerPortfolioData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const gradeColor: Record<string, string> = {
  A: 'text-emerald-600 bg-emerald-50',
  B: 'text-teal-600 bg-teal-50',
  C: 'text-amber-600 bg-amber-50',
  D: 'text-orange-600 bg-orange-50',
  F: 'text-red-600 bg-red-50',
}

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  PROSPECT: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  ONBOARDED: 'bg-teal-100 text-teal-700',
  TERMINATED: 'bg-red-100 text-red-700',
}

export default function PartnerPortfolio({ data, loading, onNavigate }: Props) {
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
        <p className="text-sm text-slate-400">Partner portfolio unavailable. Data may still be loading.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Partner Portfolio</h3>

      {/* By Type */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">By Partner Type</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500">Type</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Partners</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Signups</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-slate-500">Conversions</th>
                <th className="text-right py-2 pl-2 text-xs font-medium text-slate-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.partnersByType.length > 0 ? data.partnersByType.map((p) => (
                <tr key={p.partnerType} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onNavigate?.('/admin/founder-partners')}
                >
                  <td className="py-2 pr-4 font-medium text-slate-900">{p.partnerType}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{p.count}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{p.totalSignups}</td>
                  <td className="py-2 px-2 text-right text-slate-700">{p.totalConversions}</td>
                  <td className="py-2 pl-2 text-right text-slate-700">{Math.round(p.totalRevenueCents / 100).toLocaleString()} RWF</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-4 text-center text-slate-400">No partner type data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Region */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">By Region</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.partnersByRegion.length > 0 ? data.partnersByRegion.slice(0, 8).map((r) => (
            <button
              key={r.region}
              onClick={() => onNavigate?.('/admin/founder-partners')}
              className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
            >
              <p className="text-xs text-slate-500">{r.region}</p>
              <p className="text-lg font-bold text-slate-900">{r.count}</p>
              <p className="text-xs text-slate-400">{r.totalSignups} signups, {r.totalConversions} conversions</p>
            </button>
          )) : (
            <p className="text-sm text-slate-400 col-span-4">No regional data available</p>
          )}
        </div>
      </div>

      {/* Health Scores */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Partner Health</p>
        <div className="space-y-2">
          {data.healthScores.length > 0 ? data.healthScores.slice(0, 8).map((h) => (
            <button
              key={h.partnershipId}
              onClick={() => onNavigate?.('/admin/founder-partners')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${gradeColor[h.grade] || 'bg-slate-100 text-slate-600'}`}>
                  {h.grade}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{h.partnership.name}</p>
                  <p className="text-xs text-slate-400">{h.partnership.partnerType} · {h.partnership.region || 'No region'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{h.score}/100</span>
                {h.trendDirection === 'UP' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {h.trendDirection === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {(!h.trendDirection || h.trendDirection === 'FLAT') && <Minus className="w-4 h-4 text-slate-400" />}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[h.partnership.status] || 'bg-slate-100 text-slate-700'}`}>
                  {h.partnership.status}
                </span>
              </div>
            </button>
          )) : (
            <p className="text-sm text-slate-400">No health scores available</p>
          )}
        </div>
      </div>
    </div>
  )
}
