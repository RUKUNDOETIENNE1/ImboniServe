/**
 * CEO Dashboard - Decision Intelligence System
 * 
 * Phase: 1.2B
 * Governance: KPI_CATALOG_V2.md, FINANCIAL_DATA_GOVERNANCE.md, TERMINOLOGY_STANDARD.md
 * Data Source: FinancialLedgerEntry (PRIMARY for all revenue metrics)
 * 
 * This is NOT a BI dashboard. This is a decision-making control panel.
 * 
 * Performance Target: <2s load (p95), <500ms refresh (p95)
 */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Users, DollarSign, Activity, Building2, ArrowUpRight, ArrowDownRight,
  Zap, Clock, AlertCircle, Info
} from 'lucide-react'

// Types
interface BusinessHealthData {
  score: number
  status: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
  trend: number // 7-day trend
  signals: {
    revenue: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    subscriptions: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    customers: 'HEALTHY' | 'WARNING' | 'CRITICAL'
    operations: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  }
}

interface RevenueData {
  mrr: number
  mrrChange: number // % change
  arr: number
  gmv: number
  gmvChange: number
  revenueGrowth7d: number
  revenueGrowth30d: number
  revenueAtRisk: number
  revenueAtRiskPercent: number
  topCustomerConcentration: number
  insight: string
}

interface CustomerData {
  healthDistribution: {
    excellent: number
    healthy: number
    atRisk: number
    critical: number
  }
  highValueDormant: number
  revenueChurnRate: number
  customerChurnRate: number
  retentionRate: number
  newCustomers: number
  returningCustomers: number
  riskSummary: {
    atRiskCount: number
    churnDrivers: string[]
    highValueLosses: number
  }
}

interface OperationsData {
  paymentHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  queueHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  reconciliationBacklog: number
  dlqCount: number
  providerFailureRate: number
  incidents24h: number
  bottleneck: string | null
}

interface HospitalityData {
  branches: Array<{
    id: string
    name: string
    healthScore: number
    revenue: number
    revenueChange: number
    customerCount: number
    rank: number
  }>
  opportunities: string[]
}

interface ExecutiveInsight {
  revenue: string
  customers: string
  operations: string
  risks: string[]
  opportunities: string[]
  generatedAt: string
}

interface CEODashboardData {
  businessHealth: BusinessHealthData
  revenue: RevenueData
  customers: CustomerData
  operations: OperationsData
  hospitality: HospitalityData
  executiveInsight: ExecutiveInsight
  loadTime: number
}

export default function CEODashboard() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  
  const [data, setData] = useState<CEODashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [loadTime, setLoadTime] = useState<number>(0)

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    const startTime = performance.now()
    
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/ceo')
      
      if (!response.ok) {
        throw new Error('Failed to fetch CEO dashboard data')
      }
      
      const dashboardData = await response.json()
      const endTime = performance.now()
      const loadTimeMs = endTime - startTime
      
      setData(dashboardData)
      setLoadTime(loadTimeMs)
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      console.error('CEO Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading CEO Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">Failed to load dashboard</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return null

  return (
    <DashboardLayout>
      <div className="max-w-[1920px] mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CEO Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()} • Load time: {loadTime.toFixed(0)}ms
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* 1. BUSINESS HEALTH OVERVIEW (GLOBAL HEADER) */}
        <BusinessHealthOverview data={data.businessHealth} />

        {/* EXECUTIVE INSIGHT STRIP (ALWAYS PRESENT) */}
        <ExecutiveInsightStrip insight={data.executiveInsight} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 2. REVENUE & GROWTH PANEL */}
          <RevenuePanel data={data.revenue} />

          {/* 3. CUSTOMER & RETENTION PANEL */}
          <CustomerPanel data={data.customers} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 4. OPERATIONS HEALTH PANEL */}
          <OperationsPanel data={data.operations} />

          {/* 5. HOSPITALITY PERFORMANCE PANEL */}
          <HospitalityPanel data={data.hospitality} />
        </div>
      </div>
    </DashboardLayout>
  )
}

