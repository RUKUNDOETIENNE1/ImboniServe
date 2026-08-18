import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL'
export type TrendDirection = 'UP' | 'DOWN' | 'FLAT'

interface KpiCardProps {
  label: string
  value: string
  subValue?: string
  trend?: TrendDirection
  trendValue?: string
  status?: HealthStatus
  drillDownHref?: string
  explanation?: string
  onClick?: () => void
}

const statusConfig = {
  HEALTHY: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  WARNING: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  CRITICAL: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

const trendConfig = {
  UP: { icon: TrendingUp, color: 'text-emerald-600' },
  DOWN: { icon: TrendingDown, color: 'text-red-600' },
  FLAT: { icon: Minus, color: 'text-slate-500' },
}

export default function KpiCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  status,
  drillDownHref,
  explanation,
  onClick,
}: KpiCardProps) {
  const StatusIcon = status ? statusConfig[status].icon : null
  const TrendIcon = trend ? trendConfig[trend].icon : null
  const isClickable = Boolean(drillDownHref || onClick)

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={onClick}
      className={`text-left w-full rounded-2xl border bg-white p-5 transition-all ${
        isClickable
          ? 'hover:shadow-md hover:border-slate-300 cursor-pointer'
          : 'cursor-default'
      } ${status ? statusConfig[status].border : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {StatusIcon && (
          <StatusIcon className={`w-4 h-4 ${statusConfig[status!].color}`} />
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subValue && (
        <p className="text-xs text-slate-400 mt-1">{subValue}</p>
      )}
      {(trend || trendValue) && (
        <div className="flex items-center gap-1.5 mt-2">
          {TrendIcon && <TrendIcon className={`w-3.5 h-3.5 ${trendConfig[trend!].color}`} />}
          {trendValue && (
            <span className={`text-xs font-medium ${trend ? trendConfig[trend].color : 'text-slate-500'}`}>
              {trendValue}
            </span>
          )}
        </div>
      )}
      {explanation && (
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{explanation}</p>
      )}
    </button>
  )
}
