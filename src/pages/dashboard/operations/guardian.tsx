/**
 * Guardian Dashboard
 *
 * Real-time view of active Guardian protection cases, metrics, and outcomes.
 * Auto-refreshes every 30 seconds.
 */

import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import {
  ShieldCheck, ShieldAlert, ShieldX, Activity, Clock, RefreshCw,
  TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle,
  Bell, MessageSquare, Zap, Eye, ChevronRight
} from 'lucide-react'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)

  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const roles: string[] = (session.user as any).roles || []
  if (!roles.some(r => ALLOWED_ROLES.has(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  return {
    props: {
      businessId: (session.user as any).businessId || '',
      timezone: (session.user as any).timezone || 'Africa/Kigali',
    },
  }
}

interface GuardianPageProps {
  businessId: string
  timezone: string
}

interface GuardianMetrics {
  active: number
  today: {
    total: number
    protected: number
    breached: number
    recoveredNaturally: number
    falsePositive: number
    interventions: number
    protectionRate: number
  }
}

interface GuardianCase {
  id: string
  caseType: string
  state: string
  outcome: string | null
  triggerSignal: string
  triggerState: string
  triggerElapsedMinutes: number
  decisionLevel: string | null
  decisionReasoning: string | null
  assignedRole: string | null
  interventionCount: number
  lastNotificationChannel: string | null
  detectedAt: string
  resolvedAt: string | null
  promise: {
    state: string
    startedAt: string
    expectedAt: string
    warningAfterMinutes: number
    breachAfterMinutes: number
  }
  sale: {
    orderNumber: string
    status: string
    kitchenStatus: string | null
    table?: { number: string } | null
  }
  assignedUser: {
    id: string
    name: string
    phone: string | null
  } | null
  interventions: Array<{
    id: string
    interventionType: string
    channel: string
    recipient: string | null
    result: string
    dispatchedAt: string
  }>
}

const STATE_COLORS: Record<string, string> = {
  DETECTED: 'bg-blue-100 text-blue-700',
  UNDERSTANDING: 'bg-indigo-100 text-indigo-700',
  DECISION: 'bg-purple-100 text-purple-700',
  INTERVENTION_PENDING: 'bg-amber-100 text-amber-700',
  INTERVENED: 'bg-orange-100 text-orange-700',
  VERIFYING: 'bg-cyan-100 text-cyan-700',
  RESOLVED: 'bg-green-100 text-green-700',
  BREACHED: 'bg-red-100 text-red-700',
  CLEARED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const OUTCOME_ICONS: Record<string, any> = {
  PROTECTED_BY_GUARDIAN: CheckCircle,
  RECOVERED_NATURALLY: TrendingUp,
  BREACHED: XCircle,
  INTERVENTION_FAILED: ShieldX,
  FALSE_POSITIVE: Eye,
  UNKNOWN: Activity,
}

const DECISION_LEVEL_COLORS: Record<string, string> = {
  OBSERVE: 'text-gray-500',
  RECOMMEND: 'text-blue-600',
  ALERT: 'text-amber-600',
  ESCALATE: 'text-red-600',
}

export default function GuardianPage({ businessId, timezone }: GuardianPageProps) {
  const { t } = useTranslation()
  const [cases, setCases] = useState<GuardianCase[]>([])
  const [metrics, setMetrics] = useState<GuardianMetrics | null>(null)
  const [mode, setMode] = useState<string>('OFF')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCase, setSelectedCase] = useState<GuardianCase | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/guardian')
      if (!res.ok) throw new Error('Failed to fetch Guardian data')
      const data = await res.json()
      setCases(data.cases || [])
      setMetrics(data.metrics || null)
      setMode(data.mode || 'OFF')
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load Guardian data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleAcknowledge = async (caseId: string) => {
    try {
      const res = await fetch(`/api/guardian/${caseId}/acknowledge`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to acknowledge')
      await fetchData(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone })
  }

  const formatElapsed = (startedAt: string) => {
    const mins = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-indigo-600" />
              Guardian
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Service promise protection intelligence layer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              mode === 'ASSIST' ? 'bg-green-100 text-green-700' :
              mode === 'SHADOW' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {mode === 'ASSIST' && <Zap className="w-3 h-3 inline mr-1" />}
              {mode === 'SHADOW' && <Eye className="w-3 h-3 inline mr-1" />}
              {mode === 'OFF' && <ShieldX className="w-3 h-3 inline mr-1" />}
              {mode} MODE
            </div>
            <button
              onClick={() => fetchData(true)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-5 h-5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <MetricCard
              label="Active Cases"
              value={metrics.active}
              icon={Activity}
              color="bg-blue-50 text-blue-700"
            />
            <MetricCard
              label="Total Today"
              value={metrics.today.total}
              icon={ShieldCheck}
              color="bg-indigo-50 text-indigo-700"
            />
            <MetricCard
              label="Protected"
              value={metrics.today.protected}
              icon={CheckCircle}
              color="bg-green-50 text-green-700"
            />
            <MetricCard
              label="Breached"
              value={metrics.today.breached}
              icon={XCircle}
              color="bg-red-50 text-red-700"
            />
            <MetricCard
              label="Interventions"
              value={metrics.today.interventions}
              icon={Bell}
              color="bg-amber-50 text-amber-700"
            />
            <MetricCard
              label="Protection Rate"
              value={`${metrics.today.protectionRate}%`}
              icon={TrendingUp}
              color="bg-emerald-50 text-emerald-700"
            />
          </div>
        )}

        {/* Active Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Active Protection Cases</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {cases.length} active case{cases.length !== 1 ? 's' : ''} being monitored
            </p>
          </div>

          {cases.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">All clear</p>
              <p className="text-sm text-slate-400 mt-1">No active Guardian cases — service promises are on track</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cases.map((c) => {
                const OutcomeIcon = c.outcome ? OUTCOME_ICONS[c.outcome] || Activity : null
                return (
                  <div
                    key={c.id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCase(c)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${STATE_COLORS[c.state] || 'bg-gray-100 text-gray-600'}`}>
                          {c.state.replace(/_/g, ' ')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900">#{c.sale?.orderNumber || 'Unknown'}</span>
                            {c.sale?.table?.number && (
                              <span className="text-xs text-slate-500">Table {c.sale.table.number}</span>
                            )}
                            <span className="text-xs text-slate-400">
                              <Clock className="w-3 h-3 inline mr-0.5" />
                              {formatElapsed(c.promise.startedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {c.decisionReasoning || c.triggerSignal.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {c.decisionLevel && (
                              <span className={`text-xs font-medium ${DECISION_LEVEL_COLORS[c.decisionLevel] || 'text-gray-500'}`}>
                                {c.decisionLevel}
                              </span>
                            )}
                            {c.interventionCount > 0 && (
                              <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                <Bell className="w-3 h-3" />
                                {c.interventionCount} intervention{c.interventionCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {c.assignedUser && (
                              <span className="text-xs text-slate-500">
                                → {c.assignedUser.name}
                              </span>
                            )}
                            {c.lastNotificationChannel && (
                              <span className="text-xs text-slate-400">
                                <MessageSquare className="w-3 h-3 inline mr-0.5" />
                                {c.lastNotificationChannel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Case Details</h3>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATE_COLORS[selectedCase.state] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedCase.state.replace(/_/g, ' ')}
                </span>
                {selectedCase.decisionLevel && (
                  <span className={`text-xs font-medium ${DECISION_LEVEL_COLORS[selectedCase.decisionLevel] || 'text-gray-500'}`}>
                    {selectedCase.decisionLevel}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Detected at {formatTime(selectedCase.detectedAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Order</span>
                  <p className="font-medium text-slate-900">#{selectedCase.sale?.orderNumber || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Table</span>
                  <p className="font-medium text-slate-900">{selectedCase.sale?.table?.number || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Promise State</span>
                  <p className="font-medium text-slate-900">{selectedCase.promise.state}</p>
                </div>
                <div>
                  <span className="text-slate-500">Elapsed</span>
                  <p className="font-medium text-slate-900">{formatElapsed(selectedCase.promise.startedAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Warning at</span>
                  <p className="font-medium text-slate-900">{selectedCase.promise.warningAfterMinutes}min</p>
                </div>
                <div>
                  <span className="text-slate-500">Breach at</span>
                  <p className="font-medium text-slate-900">{selectedCase.promise.breachAfterMinutes}min</p>
                </div>
              </div>

              {selectedCase.decisionReasoning && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Decision Reasoning</p>
                  <p className="text-sm text-slate-700">{selectedCase.decisionReasoning}</p>
                </div>
              )}

              {selectedCase.assignedUser && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-500 mb-1">Assigned to</p>
                  <p className="text-sm text-indigo-900 font-medium">
                    {selectedCase.assignedUser.name}
                    {selectedCase.assignedRole && ` (${selectedCase.assignedRole})`}
                  </p>
                </div>
              )}

              {selectedCase.interventions && selectedCase.interventions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Intervention History</p>
                  <div className="space-y-2">
                    {selectedCase.interventions.map((iv) => (
                      <div key={iv.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span className="text-slate-700">{iv.interventionType.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-slate-400">via {iv.channel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${iv.result === 'DELIVERED' ? 'text-green-600' : 'text-red-600'}`}>
                            {iv.result}
                          </span>
                          <span className="text-xs text-slate-400">{formatTime(iv.dispatchedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedCase.state === 'INTERVENED' || selectedCase.state === 'INTERVENTION_PENDING') && (
                <button
                  onClick={() => {
                    handleAcknowledge(selectedCase.id)
                    setSelectedCase(null)
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Acknowledge Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: any
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