// 1. Business Health Overview Component
function BusinessHealthOverview({ data }: { data: BusinessHealthData }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'bg-green-500'
      case 'HEALTHY': return 'bg-blue-500'
      case 'AT_RISK': return 'bg-yellow-500'
      case 'CRITICAL': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'HEALTHY': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'CRITICAL': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Health Score */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.score / 100)}`}
                  className={getStatusColor(data.status).replace('bg-', 'text-')}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{data.score}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Business Health</p>
              <p className={`text-2xl font-bold ${getStatusColor(data.status).replace('bg-', 'text-')}`}>
                {data.status}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {data.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${data.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.trend >= 0 ? '+' : ''}{data.trend.toFixed(1)}% (7d)
                </span>
              </div>
            </div>
          </div>

          {/* Health Signals */}
          <div className="grid grid-cols-4 gap-4 pl-6 border-l border-gray-200">
            <div className="flex items-center gap-2">
              {getSignalIcon(data.signals.revenue)}
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-sm font-medium text-gray-900">{data.signals.revenue}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSignalIcon(data.signals.subscriptions)}
              <div>
                <p className="text-xs text-gray-500">Subscriptions</p>
                <p className="text-sm font-medium text-gray-900">{data.signals.subscriptions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSignalIcon(data.signals.customers)}
              <div>
                <p className="text-xs text-gray-500">Customers</p>
                <p className="text-sm font-medium text-gray-900">{data.signals.customers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getSignalIcon(data.signals.operations)}
              <div>
                <p className="text-xs text-gray-500">Operations</p>
                <p className="text-sm font-medium text-gray-900">{data.signals.operations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Executive Insight Strip Component
function ExecutiveInsightStrip({ insight }: { insight: ExecutiveInsight }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
      <div className="flex items-start gap-4">
        <Zap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Revenue</p>
                <p className="text-gray-600">{insight.revenue}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Customers</p>
                <p className="text-gray-600">{insight.customers}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Operations</p>
                <p className="text-gray-600">{insight.operations}</p>
              </div>
            </div>
          </div>

          {insight.risks.length > 0 && (
            <div>
              <p className="font-medium text-red-700 mb-1">Key Risks</p>
              <ul className="text-sm text-red-600 space-y-1">
                {insight.risks.map((risk, idx) => (
                  <li key={idx}>• {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {insight.opportunities.length > 0 && (
            <div>
              <p className="font-medium text-green-700 mb-1">Key Opportunities</p>
              <ul className="text-sm text-green-600 space-y-1">
                {insight.opportunities.map((opp, idx) => (
                  <li key={idx}>• {opp}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Generated: {new Date(insight.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

// 2. Revenue & Growth Panel Component
function RevenuePanel({ data }: { data: RevenueData }) {
  const formatCurrency = (amount: number) => `RWF ${amount.toLocaleString()}`
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          Revenue & Growth
        </h2>
      </div>

      {/* Revenue Insight Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">{data.insight}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="MRR"
          value={formatCurrency(data.mrr)}
          change={data.mrrChange}
          trend={data.mrrChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="ARR"
          value={formatCurrency(data.arr)}
          change={data.mrrChange}
          trend={data.mrrChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="GMV"
          value={formatCurrency(data.gmv)}
          change={data.gmvChange}
          trend={data.gmvChange >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="Revenue at Risk"
          value={formatCurrency(data.revenueAtRisk)}
          subtitle={`${data.revenueAtRiskPercent.toFixed(1)}% of MRR`}
          alert={data.revenueAtRiskPercent > 15}
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">7-Day Growth</p>
          <p className={`text-2xl font-bold ${data.revenueGrowth7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(data.revenueGrowth7d)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">30-Day Growth</p>
          <p className={`text-2xl font-bold ${data.revenueGrowth30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(data.revenueGrowth30d)}
          </p>
        </div>
      </div>

      {/* Concentration Risk */}
      <div className={`rounded-lg p-4 ${data.topCustomerConcentration > 40 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Top 10 Customer Concentration</p>
            <p className="text-2xl font-bold text-gray-900">{data.topCustomerConcentration.toFixed(1)}%</p>
          </div>
          {data.topCustomerConcentration > 40 && (
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          )}
        </div>
      </div>
    </div>
  )
}

// 3. Customer & Retention Panel Component
function CustomerPanel({ data }: { data: CustomerData }) {
  const total = data.healthDistribution.excellent + data.healthDistribution.healthy + 
                data.healthDistribution.atRisk + data.healthDistribution.critical

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Customer & Retention
        </h2>
      </div>

      {/* Customer Risk Summary */}
      <div className={`rounded-lg p-4 mb-6 ${data.riskSummary.atRiskCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
        <h3 className="font-semibold text-gray-900 mb-2">Customer Risk Summary</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">
            <span className="font-medium">{data.riskSummary.atRiskCount}</span> customers at risk
          </p>
          {data.riskSummary.highValueLosses > 0 && (
            <p className="text-red-700 font-medium">
              {data.riskSummary.highValueLosses} high-value losses
            </p>
          )}
          {data.riskSummary.churnDrivers.length > 0 && (
            <div>
              <p className="font-medium text-gray-700">Churn Drivers:</p>
              <ul className="ml-4 space-y-1">
                {data.riskSummary.churnDrivers.map((driver, idx) => (
                  <li key={idx} className="text-gray-600">• {driver}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Health Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Health Distribution</h3>
        <div className="space-y-2">
          <HealthBar label="Excellent" count={data.healthDistribution.excellent} total={total} color="green" />
          <HealthBar label="Healthy" count={data.healthDistribution.healthy} total={total} color="blue" />
          <HealthBar label="At Risk" count={data.healthDistribution.atRisk} total={total} color="yellow" />
          <HealthBar label="Critical" count={data.healthDistribution.critical} total={total} color="red" />
        </div>
      </div>

      {/* Churn & Retention Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Revenue Churn Rate"
          value={`${data.revenueChurnRate.toFixed(1)}%`}
          alert={data.revenueChurnRate > 5}
        />
        <MetricCard
          label="Customer Churn Rate"
          value={`${data.customerChurnRate.toFixed(1)}%`}
          alert={data.customerChurnRate > 10}
        />
        <MetricCard
          label="Retention Rate"
          value={`${data.retentionRate.toFixed(1)}%`}
          alert={data.retentionRate < 80}
        />
        <MetricCard
          label="High-Value Dormant"
          value={data.highValueDormant.toString()}
          alert={data.highValueDormant > 5}
        />
      </div>

      {/* New vs Returning */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">New Customers</p>
          <p className="text-2xl font-bold text-gray-900">{data.newCustomers}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Returning Customers</p>
          <p className="text-2xl font-bold text-gray-900">{data.returningCustomers}</p>
        </div>
      </div>
    </div>
  )
}

// 4. Operations Health Panel Component
function OperationsPanel({ data }: { data: OperationsData }) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'text-green-600'
      case 'WARNING': return 'text-yellow-600'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthBg = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'bg-green-50'
      case 'WARNING': return 'bg-yellow-50'
      case 'CRITICAL': return 'bg-red-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-purple-600" />
          Operations Health
        </h2>
      </div>

      {/* Operational Bottleneck Detector */}
      {data.bottleneck && (
        <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Bottleneck Detected</p>
              <p className="text-sm text-red-700">{data.bottleneck}</p>
            </div>
          </div>
        </div>
      )}

      {/* System Health Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${getHealthBg(data.paymentHealth)}`}>
          <p className="text-sm text-gray-600 mb-1">Payment System</p>
          <p className={`text-xl font-bold ${getHealthColor(data.paymentHealth)}`}>
            {data.paymentHealth}
          </p>
        </div>
        <div className={`rounded-lg p-4 ${getHealthBg(data.queueHealth)}`}>
          <p className="text-sm text-gray-600 mb-1">Queue System</p>
          <p className={`text-xl font-bold ${getHealthColor(data.queueHealth)}`}>
            {data.queueHealth}
          </p>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Reconciliation Backlog"
          value={data.reconciliationBacklog.toString()}
          alert={data.reconciliationBacklog > 10}
        />
        <MetricCard
          label="DLQ Count"
          value={data.dlqCount.toString()}
          alert={data.dlqCount > 5}
        />
        <MetricCard
          label="Provider Failure Rate"
          value={`${data.providerFailureRate.toFixed(2)}%`}
          alert={data.providerFailureRate > 3}
        />
        <MetricCard
          label="Incidents (24h)"
          value={data.incidents24h.toString()}
          alert={data.incidents24h > 0}
        />
      </div>
    </div>
  )
}

