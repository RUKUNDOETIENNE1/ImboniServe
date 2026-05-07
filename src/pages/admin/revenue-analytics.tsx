import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { TrendingUp, Users, Target, Award, BarChart3, PieChart, Activity } from 'lucide-react'

export default function RevenueAnalytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [revenueSource, setRevenueSource] = useState<any>(null)
  const [timeSeries, setTimeSeries] = useState<any[]>([])
  const [metric, setMetric] = useState<'earnings' | 'payouts' | 'referrals'>('earnings')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [status, metric])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [funnelRes, leaderboardRes, sourceRes, timeSeriesRes] = await Promise.all([
        fetch('/api/admin/analytics/funnel'),
        fetch(`/api/admin/analytics/leaderboard?limit=10&metric=${metric}`),
        fetch('/api/admin/analytics/revenue-source'),
        fetch('/api/admin/analytics/time-series?interval=day')
      ])

      if (funnelRes.ok) {
        const data = await funnelRes.json()
        setFunnel(data.funnel)
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboard(data.leaderboard)
      }

      if (sourceRes.ok) {
        const data = await sourceRes.json()
        setRevenueSource(data)
      }

      if (timeSeriesRes.ok) {
        const data = await timeSeriesRes.json()
        setTimeSeries(data.data)
      }
    } catch (e) {
      showToast('error', t('admin.analytics.load_failed', 'Failed to load analytics'))
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">{t('common.loading', 'Loading...')}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('admin.analytics.title', 'Revenue Analytics')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('admin.analytics.subtitle', 'Advanced insights and performance metrics')}</p>
      </div>

      {/* Conversion Funnel */}
      {funnel && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-imboni-blue" />
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.analytics.conversion_funnel', 'Conversion Funnel')}</h2>
          </div>
          <div className="space-y-3">
            {funnel.stages.map((stage: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                  <span className="text-sm text-slate-600">{stage.count} ({stage.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-imboni-blue to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-900">
              <strong>{t('admin.analytics.overall_conversion', 'Overall Conversion Rate')}:</strong> {funnel.conversionRate.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Top Marketers Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.analytics.top_marketers', 'Top Marketers')}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMetric('earnings')}
              className={`px-3 py-1 rounded-lg text-sm ${metric === 'earnings' ? 'bg-imboni-blue text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {t('admin.analytics.earnings', 'Earnings')}
            </button>
            <button
              onClick={() => setMetric('payouts')}
              className={`px-3 py-1 rounded-lg text-sm ${metric === 'payouts' ? 'bg-imboni-blue text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {t('admin.analytics.payouts', 'Payouts')}
            </button>
            <button
              onClick={() => setMetric('referrals')}
              className={`px-3 py-1 rounded-lg text-sm ${metric === 'referrals' ? 'bg-imboni-blue text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {t('admin.analytics.referrals', 'Referrals')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                <th className="py-3 pr-4">{t('admin.analytics.rank', 'Rank')}</th>
                <th className="py-3 pr-4">{t('common.name', 'Name')}</th>
                <th className="py-3 pr-4">{t('admin.analytics.total_earned', 'Total Earned')}</th>
                <th className="py-3 pr-4">{t('admin.analytics.referrals', 'Referrals')}</th>
                <th className="py-3 pr-4">{t('admin.analytics.commissions', 'Commissions')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((marketer) => (
                <tr key={marketer.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      marketer.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      marketer.rank === 2 ? 'bg-slate-100 text-slate-700' :
                      marketer.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {marketer.rank}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div>
                      <div className="font-medium text-slate-800">{marketer.name}</div>
                      <div className="text-xs text-slate-500">{marketer.referralCode}</div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <CurrencyDisplay amount={marketer.totalEarned} className="font-semibold text-green-600" />
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{marketer.referralsCount}</td>
                  <td className="py-3 pr-4 text-slate-700">{marketer.commissionsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Source */}
      {revenueSource && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-imboni-blue" />
              <h2 className="text-lg font-semibold text-slate-800">{t('admin.analytics.by_source', 'By Source')}</h2>
            </div>
            <div className="space-y-2">
              {revenueSource.bySource.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{item.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-imboni-blue h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-800">{t('admin.analytics.by_campaign', 'By Campaign')}</h2>
            </div>
            <div className="space-y-2">
              {revenueSource.byCampaign.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{item.campaign}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Series Chart (Simple Bar Visualization) */}
      {timeSeries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">{t('admin.analytics.revenue_trend', 'Revenue Trend (Last 30 Days)')}</h2>
          </div>
          <div className="flex items-end gap-1 h-48">
            {timeSeries.slice(-30).map((item: any, idx: number) => {
              const maxAmount = Math.max(...timeSeries.map((d: any) => d.amount))
              const height = (item.amount / maxAmount) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${item.date}: ${(item.amount / 100).toLocaleString()} RWF (${item.count} commissions)`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
            {t('admin.analytics.hover_for_details', 'Hover over bars for details')}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
