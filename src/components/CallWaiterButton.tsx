import { useState } from 'react'
import { Bell, X, Droplet, HelpCircle, DollarSign, MessageSquare } from 'lucide-react'
import { outboxService } from '@/lib/services/outbox.service'

interface CallWaiterButtonProps {
  tableId: string
  sessionId?: string
  className?: string
}

type WaiterReason = 'water' | 'assistance' | 'bill' | 'other'

export default function CallWaiterButton({ tableId, sessionId, className = '' }: CallWaiterButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState<WaiterReason>('assistance')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  async function handleCallWaiter() {
    if (!reason) return

    setSending(true)

    const callData = {
      tableId,
      sessionId: sessionId || null,
      reason,
      customMessage: reason === 'other' ? customMessage : null
    }

    try {
      if (!navigator.onLine) {
        // Queue for offline sync
        await outboxService.add('WAITER_CALL' as any, callData)
        setIsOffline(true)
        setSent(true)
        setTimeout(() => {
          setSent(false)
          setShowModal(false)
        }, 3000)
      } else {
        // Send immediately
        const response = await fetch('/api/waiter-calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(callData)
        })

        if (!response.ok) {
          throw new Error('Failed to call waiter')
        }

        setSent(true)
        setTimeout(() => {
          setSent(false)
          setShowModal(false)
          setReason('assistance')
          setCustomMessage('')
        }, 3000)
      }
    } catch (error) {
      console.error('Call waiter error:', error)
      // Fallback to outbox
      await outboxService.add('WAITER_CALL' as any, callData)
      setIsOffline(true)
      setSent(true)
      setTimeout(() => {
        setSent(false)
        setShowModal(false)
      }, 3000)
    } finally {
      setSending(false)
    }
  }

  const reasons = [
    { value: 'water', label: 'Water', icon: Droplet, color: 'blue' },
    { value: 'assistance', label: 'Assistance', icon: HelpCircle, color: 'orange' },
    { value: 'bill', label: 'Bill', icon: DollarSign, color: 'green' },
    { value: 'other', label: 'Other', icon: MessageSquare, color: 'gray' }
  ] as const

  return (
    <>
      {/* Floating Call Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`fixed bottom-20 right-4 z-40 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${className}`}
        aria-label="Call Waiter"
      >
        <Bell size={24} className="animate-pulse" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            {!sent ? (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                    Call Waiter
                  </h2>
                  <p className="text-gray-600 text-center text-sm">
                    Select what you need help with
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-2 mb-6">
                  {reasons.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setReason(value)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        reason === value
                          ? `border-${color}-500 bg-${color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <span className="font-medium text-gray-800">{label}</span>
                      {reason === value && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Message for "Other" */}
                {reason === 'other' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What do you need?
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Please describe what you need..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleCallWaiter}
                  disabled={sending || (reason === 'other' && !customMessage.trim())}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    'Call Waiter'
                  )}
                </button>

                {isOffline && (
                  <p className="mt-3 text-sm text-orange-600 text-center">
                    You're offline. Request will be sent when connection is restored.
                  </p>
                )}
              </>
            ) : (
              // Success State
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isOffline ? 'Request Queued!' : 'Waiter Notified!'}
                </h3>
                <p className="text-gray-600">
                  {isOffline 
                    ? 'Your request will be sent when you\'re back online.'
                    : 'Someone will be with you shortly (2-5 minutes).'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