// 5. Hospitality Performance Panel Component
function HospitalityPanel({ data }: { data: HospitalityData }) {
  const formatCurrency = (amount: number) => `RWF ${amount.toLocaleString()}`

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-indigo-600" />
          Hospitality Performance
        </h2>
      </div>

      {/* Hospitality Opportunity Finder */}
      {data.opportunities.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">Opportunities Identified</h3>
          <ul className="text-sm text-green-700 space-y-1">
            {data.opportunities.map((opp, idx) => (
              <li key={idx}>• {opp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Branch Ranking */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Branch Health Score Ranking</h3>
        {data.branches.slice(0, 5).map((branch) => (
          <div key={branch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                branch.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                branch.rank === 2 ? 'bg-gray-200 text-gray-700' :
                branch.rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {branch.rank}
              </div>
              <div>
                <p className="font-medium text-gray-900">{branch.name}</p>
                <p className="text-sm text-gray-600">{branch.customerCount} customers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(branch.revenue)}</p>
              <div className="flex items-center gap-1 justify-end">
                {branch.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${branch.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {branch.revenueChange >= 0 ? '+' : ''}{branch.revenueChange.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Score: {branch.healthScore}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility Components
function MetricCard({ 
  label, 
  value, 
  change, 
  trend, 
  subtitle,
  alert 
}: { 
  label: string
  value: string
  change?: number
  trend?: 'up' | 'down'
  subtitle?: string
  alert?: boolean
}) {
  return (
    <div className={`rounded-lg p-4 ${alert ? 'bg-red-50' : 'bg-gray-50'}`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {change !== undefined && trend && (
        <div className="flex items-center gap-1 mt-1">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

function HealthBar({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string
  count: number
  total: number
  color: 'green' | 'blue' | 'yellow' | 'red'
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
