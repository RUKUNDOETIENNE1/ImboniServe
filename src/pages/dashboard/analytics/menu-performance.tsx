import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, PieChart } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type MenuItemPerformance = {
  id: string
  name: string
  category: string
  totalSold: number
  revenue: number
  avgPrice: number
  trend: number
}

export default function MenuPerformancePage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<MenuItemPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [sortBy, setSortBy] = useState('revenue')

  useEffect(() => {
    fetchPerformance()
  }, [period])

  async function fetchPerformance() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/menu-performance?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue
    if (sortBy === 'quantity') return b.totalSold - a.totalSold
    if (sortBy === 'trend') return b.trend - a.trend
    return 0
  })

  const topPerformers = sortedItems.slice(0, 5)
  const bottomPerformers = sortedItems.slice(-5).reverse()

  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0)
  const totalSold = items.reduce((sum, item) => sum + item.totalSold, 0)
  const avgItemRevenue = items.length > 0 ? totalRevenue / items.length : 0

  const categoryPerformance = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { revenue: 0, quantity: 0 }
    }
    acc[item.category].revenue += item.revenue
    acc[item.category].quantity += item.totalSold
    return acc
  }, {} as Record<string, { revenue: number; quantity: number }>)

  const stats = [
    { label: t('menu_performance.total_revenue'), value: totalRevenue / 100, icon: DollarSign, color: 'green', isCurrency: true },
    { label: t('menu_performance.items_sold'), value: totalSold, icon: ShoppingCart, color: 'blue', isCurrency: false },
    { label: t('menu_performance.avg_item_revenue'), value: avgItemRevenue / 100, icon: TrendingUp, color: 'purple', isCurrency: true },
    { label: t('menu_performance.menu_items'), value: items.length, icon: BarChart3, color: 'orange', isCurrency: false }
  ]

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-imboni-blue" />
              <span suppressHydrationWarning>{t('menu_performance.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('menu_performance.subtitle')}</p>
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
                <span suppressHydrationWarning>{p === '7d' ? t('menu_performance.last_7_days') : p === '30d' ? t('menu_performance.last_30_days') : t('menu_performance.last_90_days')}</span>
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
              <p className="text-2xl font-bold text-slate-800">
                {stat.isCurrency ? <CurrencyDisplay amount={stat.value} /> : stat.value}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Category Performance */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-imboni-blue" />
          <span suppressHydrationWarning>{t('menu_performance.performance_by_category')}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(categoryPerformance)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .map(([category, data]) => (
              <div key={category} className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-800 mb-2">{category}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">
                    <span suppressHydrationWarning>{t('menu_performance.revenue')}:</span> <span className="font-semibold text-imboni-blue"><CurrencyDisplay amount={data.revenue / 100} /></span>
                  </p>
                  <p className="text-sm text-slate-600">
                    <span suppressHydrationWarning>{t('menu_performance.sold')}:</span> <span className="font-semibold">{data.quantity}</span>
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span suppressHydrationWarning>{t('menu_performance.top_5_performers')}</span>
          </h2>
          <div className="space-y-3">
            {topPerformers.map((item, index) => (
              <div key={item.id} className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  {item.trend > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                      +{item.trend}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>{t('menu_performance.revenue')}</p>
                    <p className="font-semibold text-imboni-blue"><CurrencyDisplay amount={item.revenue / 100} /></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>{t('menu_performance.sold')}</p>
                    <p className="font-semibold">{item.totalSold}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Performers */}
        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span suppressHydrationWarning>{t('menu_performance.bottom_5_performers')}</span>
          </h2>
          <div className="space-y-3">
            {bottomPerformers.map((item, index) => (
              <div key={item.id} className="p-4 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                      {items.length - index}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </div>
                  {item.trend < 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                      {item.trend}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="font-semibold text-slate-600"><CurrencyDisplay amount={item.revenue / 100} /></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sold</p>
                    <p className="font-semibold">{item.totalSold}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <h2 className="text-xl font-bold text-blue-900 mb-4" suppressHydrationWarning>💡 {t('menu_performance.recommendations')}</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li suppressHydrationWarning>• {t('menu_performance.recommendation_1')}</li>
          <li suppressHydrationWarning>• {t('menu_performance.recommendation_2')}</li>
          <li suppressHydrationWarning>• {t('menu_performance.recommendation_3')}</li>
          <li suppressHydrationWarning>• {t('menu_performance.recommendation_4')}</li>
        </ul>
      </Card>
    </DashboardLayout>
  )
}
