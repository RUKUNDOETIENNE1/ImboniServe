import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { BarChart2, TrendingUp, Users, ShoppingBag, Clock, Download } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { GetServerSideProps } from 'next'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

function StatCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const analyticsEnabled = useFeatureFlag('advanced_analytics')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/dashboard?days=${days}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  const summary = data?.stats?.summary
  const salesByDay = (data?.stats?.salesByDay || []).map((d: any) => ({
    day: d.day?.slice(5),
    revenue: Number(d.revenue) / 100,
    orders: Number(d.orders),
  }))
  const topItems = data?.stats?.topItems || []
  const peakHours = (data?.peakHours || []).map((h: any) => ({ hour: `${h.hour}:00`, orders: Number(h.orders) }))
  const customers = data?.customers

  if (!analyticsEnabled && !loading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{t('analytics.unlock_message', 'Advanced Analytics unlocks at 10 active clients')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('analytics.basic_reports', 'Basic reports are available in the Reports tab')}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6" /> {t('analytics.title', 'Advanced Analytics')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('analytics.subtitle', 'Business performance insights')}</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${days === d ? 'bg-imboni-blue text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title={t('analytics.total_revenue', 'Total Revenue')} value={`${((summary?.totalRevenueCents || 0) / 100).toLocaleString()} RWF`} sub={`${days}-${t('analytics.day_period', 'day period')}`} icon={TrendingUp} color="bg-green-100 text-green-600" />
            <StatCard title={t('analytics.total_orders', 'Total Orders')} value={(summary?.totalOrders || 0).toLocaleString()} icon={ShoppingBag} color="bg-blue-100 text-blue-600" />
            <StatCard title={t('analytics.avg_order_value', 'Avg Order Value')} value={`${((summary?.avgOrderValueCents || 0) / 100).toLocaleString()} RWF`} icon={BarChart2} color="bg-purple-100 text-purple-600" />
            <StatCard title={t('analytics.customers', 'Customers')} value={(customers?.total || 0).toLocaleString()} sub={`${customers?.retentionRate || 0}% ${t('analytics.returning', 'returning')}`} icon={Users} color="bg-amber-100 text-amber-600" />
          </div>

          {/* Revenue trend */}
          {salesByDay.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.revenue_trend', 'Revenue Trend')}</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesByDay}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [`${v.toLocaleString()} RWF`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top items */}
            {topItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.top_selling_items', 'Top Selling Items')}</h2>
                <div className="space-y-2">
                  {topItems.slice(0, 8).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{Number(item.qty).toLocaleString()} {t('analytics.sold', 'sold')}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{(Number(item.revenue) / 100).toLocaleString()} RWF</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Peak hours */}
            {peakHours.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('analytics.peak_hours', 'Peak Hours')}
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={peakHours} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
