import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users,
  Activity,
  Shield,
  Download
} from 'lucide-react'

interface PayoutQueueItem {
  id: string
  marketerId: string
  amountCents: number
  currency: string
  method: string
  status: string
  createdAt: string
  marketer: {
    id: string
    name: string
    email: string
    riskProfile: {
      riskScore: number
      riskLevel: string
      flags: string[]
    }
  }
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

interface Alert {
  id: string
  severity: string
  type: string
  message: string
  entityType: string
  entityId: string
  acknowledged: boolean
  createdAt: string
}

interface Event {
  id: string
  type: string
  entityType: string
  entityId: string
  payload: any
  createdAt: string
}

export default function PayoutControl() {
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<PayoutQueueItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [marketers, setMarketers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'queue' | 'alerts' | 'events' | 'marketers'>('queue')
  const [processing, setProcessing] = useState<string | null>(null)

  const [stats, setStats] = useState({
    pendingPayouts: 0,
    pendingAmount: 0,
    criticalAlerts: 0,
    highRiskMarketers: 0
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const userRoles = (session?.user as any)?.roles || []
      if (!userRoles.includes('ADMIN')) {
        router.push('/dashboard')
        return
      }
      fetchAll()
    }
  }, [status, session])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [queueRes, alertsRes, eventsRes, marketersRes] = await Promise.all([
        fetch('/api/admin/payout/queue?limit=50'),
        fetch('/api/admin/revenue/alerts?acknowledged=false&limit=50'),
        fetch('/api/admin/revenue/events?limit=100'),
        fetch('/api/admin/marketers?limit=50')
      ])

      if (queueRes.ok) {
        const data = await queueRes.json()
        setQueue(data.payouts || [])
        const pendingAmount = (data.payouts || []).reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0)
        setStats(prev => ({ ...prev, pendingPayouts: data.payouts?.length || 0, pendingAmount }))
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.alerts || [])
        const critical = (data.alerts || []).filter((a: Alert) => a.severity === 'CRITICAL').length
        setStats(prev => ({ ...prev, criticalAlerts: critical }))
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }

      if (marketersRes.ok) {
        const data = await marketersRes.json()
        setMarketers(data.marketers || [])
        const highRisk = (data.marketers || []).filter((m: any) => 
          m.riskProfile?.riskLevel === 'HIGH' || m.riskProfile?.riskLevel === 'CRITICAL'
        ).length
        setStats(prev => ({ ...prev, highRiskMarketers: highRisk }))
      }
    } catch (e) {
      showToast('error', t('admin.payout_control.load_failed', 'Failed to load data'))
    } finally {
      setLoading(false)
    }
  }

  const exportMarketers = async () => {
    try {
      const res = await fetch('/api/admin/export/marketers')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `marketers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('admin.export_success', 'Export downloaded'))
      } else {
        showToast('error', t('admin.export_failed', 'Export failed'))
      }
    } catch {
      showToast('error', t('admin.export_failed', 'Export failed'))
    }
  }

  const exportEvents = async () => {
    try {
      const res = await fetch('/api/admin/export/events')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-events-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('success', t('admin.export_success', 'Export downloaded'))
      } else {
        showToast('error', t('admin.export_failed', 'Export failed'))
      }
    } catch {
      showToast('error', t('admin.export_failed', 'Export failed'))
    }
  }

  const approvePayout = async (payoutId: string) => {
    setProcessing(payoutId)
    try {
      const res = await fetch(`/api/admin/payout/${payoutId}/approve`, { method: 'POST' })
      if (res.ok) {
        showToast('success', t('admin.payout_control.approved', 'Payout approved'))
        fetchAll()
      } else {
        const body = await res.json()
        showToast('error', body?.error || t('admin.payout_control.approve_failed', 'Failed to approve'))
      }
    } catch (e) {
      showToast('error', t('admin.payout_control.approve_failed', 'Failed to approve'))
    } finally {
      setProcessing(null)
    }
  }

  const rejectPayout = async (payoutId: string) => {
    const reason = prompt(t('admin.payout_control.reject_reason', 'Rejection reason:'))
    if (!reason) return

    setProcessing(payoutId)
    try {
      const res = await fetch(`/api/admin/payout/${payoutId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        showToast('success', t('admin.payout_control.rejected', 'Payout rejected'))
        fetchAll()
      } else {
        const body = await res.json()
        showToast('error', body?.error || t('admin.payout_control.reject_failed', 'Failed to reject'))
      }
    } catch (e) {
      showToast('error', t('admin.payout_control.reject_failed', 'Failed to reject'))
    } finally {
      setProcessing(null)
    }
  }

  const suspendMarketer = async (marketerId: string, name: string) => {
    const reason = prompt(t('admin.payout_control.suspend_reason', `Suspend ${name}? Reason:`))
    if (!reason) return

    try {
      const res = await fetch(`/api/admin/marketers/${marketerId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        showToast('success', t('admin.payout_control.suspended', 'Marketer suspended'))
        fetchAll()
      } else {
        const body = await res.json()
        showToast('error', body?.error || t('admin.payout_control.suspend_failed', 'Failed to suspend'))
      }
    } catch (e) {
      showToast('error', t('admin.payout_control.suspend_failed', 'Failed to suspend'))
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300'
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-green-100 text-green-700 border-green-300'
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('admin.payout_control.title', 'Payout Control Center')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('admin.payout_control.subtitle', 'Manage marketer payouts and monitor revenue operations')}</p>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-600">{t('common.loading', 'Loading...')}</div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('admin.payout_control.pending_payouts', 'Pending Payouts')}</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.pendingPayouts}</div>
              <div className="text-xs text-slate-500 mt-1">
                <CurrencyDisplay amount={stats.pendingAmount} inCents />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('admin.payout_control.critical_alerts', 'Critical Alerts')}</span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.criticalAlerts}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('admin.payout_control.high_risk', 'High Risk Marketers')}</span>
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.highRiskMarketers}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{t('admin.payout_control.total_marketers', 'Total Marketers')}</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{marketers.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'queue'
                      ? 'bg-imboni-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('admin.payout_control.payout_queue', 'Payout Queue')}
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'alerts'
                      ? 'bg-imboni-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('admin.payout_control.alerts', 'Alerts')}
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'events'
                      ? 'bg-imboni-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('admin.payout_control.event_stream', 'Event Stream')}
                </button>
                <button
                  onClick={() => setActiveTab('marketers')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'marketers'
                      ? 'bg-imboni-blue text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('admin.payout_control.marketers', 'Marketers')}
                </button>
              </div>
              {(activeTab === 'events' || activeTab === 'marketers') && (
                <div className="ml-auto">
                  <button 
                    onClick={activeTab === 'events' ? exportEvents : exportMarketers}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-imboni-blue hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {t('common.export_csv', 'Export CSV')}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {activeTab === 'queue' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                        <th className="py-3 pr-4">{t('common.marketer', 'Marketer')}</th>
                        <th className="py-3 pr-4">{t('common.amount', 'Amount')}</th>
                        <th className="py-3 pr-4">{t('common.method', 'Method')}</th>
                        <th className="py-3 pr-4">{t('common.risk', 'Risk')}</th>
                        <th className="py-3 pr-4">{t('common.requested', 'Requested')}</th>
                        <th className="py-3">{t('common.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((payout) => (
                        <tr key={payout.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-slate-800">{payout.marketer.name}</div>
                            <div className="text-xs text-slate-500">{payout.marketer.email}</div>
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-900">
                            <CurrencyDisplay amount={payout.amountCents} inCents />
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{payout.method.replace(/_/g, ' ')}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs border ${getRiskColor(payout.marketer.riskProfile?.riskLevel || 'LOW')}`}>
                              {payout.marketer.riskProfile?.riskLevel || 'LOW'} ({payout.marketer.riskProfile?.riskScore || 0})
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-600 text-sm">
                            {new Date(payout.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => approvePayout(payout.id)}
                                disabled={processing === payout.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {t('common.approve', 'Approve')}
                              </button>
                              <button
                                onClick={() => rejectPayout(payout.id)}
                                disabled={processing === payout.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                {t('common.reject', 'Reject')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {queue.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            {t('admin.payout_control.no_pending', 'No pending payouts')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-xl p-4 ${
                        alert.severity === 'CRITICAL'
                          ? 'border-red-300 bg-red-50'
                          : alert.severity === 'WARNING'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-blue-300 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${
                              alert.severity === 'CRITICAL' ? 'text-red-600' : alert.severity === 'WARNING' ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : alert.severity === 'WARNING' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-slate-500">{alert.type}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{alert.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center text-slate-500 py-8">{t('admin.payout_control.no_alerts', 'No active alerts')}</div>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 border border-slate-100 rounded-lg p-3 hover:bg-slate-50">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 text-sm">{event.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-slate-500">• {event.entityType}</span>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center text-slate-500 py-8">{t('admin.payout_control.no_events', 'No recent events')}</div>
                  )}
                </div>
              )}

              {activeTab === 'marketers' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                        <th className="py-3 pr-4">{t('common.name', 'Name')}</th>
                        <th className="py-3 pr-4">{t('common.email', 'Email')}</th>
                        <th className="py-3 pr-4">{t('common.status', 'Status')}</th>
                        <th className="py-3 pr-4">{t('common.risk', 'Risk')}</th>
                        <th className="py-3 pr-4">{t('common.businesses', 'Businesses')}</th>
                        <th className="py-3">{t('common.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketers.map((marketer) => (
                        <tr key={marketer.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-800">{marketer.name}</td>
                          <td className="py-3 pr-4 text-slate-600">{marketer.email}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              marketer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {marketer.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs border ${getRiskColor(marketer.riskProfile?.riskLevel || 'LOW')}`}>
                              {marketer.riskProfile?.riskLevel || 'LOW'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{marketer._count?.referredBusinesses || 0}</td>
                          <td className="py-3">
                            {marketer.status === 'ACTIVE' && (
                              <button
                                onClick={() => suspendMarketer(marketer.id, marketer.name)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                {t('common.suspend', 'Suspend')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {marketers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            {t('admin.payout_control.no_marketers', 'No marketers found')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
