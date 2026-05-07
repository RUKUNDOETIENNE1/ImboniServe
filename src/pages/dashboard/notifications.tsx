import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Bell, Clock, Send, Save } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const TIMEZONES = [
  'Africa/Kigali', 'Africa/Nairobi', 'Africa/Lagos', 'Africa/Cairo',
  'Africa/Johannesburg', 'Africa/Accra', 'Europe/London', 'Europe/Paris',
  'Asia/Dubai', 'America/New_York', 'America/Los_Angeles', 'UTC',
]

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
    />
  )
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    dailyReportEnabled: true,
    dailyReportLocalTime: '07:30',
    timezone: 'Africa/Kigali',
    whatsappOwnerReportsEnabled: true,
    whatsappClientSlipsEnabled: false,
    whatsappDailyCapClient: 50,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingNow, setSendingNow] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then(d => { if (d) setSettings(prev => ({ ...prev, ...d })) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) setMessage({ text: t('notifications.settings_saved_success'), type: 'success' })
      else setMessage({ text: t('notifications.settings_saved_error'), type: 'error' })
    } catch { setMessage({ text: t('notifications.network_error'), type: 'error' }) } finally { setSaving(false) }
  }

  async function sendNow() {
    setSendingNow(true)
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/reports/send-now', { method: 'POST' })
      if (res.ok) setMessage({ text: t('notifications.daily_report_sent'), type: 'success' })
      else setMessage({ text: t('notifications.failed_to_send_report'), type: 'error' })
    } catch { setMessage({ text: t('notifications.network_error'), type: 'error' }) } finally { setSendingNow(false) }
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{t('notifications.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5" suppressHydrationWarning>{t('notifications.subtitle')}</p>
          </div>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Daily Report Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2" suppressHydrationWarning>
              <Clock className="w-4 h-4" /> {t('notifications.daily_report')}
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dailyReportEnabled}
                  onChange={e => setSettings(p => ({ ...p, dailyReportEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700" suppressHydrationWarning>{t('notifications.enable_daily_summary')}</p>
                  <p className="text-xs text-slate-500" suppressHydrationWarning>{t('notifications.enable_daily_summary_desc')}</p>
                </div>
              </label>

              {settings.dailyReportEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('notifications.send_time_local')}</label>
                    <TimeInput value={settings.dailyReportLocalTime} onChange={v => setSettings(p => ({ ...p, dailyReportLocalTime: v }))} />
                    <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>{t('notifications.report_covers_previous_day')}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('notifications.timezone')}</label>
                    <select
                      value={settings.timezone}
                      onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={sendNow}
                  disabled={sendingNow}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span suppressHydrationWarning>{sendingNow ? t('notifications.sending') : t('notifications.send_now')}</span>
                </button>
                <p className="text-xs text-slate-400" suppressHydrationWarning>{t('notifications.send_today_report')}</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4" suppressHydrationWarning>{t('notifications.whatsapp_notifications')}</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappOwnerReportsEnabled}
                  onChange={e => setSettings(p => ({ ...p, whatsappOwnerReportsEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700" suppressHydrationWarning>{t('notifications.owner_report_notifications')}</p>
                  <p className="text-xs text-slate-500" suppressHydrationWarning>{t('notifications.owner_report_notifications_desc')}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappClientSlipsEnabled}
                  onChange={e => setSettings(p => ({ ...p, whatsappClientSlipsEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-medium text-slate-700" suppressHydrationWarning>{t('notifications.client_smart_dining_slip')}</p>
                  <p className="text-xs text-slate-500" suppressHydrationWarning>{t('notifications.client_smart_dining_slip_desc')}</p>
                </div>
              </label>
              {settings.whatsappClientSlipsEnabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5" suppressHydrationWarning>{t('notifications.daily_cap_client_messages')}</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={settings.whatsappDailyCapClient}
                    onChange={e => setSettings(p => ({ ...p, whatsappDailyCapClient: Number(e.target.value) }))}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-imboni-blue text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              <span suppressHydrationWarning>{saving ? t('notifications.saving') : t('notifications.save_settings')}</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
