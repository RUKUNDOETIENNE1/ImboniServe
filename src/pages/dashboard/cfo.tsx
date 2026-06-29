/**
 * CFO Dashboard — Financial Decision System
 * 
 * Phase: 1.2D (Power Layer)
 * Purpose: Transform financial intelligence into executive decisions
 * 
 * Architecture:
 * - Services-only consumption (zero business logic)
 * - Decision-oriented (not reporting)
 * - Financial Priorities as core value
 * - <1s load time target
 * - Phase 1.2D: Intelligence amplification (insights + correlations + narratives)
 * 
 * Governance:
 * - 100% KPI_CATALOG_V2.md compliance
 * - 100% FINANCIAL_DATA_GOVERNANCE.md compliance
 * - All revenue from FinancialLedgerEntry (via services)
 * - Phase 1.2D: 100% deterministic rules, zero ML/AI
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Shield,
  TrendingUpIcon
} from 'lucide-react'

// Phase 1.2D Power Layer Components
import { 
  InsightLayer, 
  CrossSignalAlertPanel, 
  CfoInterpretationBox 
} from './cfo-power-components'

// Types from services
interface CFODashboardData {
  financialHealth: any
  revenueIntelligence: any
  subscriptionIntelligence: any
  operationsIntelligence: any
  priorities: any[]
  insightStrip: {
    summary: string
    generatedAt: Date
  }
  // Phase 1.2D Power Layer
  insights?: {
    topInsights: CfoInsight[]
    metricInsights: {
      mrr: CfoMetricInsight
      revenueChurn: CfoMetricInsight
      nrr: CfoMetricInsight
      concentration: CfoMetricInsight
      operations: CfoMetricInsight
    }
  }
  correlations?: SignalCorrelation[]
  narratives?: {
    financialHealth: CfoNarrative
    revenueIntelligence: CfoNarrative
    subscriptionIntelligence: CfoNarrative
    operations: CfoNarrative
    priorities: CfoNarrative
  }
  metadata: {
    loadTime: number
    cacheHit: boolean
    generatedAt: Date
    powerLayerEnabled?: boolean
  }
}

interface CfoInsight {
  category: 'REVENUE' | 'RETENTION' | 'OPERATIONS' | 'RISK' | 'OPPORTUNITY'
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
  insight: string
  rootCause: string
  action: string
  metricName: string
  currentValue: number | string
  previousValue?: number | string
  changePercent?: number
  threshold?: number
  priority: number
}

interface CfoMetricInsight {
  metricName: string
  insight: string
  rootCause: string
  action: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
}

interface SignalCorrelation {
  pattern: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  signals: string[]
  hypothesis: string
  action: string
  priority: number
}

interface CfoNarrative {
  section: string
  narrative: string
  tone: 'CRITICAL' | 'WARNING' | 'NEUTRAL' | 'POSITIVE'
}

export default function CFODashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<CFODashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/cfo')
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('CFO access required')
        }
        throw new Error('Failed to load dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Financial Intelligence...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>CFO Dashboard — Financial Intelligence</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CFO Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Financial Decision Intelligence System
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Load Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.metadata.loadTime}ms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CFO Financial Insight Strip */}
        <FinancialInsightStrip summary={data.insightStrip.summary} />

        {/* Phase 1.2D: CFO Power Strip */}
        {data.metadata.powerLayerEnabled && data.insights && data.correlations && (
          <CfoPowerStrip 
            insights={data.insights.topInsights} 
            correlations={data.correlations}
          />
        )}

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Phase 1.2D: Cross-Signal Alert Panel */}
          {data.metadata.powerLayerEnabled && data.correlations && data.correlations.length > 0 && (
            <CrossSignalAlertPanel correlations={data.correlations} />
          )}

          {/* Financial Priorities - MOST IMPORTANT SECTION */}
          {data.narratives?.priorities && (
            <CfoInterpretationBox narrative={data.narratives.priorities} />
          )}
          <FinancialPriorities priorities={data.priorities} />

          {/* Financial Health Overview */}
          {data.narratives?.financialHealth && (
            <CfoInterpretationBox narrative={data.narratives.financialHealth} />
          )}
          <FinancialHealthOverview 
            data={data.financialHealth}
            metricInsights={data.insights?.metricInsights}
          />

          {/* Revenue Intelligence */}
          {data.narratives?.revenueIntelligence && (
            <CfoInterpretationBox narrative={data.narratives.revenueIntelligence} />
          )}
          <RevenueIntelligence 
            data={data.revenueIntelligence}
            metricInsights={data.insights?.metricInsights}
          />

          {/* Subscription Intelligence */}
          {data.narratives?.subscriptionIntelligence && (
            <CfoInterpretationBox narrative={data.narratives.subscriptionIntelligence} />
          )}
          <SubscriptionIntelligence data={data.subscriptionIntelligence} />

          {/* Financial Operations Intelligence */}
          {data.narratives?.operations && (
            <CfoInterpretationBox narrative={data.narratives.operations} />
          )}
          <FinancialOperations 
            data={data.operationsIntelligence}
            metricInsights={data.insights?.metricInsights}
          />

        </div>
      </div>
    </>
  )
}

