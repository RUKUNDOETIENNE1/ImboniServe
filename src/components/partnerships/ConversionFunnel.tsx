import { Video, FileText, ClipboardCheck, CheckCircle, Play, CreditCard, Repeat, ChevronDown } from 'lucide-react'

interface FunnelStage {
  key: string
  label: string
  count: number
  dropOff?: number
}

interface ConversionFunnelProps {
  stages: FunnelStage[]
}

const stageIcons: Record<string, any> = {
  video: Video,
  page: FileText,
  form: ClipboardCheck,
  check: CheckCircle,
  play: Play,
  credit: CreditCard,
  repeat: Repeat,
}

export default function ConversionFunnel({ stages }: ConversionFunnelProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Growth Funnel</h3>
        <p className="text-sm text-slate-400">No funnel data available yet.</p>
      </div>
    )
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Growth Funnel</h3>

      <div className="space-y-1" role="list" aria-label="Conversion funnel stages">
        {stages.map((stage, idx) => {
          const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
          const Icon = stageIcons[stage.key] ?? CheckCircle
          const dropOff = stage.dropOff ?? 0

          return (
            <div key={stage.key} role="listitem">
              <div className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                    <span className="text-sm font-bold text-slate-800" aria-label={`${stage.count} at ${stage.label}`}>
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500 bg-gradient-to-r from-blue-400 to-blue-500"
                      style={{ width: `${Math.max(width, 2)}%` }}
                      role="img"
                      aria-label={`${Math.round(width)}% of max`}
                    />
                  </div>
                </div>
              </div>
              {idx < stages.length - 1 && dropOff > 0 && (
                <div className="flex items-center gap-2 pl-10 py-0.5 text-xs text-slate-400" aria-label={`${dropOff}% drop-off`}>
                  <ChevronDown className="w-3 h-3" />
                  <span className="text-red-400 font-medium">{dropOff}% drop-off</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overall conversion */}
      {stages.length >= 2 && stages[0].count > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Overall Conversion</span>
            <span className="font-bold text-slate-800">
              {((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
