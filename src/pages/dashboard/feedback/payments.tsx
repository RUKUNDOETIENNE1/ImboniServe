import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Star,
  MessageSquare,
  Filter,
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

interface FeedbackItem {
  id: string
  orderNumber: string
  paymentMethod: string
  rating: 'positive' | 'negative'
  stars: number | null
  issues: string[]
  comment: string | null
  createdAt: string
}

interface FeedbackStats {
  total: number
  positive: number
  negative: number
  positiveRate: number
  avgStars: number
  topIssues: Array<{ issue: string; count: number }>
  byMethod: Array<{
    method: string
    total: number
    positive: number
    negative: number
    rate: number
  }>
}

export default function PaymentFeedbackDashboard({ businessId }: { businessId: string }) {
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState('30')
  const { t } = useTranslation()

  useEffect(() => {
    fetchFeedback()
  }, [dateRange])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/feedback/payment/list?days=${dateRange}`)
      const data = await response.json()
      
      if (response.ok) {
        setFeedback(data.feedback)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedback = feedback.filter(f => {
    if (filter !== 'all' && f.rating !== filter) return false
    if (methodFilter !== 'all' && f.paymentMethod !== methodFilter) return false
    return true
  })

  const exportCSV = () => {
    const csv = [
      `${t('payment_feedback.order')},${t('payment_feedback.payment_method')},${t('payment_feedback.rating')},${t('payment_feedback.stars')},${t('payment_feedback.issues')},${t('payment_feedback.comment')},${t('payment_feedback.date')}`,
      ...filteredFeedback.map(f => 
        `${f.orderNumber},${f.paymentMethod},${f.rating},${f.stars || ''},${f.issues.join('; ')},${f.comment || ''},${new Date(f.createdAt).toISOString()}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-feedback-${dateRange}days.csv`
    a.click()
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('payment_feedback.title')}</h1>
            <p className="text-sm text-slate-600">{t('payment_feedback.customer_experience_insights')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="7">{t('payment_feedback.last_7_days')}</option>
              <option value="30">{t('payment_feedback.last_30_days')}</option>
              <option value="90">{t('payment_feedback.last_90_days')}</option>
            </select>
            
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-primary-700"
            >
              <Download className="w-4 h-4" />
              {t('payment_feedback.export')}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{t('payment_feedback.total_responses')}</span>
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            
            <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 font-medium">{t('payment_feedback.positive')}</span>
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.positive}</p>
              <p className="text-xs text-green-700 mt-1">{stats.positiveRate.toFixed(1)}% {t('payment_feedback.of_total')}</p>
            </div>
            
            <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-700 font-medium">{t('payment_feedback.negative')}</span>
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-900">{stats.negative}</p>
              <p className="text-xs text-red-700 mt-1">{(100 - stats.positiveRate).toFixed(1)}% {t('payment_feedback.of_total')}</p>
            </div>
            
            <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-700 font-medium">{t('payment_feedback.avg_rating')}</span>
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-900">{stats.avgStars.toFixed(1)}</p>
              <p className="text-xs text-yellow-700 mt-1">{t('payment_feedback.out_of_5_stars')}</p>
            </div>
          </div>
        )}

        {/* By Payment Method */}
        {stats && stats.byMethod.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t('payment_feedback.feedback_by_method')}</h2>
            <div className="space-y-3">
              {stats.byMethod.map((method) => (
                <div key={method.method} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{formatPaymentMethod(method.method)}</span>
                    <span className={`text-sm font-medium ${
                      method.rate >= 80 ? 'text-green-600' : 
                      method.rate >= 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {method.rate.toFixed(1)}% {t('payment_feedback.positive')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-green-600" />
                      {method.positive}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3 text-red-600" />
                      {method.negative}
                    </span>
                    <span>Total: {method.total}</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full ${
                        method.rate >= 80 ? 'bg-green-500' : 
                        method.rate >= 60 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${method.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Issues */}
        {stats && stats.topIssues.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {t('payment_feedback.top_issues')}
            </h2>
            <div className="space-y-2">
              {stats.topIssues.slice(0, 5).map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <span className="text-sm text-slate-900">{issue.issue}</span>
                  <span className="text-sm font-semibold text-red-600">{issue.count} {t('payment_feedback.reports')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{t('payment_feedback.filter')}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-imboni-blue text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('payment_feedback.all')}
              </button>
              <button
                onClick={() => setFilter('positive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'positive'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('payment_feedback.positive')}
              </button>
              <button
                onClick={() => setFilter('negative')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'negative'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('payment_feedback.negative')}
              </button>
            </div>
            
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">{t('payment_feedback.all_methods')}</option>
              <option value="CASH">{t('payment_feedback.cash')}</option>
              <option value="MTN_MOBILE_MONEY">{t('payment_feedback.mtn_mobile_money')}</option>
              <option value="AIRTEL_MONEY">{t('payment_feedback.airtel_money')}</option>
              <option value="WEB">{t('payment_feedback.online_payment')}</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">{t('payment_feedback.no_feedback_yet')}</p>
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-2xl p-6 ${
                  item.rating === 'positive'
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-red-200 bg-red-50/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.rating === 'positive'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {item.rating === 'positive' ? (
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <ThumbsDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <p className="font-semibold text-slate-900">{t('payment_feedback.order')} {item.orderNumber}</p>
                      <p className="text-xs text-slate-600">{formatPaymentMethod(item.paymentMethod)} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {item.stars && item.stars > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>
                
                {item.issues.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-700 mb-2">{t('payment_feedback.issues_reported')}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.issues.map((issue, idx) => (
                        <span key={idx} className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {item.comment && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-700 italic">{t('payment_feedback.comment')} "{item.comment}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'CASH': return 'Cash'
    case 'MTN_MOBILE_MONEY': return 'MTN Mobile Money'
    case 'AIRTEL_MONEY': return 'Airtel Money'
    case 'WEB': return 'Online Payment'
    case 'DIGITAL': return 'Digital Payment'
    default: return method
  }
}
