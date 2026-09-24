import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react'

export interface ChecklistItem {
  key: string
  label: string
  completed: boolean
}

interface ActivationChecklistProps {
  items: ChecklistItem[]
  completedCount: number
  totalCount: number
  percentage: number
  loading?: boolean
}

export default function ActivationChecklist({
  items,
  completedCount,
  totalCount,
  percentage,
  loading,
}: ActivationChecklistProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-6" aria-label="Loading activation checklist">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading checklist...</span>
        </div>
      </div>
    )
  }

  const remaining = items.filter((i) => !i.completed && i.key !== 'readyToLaunch')
  const isReady = remaining.length === 0

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Activation Checklist</h3>
        <span className="text-xs font-medium text-slate-500" aria-label={`Progress: ${percentage} percent`}>
          {completedCount} / {totalCount} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div
          className="h-2.5 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Activation progress"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isReady ? 'bg-green-500' : percentage > 50 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {isReady ? 'Ready to launch!' : `${remaining.length} item${remaining.length > 1 ? 's' : ''} remaining`}
        </p>
      </div>

      {/* Checklist items */}
      <ol className="space-y-2.5">
        {items.map((item, idx) => {
          const isReadyItem = item.key === 'readyToLaunch'
          const showAsReady = isReadyItem && isReady

          return (
            <li key={item.key} className="flex items-center gap-3">
              {showAsReady ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
              ) : item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
              ) : isReadyItem ? (
                <AlertCircle className="w-5 h-5 text-slate-300 flex-shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" aria-hidden="true" />
              )}
              <span
                className={`text-sm ${
                  showAsReady || item.completed
                    ? 'text-slate-700 font-medium'
                    : isReadyItem
                      ? 'text-slate-400'
                      : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
              {item.completed && (
                <span className="ml-auto text-xs text-green-600 font-medium">Done</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
