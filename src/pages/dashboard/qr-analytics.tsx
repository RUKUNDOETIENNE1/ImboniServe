import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import DashboardLayout from '@/components/DashboardLayout'
import { QrCode, TrendingUp, Eye, ShoppingCart, DollarSign, MapPin, Clock, Smartphone } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface QRAnalytics {
  totalScans: number
  uniqueVisitors: number
  conversionRate: number
  totalRevenue: number
  avgOrderValue: number
  topPerformingQRs: Array<{
    qrId: string
    tableNumber: string
    scans: number
    orders: number
    revenue: number
    conversionRate: number
  }>
  scansByHour: Array<{ hour: number; scans: number }>
  scansByDevice: Array<{ device: string; count: number }>
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function QRAnalyticsPage() {
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/qr?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch QR analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{t('qr_analytics.title')}</h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('qr_analytics.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-imboni-blue text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-imboni-blue'
                }`}
              >
                <span suppressHydrationWarning>{t(`qr_analytics.${p}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Eye}
          label={t('qr_analytics.total_scans')}
          value={analytics?.totalScans?.toLocaleString() || '0'}
          color="blue"
        />
        <MetricCard
          icon={ShoppingCart}
          label={t('qr_analytics.conversion_rate')}
          value={`${analytics?.conversionRate?.toFixed(1) || '0'}%`}
          color="green"
        />
        <MetricCard
          icon={DollarSign}
          label={t('qr_analytics.total_revenue')}
          value={`${analytics?.totalRevenue?.toLocaleString() || '0'} RWF`}
          color="amber"
        />
        <MetricCard
          icon={TrendingUp}
          label={t('qr_analytics.avg_order_value')}
          value={`${analytics?.avgOrderValue?.toLocaleString() || '0'} RWF`}
          color="purple"
        />
      </div>

      {/* Top Performing QR Codes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4" suppressHydrationWarning>{t('qr_analytics.top_performing_qrs')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600" suppressHydrationWarning>{t('qr_analytics.table')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600" suppressHydrationWarning>{t('qr_analytics.scans')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600" suppressHydrationWarning>{t('qr_analytics.orders')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600" suppressHydrationWarning>{t('qr_analytics.conversion')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600" suppressHydrationWarning>{t('qr_analytics.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topPerformingQRs?.map((qr, i) => (
                <tr key={qr.qrId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-imboni-blue to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {qr.tableNumber}
                      </div>
                      <span className="font-medium text-slate-700" suppressHydrationWarning>{t('qr_analytics.table')} {qr.tableNumber}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-slate-700">{qr.scans.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 text-slate-700">{qr.orders.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      qr.conversionRate >= 20 ? 'bg-green-100 text-green-700' :
                      qr.conversionRate >= 10 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {qr.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-slate-800">
                    {qr.revenue.toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scans by Hour & Device */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span suppressHydrationWarning>{t('qr_analytics.peak_scanning_hours')}</span>
          </h2>
          <div className="space-y-2">
            {analytics?.scansByHour?.map(({ hour, scans }) => (
              <div key={hour} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-16">{hour}:00</span>
                <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-imboni-blue to-blue-600 h-full flex items-center justify-end pr-2"
                    style={{ width: `${(scans / Math.max(...(analytics?.scansByHour?.map(h => h.scans) || [1]))) * 100}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{scans}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-slate-600" />
            <span suppressHydrationWarning>{t('qr_analytics.scans_by_device')}</span>
          </h2>
          <div className="space-y-3">
            {analytics?.scansByDevice?.map(({ device, count }) => (
              <div key={device} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-medium text-slate-700">{device}</span>
                <span className="text-2xl font-bold text-slate-800">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

interface MetricCardProps {
  icon: any
  label: string
  value: string
  color: 'blue' | 'green' | 'amber' | 'purple'
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}