/**
 * Financial Insight Strip Component
 * 10-second CFO summary
 */
function FinancialInsightStrip({ summary }: { summary: string }) {
  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start space-x-3">
          <Activity className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Financial Priorities Component
 * HIGHEST VALUE SECTION - Core product value
 */
function FinancialPriorities({ priorities }: { priorities: any[] }) {
  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-50 border-red-200 text-red-900'
      case 'HIGH': return 'bg-orange-50 border-orange-200 text-orange-900'
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'INFO': return 'bg-gray-50 border-gray-200 text-gray-900'
      default: return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <XCircle className="h-5 w-5 text-red-600" />
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'MEDIUM': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'LOW': return <TrendingUp className="h-5 w-5 text-blue-600" />
      case 'INFO': return <CheckCircle className="h-5 w-5 text-gray-600" />
      default: return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Financial Priorities</h2>
        <p className="text-sm text-gray-500 mt-1">
          What requires CFO intervention this week
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {priorities.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-gray-600">All financial metrics within targets</p>
          </div>
        ) : (
          priorities.map((priority, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getPriorityColor(priority.level)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getPriorityIcon(priority.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {priority.level}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-600">{priority.category.replace('_', ' ')}</span>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{priority.title}</h3>
                  <p className="text-sm mb-3">{priority.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Current: </span>
                      <span className="font-semibold">{priority.metricValue}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Threshold: </span>
                      <span className="font-semibold">{priority.threshold}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trend: </span>
                      <span className="font-semibold">{priority.trend}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-50 rounded p-3 border border-current border-opacity-20">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recommended Action:</p>
                    <p className="text-sm">{priority.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * Financial Health Overview Component
 * Executive snapshot of financial health
 */
function FinancialHealthOverview({ data, metricInsights }: { data: any, metricInsights?: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GROWTH':
      case 'EXCELLENT':
      case 'HEALTHY':
      case 'STRONG':
        return 'text-green-600'
      case 'STABLE':
      case 'GOOD':
      case 'MODERATE':
        return 'text-blue-600'
      case 'WARNING':
      case 'WEAK':
        return 'text-yellow-600'
      case 'DECLINE':
      case 'CRITICAL':
      case 'NEGATIVE':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (changePercent < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const metrics = [
    {
      label: 'MRR',
      value: formatCurrency(data.mrr.value),
      change: formatPercent(data.mrr.changePercent),
      status: data.mrr.status,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      label: 'ARR',
      value: formatCurrency(data.arr.value),
      change: formatPercent(data.arr.changePercent),
      status: data.arr.status,
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      label: 'GMV (30d)',
      value: formatCurrency(data.gmv.value),
      change: formatPercent(data.gmv.changePercent),
      status: data.gmv.changePercent > 0 ? 'GROWTH' : 'DECLINE',
      icon: <Activity className="h-5 w-5" />
    },
    {
      label: 'Revenue Growth',
      value: formatPercent(data.revenueGrowth.rate30d),
      change: data.revenueGrowth.status,
      status: data.revenueGrowth.status,
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      label: 'Revenue Churn',
      value: formatPercent(data.revenueChurn.rate),
      change: data.revenueChurn.status,
      status: data.revenueChurn.status,
      icon: <TrendingDown className="h-5 w-5" />
    },
    {
      label: 'Net Revenue Retention',
      value: formatPercent(data.netRevenueRetention.rate),
      change: data.netRevenueRetention.status,
      status: data.netRevenueRetention.status,
      icon: <Users className="h-5 w-5" />
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Financial Health Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Is our financial foundation healthy?
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Phase 1.2D: Insight Layers for key metrics */}
        {metricInsights && (
          <div className="space-y-3">
            {metricInsights.mrr && <InsightLayer insight={metricInsights.mrr} />}
            {metricInsights.revenueChurn && <InsightLayer insight={metricInsights.revenueChurn} />}
            {metricInsights.nrr && <InsightLayer insight={metricInsights.nrr} />}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                <div className={getStatusColor(metric.status)}>
                  {metric.icon}
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {getTrendIcon(typeof metric.change === 'string' ? 0 : parseFloat(metric.change))}
                <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Revenue Intelligence Component
 * Where is money coming from and what threatens it?
 */
function RevenueIntelligence({ data, metricInsights }: { data: any, metricInsights?: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getConcentrationStatus = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-50'
      case 'WARNING': return 'text-yellow-600 bg-yellow-50'
      case 'CRITICAL': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Intelligence</h2>
        <p className="text-sm text-gray-500 mt-1">
          Where is revenue coming from and what threatens it?
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Phase 1.2D: Concentration Insight Layer */}
        {metricInsights?.concentration && (
          <InsightLayer insight={metricInsights.concentration} />
        )}

        {/* Revenue Concentration - Critical Risk Indicator */}
        <div className={`border-2 rounded-lg p-4 ${getConcentrationStatus(data.concentration.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Revenue Concentration Risk</h3>
            <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
              {data.concentration.status}
            </span>
          </div>
          <p className="text-2xl font-bold mb-1">{formatPercent(data.concentration.rate)}</p>
          <p className="text-sm">
            Top 10 customers represent {formatPercent(data.concentration.rate)} of total revenue
          </p>
        </div>

        {/* Revenue by Source */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Revenue Composition</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Subscription Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(data.bySource.subscription)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Marketplace Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(data.bySource.marketplace)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Direct Sales Revenue</span>
              <span className="font-semibold text-gray-900">{formatCurrency(data.bySource.directSales)}</span>
            </div>
          </div>
        </div>

        {/* Top Revenue Contributors */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Top Revenue Contributors</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topContributors.slice(0, 5).map((contributor: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{contributor.customerName}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(contributor.revenue)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {formatPercent(contributor.revenuePercent)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-medium ${
                      contributor.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {contributor.growth >= 0 ? '+' : ''}{formatPercent(contributor.growth)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Drivers */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Revenue Drivers</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">New Customer Revenue</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(data.drivers.newCustomerRevenue)}
              </p>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Expansion Revenue</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(data.drivers.expansionRevenue)}
              </p>
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Churned Revenue</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(data.drivers.churnedRevenue)}
              </p>
            </div>
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Contraction Revenue</p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(data.drivers.contractionRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Subscription Intelligence Component
 * What subscription problems need attention?
 */
function SubscriptionIntelligence({ data }: { data: any }) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Subscription Intelligence</h2>
        <p className="text-sm text-gray-500 mt-1">
          What subscription problems need attention?
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Active Subscriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Active Subscriptions</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(data.activeSubscriptions.count)}
            </p>
            <p className={`text-sm font-medium ${
              data.activeSubscriptions.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(data.activeSubscriptions.changePercent)} vs last month
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Net MRR Change</p>
            <p className={`text-2xl font-bold mb-1 ${
              data.dynamics.netChange >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {formatCurrency(data.dynamics.netChange)}
            </p>
            <p className="text-sm text-gray-600">
              Expansion - Contraction
            </p>
          </div>
        </div>

        {/* Revenue at Risk - Schema Update Required */}
        {!data.revenueAtRisk.available && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 mb-1">Revenue at Risk - Pending Schema Update</p>
                <p className="text-sm text-yellow-700">
                  This metric requires FinancialLedgerEntry.metadata.subscriptionStatus field.
                  Tracked in governance backlog.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grace Aging Distribution - Schema Update Required */}
        {!data.graceAgingDistribution.available && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 mb-1">Grace Aging Distribution - Pending Schema Update</p>
                <p className="text-sm text-yellow-700">
                  This metric requires grace period aging tracking in schema.
                  Tracked in governance backlog.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Financial Operations Component
 * What operational issues threaten revenue realization?
 */
function FinancialOperations({ data, metricInsights }: { data: any, metricInsights?: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-50 border-green-200'
      case 'WARNING': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-5 w-5" />
      case 'WARNING': return <AlertTriangle className="h-5 w-5" />
      case 'CRITICAL': return <XCircle className="h-5 w-5" />
      default: return <Minus className="h-5 w-5" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Financial Operations Intelligence</h2>
        <p className="text-sm text-gray-500 mt-1">
          What operational issues threaten revenue realization?
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Phase 1.2D: Operations Insight Layer */}
        {metricInsights?.operations && (
          <InsightLayer insight={metricInsights.operations} />
        )}

        {/* Reconciliation Health */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Reconciliation Health</h3>
          <div className={`border-2 rounded-lg p-4 flex items-center space-x-3 ${getStatusColor(data.reconciliation.status)}`}>
            {getStatusIcon(data.reconciliation.status)}
            <div>
              <p className="font-semibold">{data.reconciliation.status}</p>
              <p className="text-sm">Financial reconciliation status</p>
            </div>
          </div>
          
          {!data.reconciliation.available && (
            <div className="mt-3 border border-yellow-200 bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                Detailed reconciliation metrics require schema update for reconciliationStatus field.
              </p>
            </div>
          )}
        </div>

        {/* Payment Operations */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Payment Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`border-2 rounded-lg p-4 ${getStatusColor(data.payments.successRateStatus)}`}>
              <p className="text-sm text-gray-600 mb-2">Payment Success Rate (30d)</p>
              <p className="text-2xl font-bold mb-1">{formatPercent(data.payments.successRate)}</p>
              <p className="text-sm">Target: ≥95%</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Failed Payment Impact</p>
              <p className="text-2xl font-bold text-red-700 mb-1">
                {formatCurrency(data.payments.revenueProtection.failedPaymentImpact)}
              </p>
              <p className="text-sm text-gray-600">Revenue at risk from payment failures</p>
            </div>
          </div>
        </div>

        {/* Provider Health */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Payment Provider Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`border-2 rounded-lg p-4 flex items-center space-x-3 ${getStatusColor(data.payments.providerHealth.mtn)}`}>
              {getStatusIcon(data.payments.providerHealth.mtn)}
              <div>
                <p className="font-semibold">MTN Mobile Money</p>
                <p className="text-sm">{data.payments.providerHealth.mtn}</p>
              </div>
            </div>
            <div className={`border-2 rounded-lg p-4 flex items-center space-x-3 ${getStatusColor(data.payments.providerHealth.airtel)}`}>
              {getStatusIcon(data.payments.providerHealth.airtel)}
              <div>
                <p className="font-semibold">Airtel Money</p>
                <p className="text-sm">{data.payments.providerHealth.airtel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Phase 1.2D: CFO Power Strip
 * 60-second executive summary
 */
function CfoPowerStrip({ insights, correlations }: { insights: CfoInsight[], correlations: SignalCorrelation[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600'
      case 'WARNING': return 'bg-orange-500'
      case 'INFO': return 'bg-blue-500'
      case 'POSITIVE': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-5 w-5" />
      case 'WARNING': return <AlertTriangle className="h-5 w-5" />
      case 'INFO': return <Activity className="h-5 w-5" />
      case 'POSITIVE': return <TrendingUp className="h-5 w-5" />
      default: return <Minus className="h-5 w-5" />
    }
  }

  // Get top 3 risks
  const risks = [...insights, ...correlations]
    .filter(item => item.severity === 'CRITICAL' || item.severity === 'WARNING')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)

  // Get top opportunity
  const opportunity = insights.find(item => item.severity === 'POSITIVE')

  // Get most urgent action
  const urgentAction = risks[0]

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold">CFO Power Strip</h2>
          <span className="text-xs text-gray-400">60-Second Executive Summary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top 3 Risks */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Top Risks Requiring Attention</h3>
            {risks.length === 0 ? (
              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <p className="text-sm text-green-200">No critical risks detected</p>
                </div>
              </div>
            ) : (
              risks.map((risk, index) => (
                <div key={index} className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-1.5 rounded ${getSeverityColor(risk.severity)}`}>
                      {getSeverityIcon(risk.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                          #{index + 1} {risk.severity}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">
                        {'title' in risk ? risk.title : risk.insight}
                      </h4>
                      <p className="text-xs text-gray-300 mb-2">
                        {'hypothesis' in risk ? risk.hypothesis : risk.rootCause}
                      </p>
                      <div className="bg-black bg-opacity-20 rounded p-2">
                        <p className="text-xs font-medium text-gray-200">
                          <span className="text-yellow-400">→</span> {risk.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Opportunity + Urgent Action */}
          <div className="space-y-3">
            {/* Top Opportunity */}
            {opportunity && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Top Opportunity</h3>
                <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-green-200 mb-1">{opportunity.insight}</h4>
                      <p className="text-xs text-green-300">{opportunity.action}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent Action */}
            {urgentAction && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Most Urgent Action</h3>
                <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-200 mb-1">IMMEDIATE</p>
                      <p className="text-xs text-red-300">{urgentAction.action}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
