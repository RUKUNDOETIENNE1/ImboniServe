import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  PieChart,
  BarChart3,
  Download
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  const roles = ((session.user as any).roles || []) as string[]
  const allowed = roles.some(r => ['OWNER','MANAGER','ADMIN'].includes(r))
  if (!allowed) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: { businessId: (session.user as any).businessId || '' } }
}

interface PaymentStats {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  methodBreakdown: Array<{
    method: string
    count: number
    revenue: number
    percentage: number
  }>
  successRates: Array<{
    method: string
    total: number
    successful: number
    failed: number
    rate: number
  }>
  feeSavings: {
    wouldHavePaid: number
    actuallyPaid: number
    saved: number
    savingsRate: number
  }
  confirmationTimes: Array<{
    method: string
    avgSeconds: number
    minSeconds: number
    maxSeconds: number
  }>
  dailyTrends: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export default function PaymentAnalyticsDashboard({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [dateRange, setDateRange] = useState('7') // days
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [dateRange, businessId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/payments?days=${dateRange}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load analytics')
      }
      
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!stats) return
    
    const csv = generateCSV(stats)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-analytics-${dateRange}days.csv`
    a.click()
  }

  const generateCSV = (data: PaymentStats) => {
    let csv = 'Payment Analytics Report\n\n'
    
    csv += 'Method,Orders,Revenue,Success Rate\n'
    data.methodBreakdown.forEach(m => {
      const successRate = data.successRates.find(s => s.method === m.method)?.rate || 0
      csv += `${m.method},${m.count},${m.revenue},${successRate}%\n`
    })
    
    return csv
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">{error || t('dashboard.analytics.no_data_desc', 'No data available for this period')}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('payment_analytics.title', 'Payment Analytics')}</h1>
            <p className="text-sm text-slate-600">{t('payment_analytics.subtitle', 'Track payment performance and savings')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue"
            >
              <option value="7">{t('payment_analytics.last_7_days', 'Last 7 days')}</option>
              <option value="30">{t('payment_analytics.last_30_days', 'Last 30 days')}</option>
              <option value="90">{t('payment_analytics.last_90_days', 'Last 90 days')}</option>
            </select>
            
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('payment_analytics.export_csv', 'Export CSV')}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('payment_analytics.total_orders', 'Total Orders')}
            value={stats.totalOrders.toLocaleString()}
            icon={CreditCard}
            color="blue"
          />
          
          <StatCard
            title={t('payment_analytics.total_revenue', 'Total Revenue')}
            value={`${(stats.totalRevenue / 100).toLocaleString()} RWF`}
            icon={DollarSign}
            color="green"
          />
          
          <StatCard
            title={t('payment_analytics.avg_order_value', 'Avg Order Value')}
            value={`${(stats.avgOrderValue / 100).toLocaleString()} RWF`}
            icon={TrendingUp}
            color="purple"
          />
          
          <StatCard
            title={t('payment_analytics.fee_savings', 'Fee Savings')}
            value={`${(stats.feeSavings.saved / 100).toLocaleString()} RWF`}
            subtitle={`${stats.feeSavings.savingsRate.toFixed(1)}% saved`}
            icon={TrendingDown}
            color="amber"
          />
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {t('payment_analytics.payment_method_breakdown', 'Payment Method Breakdown')}
            </h2>
          </div>
          
          <div className="space-y-4">
            {stats.methodBreakdown.map((method) => {
              const successRate = stats.successRates.find(s => s.method === method.method)
              
              return (
                <div key={method.method} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(method.method)}
                      <div>
                        <h3 className="font-semibold text-slate-900">{getPaymentLabel(method.method)}</h3>
                        <p className="text-xs text-slate-600">
                          {method.count} orders • {method.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{(method.revenue / 100).toLocaleString()} RWF</p>
                      {successRate && (
                        <p className={`text-xs font-medium ${
                          successRate.rate >= 95 ? 'text-green-600' : 
                          successRate.rate >= 80 ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {successRate.rate.toFixed(1)}% success rate
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMethodColor(method.method)}`}
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Success Rates & Confirmation Times */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rates */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {t('payment_analytics.success_rates', 'Success Rates')}
            </h2>
            
            <div className="space-y-4">
              {stats.successRates.map((rate) => (
                <div key={rate.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{getPaymentLabel(rate.method)}</span>
                    <span className="font-bold text-slate-900">{rate.rate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {rate.successful} {t('payment_analytics.successful', 'successful')}
                    </span>
                    {rate.failed > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        {rate.failed} {t('payment_analytics.failed', 'failed')}
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        rate.rate >= 95 ? 'bg-green-500' : 
                        rate.rate >= 80 ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${rate.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation Times */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('payment_analytics.confirmation_times', 'Average Confirmation Time')}
            </h2>
            
            <div className="space-y-4">
              {stats.confirmationTimes.map((time) => (
                <div key={time.method} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{getPaymentLabel(time.method)}</span>
                    <span className="font-bold text-slate-900">{formatSeconds(time.avgSeconds)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Min: {formatSeconds(time.minSeconds)}</span>
                    <span>Max: {formatSeconds(time.maxSeconds)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Savings Breakdown */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            {t('payment_analytics.fee_savings_breakdown', 'Fee Savings Analysis')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-sm text-slate-600" suppressHydrationWarning>{t('payment_analytics.would_have_paid', 'Would Have Paid (IremboPay Only)')}</p>
              <p className="text-2xl font-bold text-red-600">
                {(stats.feeSavings.wouldHavePaid / 100).toLocaleString()} RWF
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-sm text-slate-600" suppressHydrationWarning>{t('payment_analytics.actually_paid', 'Actually Paid (Mixed Methods)')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {(stats.feeSavings.actuallyPaid / 100).toLocaleString()} RWF
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <p className="text-sm text-slate-600" suppressHydrationWarning>{t('payment_analytics.total_saved', 'Total Saved')}</p>
              <p className="text-2xl font-bold text-green-600">
                {(stats.feeSavings.saved / 100).toLocaleString()} RWF
              </p>
              <p className="text-xs text-green-700 font-medium mt-1">
                {stats.feeSavings.savingsRate.toFixed(1)}% reduction in fees
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-green-200">
            <p className="text-sm text-slate-700 mb-2">
              💡 <strong>Projected Annual Savings:</strong>
            </p>
            <p className="text-3xl font-bold text-green-600">
              {((stats.feeSavings.saved / parseInt(dateRange)) * 365 / 100).toLocaleString()} RWF/year
            </p>
          </div>
        </div>

        {/* Daily Trends */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('payment_analytics.daily_trends', 'Daily Trends')}
          </h2>
          
          <div className="space-y-3">
            {stats.dailyTrends.slice().reverse().map((day) => (
              <div key={day.date} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-slate-600">{day.orders} {t('payment_analytics.orders', 'orders')}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-slate-900">{(day.revenue / 100).toLocaleString()} RWF</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
  subtitle?: string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const { t } = useTranslation()
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <p className="text-sm text-slate-600" suppressHydrationWarning>{t(title, title)}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
    </div>
  )
}

function getPaymentIcon(method: string) {
  const iconClass = "w-10 h-10 rounded-lg flex items-center justify-center"
  
  switch (method) {
    case 'CASH':
      return <div className={`${iconClass} bg-green-100`}><Banknote className="w-5 h-5 text-green-600" /></div>
    case 'MTN_MOBILE_MONEY':
      return <div className={`${iconClass} bg-yellow-100`}><Smartphone className="w-5 h-5 text-yellow-600" /></div>
    case 'AIRTEL_MONEY':
      return <div className={`${iconClass} bg-red-100`}><Smartphone className="w-5 h-5 text-red-600" /></div>
    case 'WEB':
    case 'DIGITAL':
      return <div className={`${iconClass} bg-blue-100`}><CreditCard className="w-5 h-5 text-blue-600" /></div>
    default:
      return <div className={`${iconClass} bg-slate-100`}><CreditCard className="w-5 h-5 text-slate-600" /></div>
  }
}

function getPaymentLabel(method: string): string {
  switch (method) {
    case 'CASH': return 'Cash'
    case 'MTN_MOBILE_MONEY': return 'MTN Mobile Money'
    case 'AIRTEL_MONEY': return 'Airtel Money'
    case 'WEB': return 'Online Payment'
    case 'DIGITAL': return 'Digital Payment'
    case 'BANK_TRANSFER': return 'Bank Transfer'
    default: return method
  }
}

function getMethodColor(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-green-500'
    case 'MTN_MOBILE_MONEY': return 'bg-yellow-500'
    case 'AIRTEL_MONEY': return 'bg-red-500'
    case 'WEB': return 'bg-blue-500'
    case 'DIGITAL': return 'bg-purple-500'
    default: return 'bg-slate-500'
  }
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}m ${secs}s`
}
