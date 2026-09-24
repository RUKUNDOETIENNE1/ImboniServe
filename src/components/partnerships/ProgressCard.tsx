import { Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ProgressCardProps {
  percentage: number
  completedCount: number
  totalCount: number
  remainingItems: string[]
}

export default function ProgressCard({
  percentage,
  completedCount,
  totalCount,
  remainingItems,
}: ProgressCardProps) {
  const isReady = remainingItems.length === 0
  const isNearComplete = remainingItems.length <= 2 && !isReady

  return (
    <div
      className={`rounded-xl border p-5 ${
        isReady
          ? 'bg-green-50 border-green-200'
          : isNearComplete
            ? 'bg-blue-50 border-blue-200'
            : 'bg-amber-50 border-amber-200'
      }`}
      role="status"
      aria-label={`Operational readiness: ${percentage} percent`}
    >
      <div className="flex items-center gap-3 mb-3">
        {isReady ? (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        ) : isNearComplete ? (
          <Rocket className="w-6 h-6 text-blue-600" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-800">Operational Readiness</h3>
          <p className="text-xs text-slate-600">
            {isReady ? 'Partner is ready to launch!' : `${remainingItems.length} items outstanding`}
          </p>
        </div>
      </div>

      {/* Big percentage */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={`text-4xl font-bold ${
            isReady ? 'text-green-600' : isNearComplete ? 'text-blue-600' : 'text-amber-600'
          }`}
        >
          {percentage}%
        </span>
        <span className="text-sm text-slate-500">
          ({completedCount} of {totalCount - 1} steps)
        </span>
      </div>

      {/* Remaining items */}
      {!isReady && remainingItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <p className="text-xs font-medium text-slate-600 mb-2">Outstanding:</p>
          <ul className="space-y-1">
          {remainingItems.slice(0, 5).map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {item}
            </li>
          ))}
          {remainingItems.length > 5 && (
            <li className="text-xs text-slate-400 pl-3.5">
              +{remainingItems.length - 5} more
            </li>
          )}
          </ul>
        </div>
      )}
    </div>
  )
}
