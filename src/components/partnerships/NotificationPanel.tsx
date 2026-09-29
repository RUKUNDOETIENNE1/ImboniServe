import { Mail, Send, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'

interface NotificationPanelProps {
  canManage: boolean
  onAction: (action: string, data?: Record<string, unknown>) => void
  notificationsSent: string[]
}

const NOTIFICATION_TYPES = [
  { key: 'welcome', label: 'Welcome Email', description: 'Onboarding welcome message' },
  { key: 'agreementReady', label: 'Agreement Ready', description: 'Notify partner to sign agreement' },
  { key: 'codesGenerated', label: 'Codes Generated', description: 'Inform partner of new codes' },
  { key: 'campaignReady', label: 'Campaign Ready', description: 'Campaign has been set up' },
  { key: 'partnerActivated', label: 'Partner Activated', description: 'Final activation confirmation' },
]

export default function NotificationPanel({ canManage, onAction, notificationsSent }: NotificationPanelProps) {
  const [sending, setSending] = useState<string | null>(null)

  const handleSend = (type: string) => {
    setSending(type)
    onAction('sendNotification', { notificationType: type })
    setTimeout(() => setSending(null), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          <p className="text-xs text-slate-500">Trigger partner notifications</p>
        </div>
      </div>

      <div className="space-y-2">
        {NOTIFICATION_TYPES.map((notif) => {
          const isSent = notificationsSent.includes(notif.key)
          const isSending = sending === notif.key

          return (
            <div
              key={notif.key}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">{notif.label}</p>
                <p className="text-xs text-slate-500">{notif.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSent ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Sent
                  </span>
                ) : isSending ? (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Sending...
                  </span>
                ) : canManage ? (
                  <button
                    onClick={() => handleSend(notif.key)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
