import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ConfirmModal from '@/components/ConfirmModal'
import { ShieldCheck, Monitor, Clock, Trash2, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n'

interface SessionInfo {
  id: string
  expiresAt: string
  createdAt: string
  tokenPrefix: string
}

interface SecurityEvent {
  id: string
  eventType: string
  ip: string | null
  userAgent: string | null
  metadata: any
  createdAt: string
}

const getEventLabels = (t: any): Record<string, { label: string; color: string; icon: typeof CheckCircle }> => ({
  LOGIN_SUCCESS:        { label: t('security.login_successful'),       color: 'text-green-600',  icon: CheckCircle },
  LOGIN_FAILED:         { label: t('security.login_failed'),           color: 'text-red-600',    icon: XCircle },
  MFA_OTP_SENT:         { label: t('security.verification_code_sent'), color: 'text-blue-600',   icon: ShieldCheck },
  MFA_OTP_VERIFIED:     { label: t('security.code_verified'),          color: 'text-green-600',  icon: CheckCircle },
  MFA_OTP_FAILED:       { label: t('security.wrong_code'),             color: 'text-orange-600', icon: AlertTriangle },
  MFA_OTP_EXPIRED:      { label: t('security.code_expired'),           color: 'text-gray-500',   icon: Clock },
  SESSION_REVOKED:      { label: t('security.session_revoked'),        color: 'text-purple-600', icon: Trash2 },
  NEW_DEVICE_DETECTED:  { label: t('security.new_device'),              color: 'text-orange-600', icon: Monitor },
  BRUTE_FORCE_DETECTED: { label: t('security.brute_force'),            color: 'text-red-700',    icon: AlertTriangle },
})

function formatRelative(dateStr: string, t: any): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t('security.just_now')
  if (m < 60) return `${m}${t('security.minutes_ago')}`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}${t('security.hours_ago')}`
  return `${Math.floor(h / 24)}${t('security.days_ago')}`
}

export default function SecurityPage() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessRes, evtRes] = await Promise.all([
        fetch('/api/auth/sessions'),
        fetch('/api/auth/security-events'),
      ])
      if (sessRes.ok) {
        const d = await sessRes.json()
        setSessions(d.sessions || [])
        setEvents(d.recentEvents || [])
      }
      if (evtRes.ok) {
        const d = await evtRes.json()
        setEvents(d.events || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const revokeSession = async (id: string) => {
    setRevoking(id)
    try {
      const res = await fetch(`/api/auth/sessions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(t('security.session_revoked_success'))
        setSessions(prev => prev.filter(s => s.id !== id))
      } else {
        toast.error(t('security.failed_to_revoke'))
      }
    } finally {
      setRevoking(null)
    }
  }

  const revokeAll = async () => {
    setRevoking('all')
    try {
      const res = await fetch('/api/auth/sessions?all=true', { method: 'DELETE' })
      if (res.ok) {
        const d = await res.json()
        toast.success(`${d.revokedCount} ${t('security.sessions_revoked_success')}`)
        setSessions([])
      } else {
        toast.error(t('security.failed_to_revoke'))
      }
    } finally {
      setRevoking(null)
      setShowRevokeAllConfirm(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900" suppressHydrationWarning>{t('security.title')}</h1>
              <p className="text-slate-500 text-sm" suppressHydrationWarning>{t('security.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span suppressHydrationWarning>{t('security.refresh')}</span>
          </button>
        </div>

        {/* MFA Status Banner */}
        <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800" suppressHydrationWarning>{t('security.two_factor_active')}</p>
            <p className="text-sm text-green-700 mt-0.5" suppressHydrationWarning>
              {t('security.two_factor_desc')}
            </p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900" suppressHydrationWarning>{t('security.active_sessions')}</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sessions.length}
              </span>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={() => setShowRevokeAllConfirm(true)}
                disabled={revoking === 'all'}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span suppressHydrationWarning>{t('security.revoke_all')}</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400" suppressHydrationWarning>{t('security.loading_sessions')}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-slate-400" suppressHydrationWarning>{t('security.no_sessions')}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900" suppressHydrationWarning>
                        {t('security.session')} {i + 1}
                        {i === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded" suppressHydrationWarning>
                            {t('security.current')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500" suppressHydrationWarning>
                        {t('security.token')}: {s.tokenPrefix} · {t('security.expires')} {formatRelative(s.expiresAt, t)}
                      </p>
                      <p className="text-xs text-slate-400" suppressHydrationWarning>
                        {t('security.created')} {formatRelative(s.createdAt, t)}
                      </p>
                    </div>
                  </div>
                  {i !== 0 && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={revoking === s.id}
                      className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition"
                    >
                      {revoking === s.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span suppressHydrationWarning>{t('security.revoke')}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
            <Clock className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900" suppressHydrationWarning>{t('security.recent_activity')}</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400" suppressHydrationWarning>{t('security.loading_activity')}</div>
          ) : events.length === 0 ? (
            <div className="p-6 text-center text-slate-400" suppressHydrationWarning>{t('security.no_activity')}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map(ev => {
                const EVENT_LABELS = getEventLabels(t)
                const config = EVENT_LABELS[ev.eventType] || {
                  label: ev.eventType.replace(/_/g, ' ').toLowerCase(),
                  color: 'text-slate-600',
                  icon: ShieldCheck,
                }
                const Icon = config.icon
                return (
                  <div key={ev.id} className="flex items-start gap-4 px-6 py-4">
                    <div className="mt-0.5">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {ev.ip && (
                          <span className="text-xs text-slate-400" suppressHydrationWarning>{t('security.ip')}: {ev.ip}</span>
                        )}
                        {ev.metadata && typeof ev.metadata === 'object' && (ev.metadata as any).channel && (
                          <span className="text-xs text-slate-400" suppressHydrationWarning>
                            {t('security.via')} {(ev.metadata as any).channel}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap" suppressHydrationWarning>
                      {formatRelative(ev.createdAt, t)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span suppressHydrationWarning>{t('security.security_tips')}</span>
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li suppressHydrationWarning>• {t('security.tip_1')}</li>
            <li suppressHydrationWarning>• {t('security.tip_2')}</li>
            <li suppressHydrationWarning>• {t('security.tip_3')}</li>
            <li suppressHydrationWarning>• {t('security.tip_4')}</li>
          </ul>
        </div>
      </div>

      {/* Revoke All Confirmation Modal */}
      <ConfirmModal
        isOpen={showRevokeAllConfirm}
        onClose={() => setShowRevokeAllConfirm(false)}
        onConfirm={revokeAll}
        title={t('security.revoke_all')}
        message={t('security.revoke_confirm')}
        confirmText={t('security.revoke_all')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
      />
    </DashboardLayout>
  )
}
