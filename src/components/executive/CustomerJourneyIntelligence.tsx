import { ArrowRight, AlertTriangle, Clock } from 'lucide-react'

export interface CustomerJourneyData {
  lead: number
  trial: number
  activation: number
  onboarding: number
  adoption: number
  healthy: number
  expansion: number
  advocate: number
}

interface Props {
  data: CustomerJourneyData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const stages = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700', link: '/admin/restaurants' },
  { key: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-700', link: '/admin/restaurants' },
  { key: 'activation', label: 'Activation', color: 'bg-cyan-100 text-cyan-700', link: '/admin/restaurants' },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-teal-100 text-teal-700', link: '/admin/restaurants' },
  { key: 'adoption', label: 'Adoption', color: 'bg-emerald-100 text-emerald-700', link: '/admin/restaurants' },
  { key: 'healthy', label: 'Healthy Customer', color: 'bg-green-100 text-green-700', link: '/admin/restaurants' },
  { key: 'expansion', label: 'Expansion', color: 'bg-purple-100 text-purple-700', link: '/admin/restaurants' },
  { key: 'advocate', label: 'Advocate', color: 'bg-indigo-100 text-indigo-700', link: '/admin/restaurants' },
]

export default function CustomerJourneyIntelligence({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 w-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Customer journey intelligence unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const stageData: Record<string, number> = {
    lead: data.lead,
    trial: data.trial,
    activation: data.activation,
    onboarding: data.onboarding,
    adoption: data.adoption,
    healthy: data.healthy,
    expansion: data.expansion,
    advocate: data.advocate,
  }

  const bottleneck = stages.reduce((max, stage) => {
    const count = stageData[stage.key] || 0
    return count > max.count ? { stage: stage.label, count } : max
  }, { stage: '', count: 0 })

  const total = Object.values(stageData).reduce((sum, v) => sum + v, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Customer Journey Intelligence</h3>
        {bottleneck.count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bottleneck: {bottleneck.stage} ({bottleneck.count})</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const count = stageData[stage.key] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={stage.key} className="flex items-center flex-shrink-0">
              <button
                onClick={() => onNavigate?.(stage.link)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`px-3 py-2 rounded-xl ${stage.color} min-w-[90px] text-center transition-all group-hover:shadow-md`}>
                  <p className="text-xs font-medium opacity-75">{stage.label}</p>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs opacity-60">{pct}%</p>
                </div>
              </button>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-300 mx-0.5 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">In Trial</p>
          </div>
          <p className="text-lg font-bold text-slate-900">{data.trial}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Adopted</p>
          <p className="text-lg font-bold text-slate-900">{data.adoption}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Healthy</p>
          <p className="text-lg font-bold text-emerald-600">{data.healthy}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500 mb-1">Expansion Ready</p>
          <p className="text-lg font-bold text-purple-600">{data.expansion}</p>
        </div>
      </div>
    </div>
  )
}
