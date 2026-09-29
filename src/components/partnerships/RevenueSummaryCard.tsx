import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart3, Users, Award, Clock } from 'lucide-react'

interface RevenueSummaryCardProps {
  label: string
  value: string
  icon: 'dollar' | 'trending-up' | 'trending-down' | 'wallet' | 'alert' | 'chart' | 'users' | 'award' | 'clock'
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
}

const iconMap = {
  'dollar': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'wallet': Wallet,
  'alert': AlertCircle,
  'chart': BarChart3,
  'users': Users,
  'award': Award,
  'clock': Clock,
}

const accentConfig = {
  blue: { iconBg: 'bg-blue-100', text: 'text-blue-600' },
  green: { iconBg: 'bg-green-100', text: 'text-green-600' },
  amber: { iconBg: 'bg-amber-100', text: 'text-amber-600' },
  red: { iconBg: 'bg-red-100', text: 'text-red-600' },
  purple: { iconBg: 'bg-purple-100', text: 'text-purple-600' },
  slate: { iconBg: 'bg-slate-100', text: 'text-slate-600' },
}

export default function RevenueSummaryCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  accent = 'blue',
}: RevenueSummaryCardProps) {
  const Icon = iconMap[icon]
  const cfg = accentConfig[accent]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-400'

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
              {TrendIcon && <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />}
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
