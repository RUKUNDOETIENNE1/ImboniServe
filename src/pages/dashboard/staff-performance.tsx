import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import {
  Users, TrendingUp, Award, Clock, DollarSign, Star,
  Target, Zap, ThumbsUp, AlertCircle, Trophy, Medal
} from 'lucide-react'
import Card from '@/components/ui/Card'
import CurrencyDisplay from '@/components/CurrencyDisplay'

interface StaffMember {
  id: string
  name: string
  role: string
  avatar?: string
  stats: {
    totalSales: number
    totalOrders: number
    avgOrderValue: number
    avgServiceTime: number
    customerRating: number
    totalTips: number
    ordersToday: number
    salesThisWeek: number
  }
  performance: {
    score: number
    rank: number
    badge: 'Gold' | 'Silver' | 'Bronze' | 'Rising Star' | 'Rookie'
    trend: 'up' | 'down' | 'stable'
  }
}

export default function StaffPerformance() {
  const { t } = useTranslation()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchStaffPerformance()
  }, [period])

  const fetchStaffPerformance = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/performance?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Failed to fetch staff performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      'Gold': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Silver': 'bg-slate-200 text-slate-700 border-slate-300',
      'Bronze': 'bg-orange-100 text-orange-700 border-orange-300',
      'Rising Star': 'bg-purple-100 text-purple-700 border-purple-300',
      'Rookie': 'bg-blue-100 text-blue-700 border-blue-300'
    }
    return colors[badge] || 'bg-slate-100 text-slate-700'
  }

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Gold': return Trophy
      case 'Silver': return Medal
      case 'Bronze': return Award
      case 'Rising Star': return Star
      default: return Users
    }
  }

  const topPerformer = staff.length > 0 ? staff[0] : null

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {t('staff.performance_title', 'Staff Performance Metrics')}
          </h1>
          <p className="text-slate-600">
            {t('staff.performance_subtitle', 'Track, compare, and reward your team\'s performance')}
          </p>
        </div>

        {/* Period Filter */}
        <div className="mb-6 flex gap-3">
          {(['today', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-imboni-blue text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {t(`common.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
            </button>
          ))}
        </div>

        {/* Top Performer Spotlight */}
        {topPerformer && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Trophy className="w-12 h-12 text-yellow-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {t('staff.top_performer', 'Top Performer')}
                  </h2>
                  <p className="text-slate-600">{period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {topPerformer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{topPerformer.name}</h3>
                  <p className="text-slate-600 mb-3">{topPerformer.role}</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">{t('staff.sales', 'Sales')}</p>
                      <p className="text-lg font-bold text-slate-800">
                        <CurrencyDisplay amount={topPerformer.stats.totalSales} />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t('staff.orders', 'Orders')}</p>
                      <p className="text-lg font-bold text-slate-800">{topPerformer.stats.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t('staff.rating', 'Rating')}</p>
                      <p className="text-lg font-bold text-slate-800 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {topPerformer.stats.customerRating.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t('staff.performance_score', 'Score')}</p>
                      <p className="text-lg font-bold text-slate-800">{topPerformer.performance.score}/100</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Staff Leaderboard */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-6 h-6 text-imboni-blue" />
              {t('staff.leaderboard', 'Performance Leaderboard')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.rank', 'Rank')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.staff_member', 'Staff Member')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.badge', 'Badge')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.total_sales', 'Total Sales')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.orders', 'Orders')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.avg_order', 'Avg Order')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.rating', 'Rating')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.tips', 'Tips')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('staff.score', 'Score')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      {t('staff.no_data', 'No staff performance data available')}
                    </td>
                  </tr>
                ) : (
                  staff.map((member, index) => {
                    const BadgeIcon = getBadgeIcon(member.performance.badge)
                    return (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-slate-500' :
                              index === 2 ? 'text-orange-600' :
                              'text-slate-400'
                            }`}>
                              #{member.performance.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{member.name}</p>
                              <p className="text-sm text-slate-500">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getBadgeColor(member.performance.badge)}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {member.performance.badge}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          <CurrencyDisplay amount={member.stats.totalSales} />
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {member.stats.totalOrders}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <CurrencyDisplay amount={member.stats.avgOrderValue} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium text-slate-800">
                              {member.stats.customerRating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <CurrencyDisplay amount={member.stats.totalTips} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                                style={{ width: `${member.performance.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-800 w-12">
                              {member.performance.score}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
