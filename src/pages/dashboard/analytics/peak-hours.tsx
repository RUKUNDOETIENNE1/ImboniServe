import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Clock, TrendingUp, Users, Calendar } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type HourData = {
  hour: number
  orders: number
  revenue: number
  avgOrderValue: number
}

type DayData = {
  day: string
  orders: number
  revenue: number
}

export default function PeakHoursPage() {
  const { t } = useTranslation()
  const [hourlyData, setHourlyData] = useState<HourData[]>([])
  const [dailyData, setDailyData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    fetchData()
  }, [period])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/peak-hours?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setHourlyData(data.data.hourly || [])
        setDailyData(data.data.daily || [])
      }
    } catch (error) {
      console.error('Failed to fetch peak hours:', error)
    } finally {
      setLoading(false)
    }
  }

  const peakHour = hourlyData.reduce((max, curr) => curr.orders > max.orders ? curr : max, hourlyData[0] || { hour: 0, orders: 0 })
  const peakDay = dailyData.reduce((max, curr) => curr.orders > max.orders ? curr : max, dailyData[0] || { day: 'Monday', orders: 0 })
  
  const totalOrders = hourlyData.reduce((sum, h) => sum + h.orders, 0)
  const totalRevenue = hourlyData.reduce((sum, h) => sum + h.revenue, 0)

  const maxOrders = Math.max(...hourlyData.map(h => h.orders), 1)

  const stats = [
    { label: t('peak_hours.peak_hour'), value: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`, icon: Clock, color: 'blue' },
    { label: t('peak_hours.peak_day'), value: peakDay.day, icon: Calendar, color: 'green' },
    { label: t('peak_hours.total_orders'), value: totalOrders.toLocaleString(), icon: Users, color: 'purple' },
    { label: t('peak_hours.total_revenue'), value: <CurrencyDisplay amount={totalRevenue} />, icon: TrendingUp, color: 'orange' }
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-imboni-blue" />
              <span suppressHydrationWarning>{t('peak_hours.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('peak_hours.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  period === p
                    ? 'bg-imboni-blue text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span suppressHydrationWarning>{p === '7d' ? t('peak_hours.last_7_days') : p === '30d' ? t('peak_hours.last_30_days') : t('peak_hours.last_90_days')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Hourly Heatmap */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('peak_hours.hourly_order_volume')}</h2>
        <div className="space-y-2">
          {hourlyData.map(hour => (
            <div key={hour.hour} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-slate-700">
                {hour.hour.toString().padStart(2, '0')}:00 - {(hour.hour + 1).toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="bg-gradient-to-r from-imboni-blue to-blue-600 h-8 flex items-center justify-end px-3 transition-all"
                  style={{ width: `${(hour.orders / maxOrders) * 100}%` }}
                >
                  {hour.orders > 0 && (
                    <p className="font-bold text-imboni-blue"><CurrencyDisplay amount={hour.revenue} /></p>
                  )}
                </div>
              </div>
              <div className="w-32 text-sm text-slate-600 text-right">
                <CurrencyDisplay amount={hour.revenue} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('peak_hours.daily_breakdown')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map(day => {
            const dayData = dailyData.find(d => d.day === day) || { day, orders: 0, revenue: 0 }
            const isPeak = dayData.day === peakDay.day
            return (
              <div
                key={day}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isPeak
                    ? 'border-imboni-blue bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <h3 className={`font-semibold mb-2 ${isPeak ? 'text-imboni-blue' : 'text-slate-800'}`}>
                  {day.slice(0, 3)}
                </h3>
                <p className="text-2xl font-bold text-slate-800 mb-1">{dayData.orders}</p>
                <p className="text-xs text-slate-500">{t('peak_hours.orders')}</p>
                <p className="text-sm font-semibold text-imboni-blue mt-2">
                  RWF {(dayData.revenue / 100).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <h2 className="text-xl font-bold text-blue-900 mb-4">{t('peak_hours.staffing_recommendations')}</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li suppressHydrationWarning>• {t('peak_hours.recommendation_schedule_more').replace('{hour}', peakHour.hour.toString()).replace('{nextHour}', (peakHour.hour + 1).toString())}</li>
          <li suppressHydrationWarning>• {t('peak_hours.recommendation_busiest_day').replace('{day}', peakDay.day)}</li>
          <li suppressHydrationWarning>• {t('peak_hours.recommendation_happy_hour')}</li>
          <li suppressHydrationWarning>• {t('peak_hours.recommendation_prep')}</li>
        </ul>
      </Card>
    </DashboardLayout>
  )
}
