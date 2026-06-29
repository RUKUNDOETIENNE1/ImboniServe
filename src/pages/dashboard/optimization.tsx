import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { GetServerSideProps } from 'next'
import { 
  Brain, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type RecommendationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED' | 'FAILED'
type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW'
type RecommendationSource = 'BUSINESS_SCANNER' | 'AI_INSIGHTS' | 'AUTOPILOT' | 'MANUAL'

interface Recommendation {
  id: string
  source: RecommendationSource
  category: string
  title: string
  description: string
  priority: RecommendationPriority
  estimatedImpact?: string
  effort?: string
  status: RecommendationStatus
  createdAt: string
  completedAt?: string
  _count?: {
    actions: number
    outcomes: number
  }
  outcomes?: Array<{
    metricName: string
    changePercent: number
  }>
}

interface ImpactMetrics {
  completedRecommendations: number
  totalActions: number
  averageImpactPercent: number
  periodDays: number
}

export default function OptimizationHubPage() {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<RecommendationStatus | 'ALL'>('ALL')
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'ALL') params.set('status', filter)
      
      const [recsRes, metricsRes] = await Promise.all([
        fetch(`/api/optimization/recommendations?${params}`),
        fetch('/api/optimization/metrics')
      ])

      if (recsRes.ok) {
        const data = await recsRes.json()
        setRecommendations(data)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load optimization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: RecommendationStatus, dismissedReason?: string) => {
    try {
      const res = await fetch(`/api/optimization/recommendations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, dismissedReason })
      })

      if (res.ok) {
        loadData()
        setSelectedRec(null)
        toast.success('Status updated')
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200'
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getSourceIcon = (source: RecommendationSource) => {
    switch (source) {
      case 'BUSINESS_SCANNER': return <Brain className="w-4 h-4" />
      case 'AI_INSIGHTS': return <BarChart3 className="w-4 h-4" />
      case 'AUTOPILOT': return <Zap className="w-4 h-4" />
      case 'MANUAL': return <Target className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: RecommendationStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-slate-500" />
      case 'IN_PROGRESS': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'DISMISSED': return <XCircle className="w-4 h-4 text-slate-400" />
      case 'FAILED': return <AlertTriangle className="w-4 h-4 text-red-600" />
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Optimization Hub</h1>
          </div>
          <p className="text-slate-600">
            AI-powered recommendations to grow your business. Track actions and measure impact.
          </p>
        </div>

        {/* Impact Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Completed</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{metrics.completedRecommendations}</div>
              <div className="text-xs text-purple-600 mt-1">Last {metrics.periodDays} days</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Actions Taken</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{metrics.totalActions}</div>
              <div className="text-xs text-blue-600 mt-1">Total executed</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Avg Impact</span>
              </div>
              <div className="text-3xl font-bold text-green-900">
                {metrics.averageImpactPercent > 0 ? '+' : ''}{metrics.averageImpactPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 mt-1">Measured outcomes</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Pending</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">
                {recommendations.filter(r => r.status === 'PENDING').length}
              </div>
              <div className="text-xs text-orange-600 mt-1">Awaiting action</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Recommendations List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Recommendations Yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Run a Business Scan or generate AI Insights to get personalized recommendations.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/dashboard/ai"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Go to AI Dashboard
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRec(rec)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        {getSourceIcon(rec.source)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{rec.source.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{rec.category}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">{rec.description}</p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                      {rec.estimatedImpact && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          {rec.estimatedImpact}
                        </span>
                      )}
                      {rec.effort && (
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                          Effort: {rec.effort}
                        </span>
                      )}
                      {rec._count && rec._count.actions > 0 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                          {rec._count.actions} action{rec._count.actions > 1 ? 's' : ''}
                        </span>
                      )}
                      {rec.outcomes && rec.outcomes.length > 0 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700">
                          Impact: +{rec.outcomes[0].changePercent.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(rec.status)}
                      <span className="text-sm font-medium text-slate-700">{rec.status}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedRec && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRec(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedRec.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityColor(selectedRec.priority)}`}>
                        {selectedRec.priority} PRIORITY
                      </span>
                      <span className="text-xs text-slate-500">{selectedRec.source.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRec(null)} className="text-slate-400 hover:text-slate-600">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-600">{selectedRec.description}</p>
                </div>

                {selectedRec.estimatedImpact && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Estimated Impact</h3>
                    <p className="text-green-600">{selectedRec.estimatedImpact}</p>
                  </div>
                )}

                {selectedRec.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'IN_PROGRESS')}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Start Working On This
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Why are you dismissing this recommendation?')
                        if (reason) updateStatus(selectedRec.id, 'DISMISSED', reason)
                      }}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {selectedRec.status === 'IN_PROGRESS' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'COMPLETED')}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}
