import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Bell, BellOff, Save } from 'lucide-react'

export default function CmsSettingsPage() {
  const [cmsNotifyTrending, setCmsNotifyTrending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/cms/notifications/settings')
      .then((r) => r.json())
      .then((d) => {
        setCmsNotifyTrending(d.cmsNotifyTrending ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/cms/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmsNotifyTrending }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setMessage({ type: 'success', text: 'Settings saved.' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">CMS Settings</h1>
        <p className="text-slate-500 text-sm mb-8">Configure notifications and preferences for your content.</p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            {/* Trending Notifications */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${cmsNotifyTrending ? 'bg-purple-100' : 'bg-slate-100'}`}>
                  {cmsNotifyTrending ? (
                    <Bell className="w-5 h-5 text-purple-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">Trending Post Notifications</div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Receive a WhatsApp message when one of your posts is trending on the discovery feed
                    (20+ engagements in 1 hour). Requires your business phone to be set.
                  </p>
                  <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Default: Off
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCmsNotifyTrending((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  cmsNotifyTrending ? 'bg-purple-600' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={cmsNotifyTrending}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
                    cmsNotifyTrending ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <hr className="border-slate-100" />

            {message && (
              <div
                className={`text-sm px-4 py-3 rounded-xl ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
