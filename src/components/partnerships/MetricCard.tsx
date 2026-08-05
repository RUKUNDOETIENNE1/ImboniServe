import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
}

const accentConfig = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', iconBg: 'bg-slate-100' },
}

export default function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  accent = 'blue',
}: MetricCardProps) {
  const cfg = accentConfig[accent]

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
          <Icon className={`w-5 h-5 ${cfg.text}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
