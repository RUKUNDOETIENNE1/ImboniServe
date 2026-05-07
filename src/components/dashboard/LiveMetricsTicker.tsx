import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Users, DollarSign, Activity } from 'lucide-react'
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics'
import { useTranslation } from '@/lib/i18n'

interface LiveMetric {
  label: string
  value: string | number
  change?: number
  icon: any
  color: string
  pulse?: boolean
}

export function LiveMetricsTicker() {
  const { metrics, isLive } = useRealtimeMetrics()
  const [animateRevenue, setAnimateRevenue] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (metrics.todayRevenue) {
      setAnimateRevenue(true)
      const timer = setTimeout(() => setAnimateRevenue(false), 600)
      return () => clearTimeout(timer)
    }
  }, [metrics.todayRevenue])

  const liveMetrics: LiveMetric[] = [
    {
      label: t('dashboard.liveTicker.live_revenue', 'Live Revenue'),
      value: `${metrics.todayRevenue?.toLocaleString() || 0} RWF`,
      change: metrics.revenueChange,
      icon: DollarSign,
      color: 'text-green-600',
      pulse: animateRevenue
    },
    {
      label: t('dashboard.liveTicker.active_orders', 'Active Orders'),
      value: metrics.activeOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
      pulse: metrics.activeOrders > 0
    },
    {
      label: t('dashboard.liveTicker.customers_today', 'Customers Today'),
      value: metrics.customersToday || 0,
      change: metrics.customerChange,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: t('dashboard.liveTicker.avg_order_value', 'Avg Order Value'),
      value: `${metrics.avgOrderValue?.toLocaleString() || 0} RWF`,
      icon: TrendingUp,
      color: 'text-amber-600'
    }
  ]

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 mb-6 border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            {isLive ? t('dashboard.liveTicker.live_metrics', 'Live Metrics') : t('dashboard.liveTicker.connecting', 'Connecting...')}
          </span>
        </div>
        <Activity className="w-4 h-4 text-slate-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {liveMetrics.map((metric, i) => (
          <div
            key={i}
            className={`bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-all ${
              metric.pulse ? 'animate-pulse-once' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg bg-slate-700/50 ${metric.color}`}>
                <metric.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-slate-400">{metric.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <p className={`text-lg font-bold text-white ${metric.pulse ? 'text-green-400' : ''}`}>
                {metric.value}
              </p>
              {metric.change !== undefined && (
                <span className={`text-xs font-semibold ${metric.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
