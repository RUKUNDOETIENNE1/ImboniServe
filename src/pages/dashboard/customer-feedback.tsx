import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { MessageSquare, Star, TrendingUp, TrendingDown, Filter, Download, Send, Smile, Meh, Frown, AlertTriangle } from 'lucide-react'

interface Feedback {
  id: string
  customerName: string
  customerPhone: string
  orderId: string
  rating: number
  category: 'food' | 'service' | 'atmosphere' | 'price' | 'other'
  comment: string
  sentiment: 'positive' | 'neutral' | 'negative'
  date: Date
  responded: boolean
}

interface FeedbackStats {
  total: number
  averageRating: number
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number }
  sentiment: { positive: number; neutral: number; negative: number }
}

export default function CustomerFeedback() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all')
  const [showSurveyConfig, setShowSurveyConfig] = useState(false)

  const mockFeedback: Feedback[] = [
    {
      id: '1',
      customerName: 'John Doe',
      customerPhone: '+250788123456',
      orderId: 'ORD-001',
      rating: 5,
      category: 'food',
      comment: 'Excellent food! The grilled chicken was perfectly cooked and very flavorful.',
      sentiment: 'positive',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      responded: false
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      customerPhone: '+250788234567',
      orderId: 'ORD-002',
      rating: 4,
      category: 'service',
      comment: 'Great service but the wait time was a bit long. Overall good experience.',
      sentiment: 'neutral',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      responded: true
    },
    {
      id: '3',
      customerName: 'Robert Mugabo',
      customerPhone: '+250788345678',
      orderId: 'ORD-003',
      rating: 2,
      category: 'food',
      comment: 'The burger was overcooked and the fries were cold. Disappointed.',
      sentiment: 'negative',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      responded: false
    },
    {
      id: '4',
      customerName: 'Marie Uwimana',
      customerPhone: '+250788456789',
      orderId: 'ORD-004',
      rating: 5,
      category: 'atmosphere',
      comment: 'Beautiful ambiance and very comfortable seating. Will definitely come back!',
      sentiment: 'positive',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      responded: true
    }
  ]

  const stats: FeedbackStats = {
    total: mockFeedback.length,
    averageRating: 4.0,
    distribution: { 5: 2, 4: 1, 3: 0, 2: 1, 1: 0 },
    sentiment: { positive: 2, neutral: 1, negative: 1 }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-5 h-5 text-green-500" />
      case 'neutral': return <Meh className="w-5 h-5 text-yellow-500" />
      case 'negative': return <Frown className="w-5 h-5 text-red-500" />
      default: return null
    }
  }

  const getStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
      />
    ))
  }

  const filteredFeedback = filter === 'all' 
    ? mockFeedback 
    : mockFeedback.filter(f => f.sentiment === filter)

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('feedback.title', 'Customer Feedback')}</h1>
            <p className="text-slate-600">{t('feedback.subtitle', 'Collect and analyze customer reviews')}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSurveyConfig(!showSurveyConfig)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {t('feedback.configureSurvey', 'Configure Survey')}
            </button>
            <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('feedback.export', 'Export')}
            </button>
          </div>
        </div>

        {/* Survey Configuration Panel */}
        {showSurveyConfig && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('feedback.surveyConfig', 'Survey Configuration')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('feedback.trigger', 'Trigger')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>{t('feedback.afterOrder', 'After Order Completion')}</option>
                  <option>{t('feedback.afterPayment', 'After Payment')}</option>
                  <option>{t('feedback.manual', 'Manual Send')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('feedback.channel', 'Channel')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('feedback.delay', 'Delay (minutes)')}</label>
                <input type="number" defaultValue={30} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('feedback.language', 'Language')}</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option>English</option>
                  <option>French</option>
                  <option>Kinyarwanda</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700">
                {t('feedback.saveConfig', 'Save Configuration')}
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">{t('feedback.totalFeedback', 'Total Feedback')}</span>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">{t('feedback.avgRating', 'Average Rating')}</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">{t('feedback.positive', 'Positive')}</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.sentiment.positive}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">{t('feedback.needsAttention', 'Needs Attention')}</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.sentiment.negative}</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('feedback.ratingDistribution', 'Rating Distribution')}</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-600">{star}</span>
                </div>
                <div className="flex-1 bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.distribution[star as keyof typeof stats.distribution] / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-8 text-right">{stats.distribution[star as keyof typeof stats.distribution]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter and Feedback List */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'positive', 'neutral', 'negative'].map(sentiment => (
                <button
                  key={sentiment}
                  onClick={() => setFilter(sentiment as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === sentiment
                      ? 'bg-imboni-blue text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t(`feedback.${sentiment}`, sentiment.charAt(0).toUpperCase() + sentiment.slice(1))}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option>{t('feedback.allTime', 'All Time')}</option>
                <option>{t('feedback.last7Days', 'Last 7 Days')}</option>
                <option>{t('feedback.last30Days', 'Last 30 Days')}</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredFeedback.map(feedback => (
              <div
                key={feedback.id}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getSentimentIcon(feedback.sentiment)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900">{feedback.customerName}</h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {feedback.orderId}
                        </span>
                        <span className="text-xs text-slate-500">
                          {feedback.date.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {getStars(feedback.rating)}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{feedback.comment}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {t(`feedback.category.${feedback.category.toLowerCase()}`, feedback.category)}
                        </span>
                        {!feedback.responded && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            {t('feedback.notResponded', 'Not Responded')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-imboni-blue hover:text-blue-700 text-sm font-medium">
                    {t('feedback.respond', 'Respond')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredFeedback.length === 0 && (
            <div className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('feedback.noFeedback', 'No feedback found')}
              </h3>
              <p className="text-slate-600">
                {t('feedback.noFeedbackDesc', 'Feedback will appear here once customers submit reviews')}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
