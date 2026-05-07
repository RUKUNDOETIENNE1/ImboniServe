/**
 * Tap & Leave™ Button Component
 * Main customer-facing checkout button
 */

import { useState } from 'react'
import TipSuggestionModal from './TipSuggestionModal'
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface TapAndLeaveButtonProps {
  sessionId: string
  phone: string
  amount: number
  itemCount: number
  disabled?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function TapAndLeaveButton({
  sessionId,
  phone,
  amount,
  itemCount,
  disabled = false,
  onSuccess,
  onError,
}: TapAndLeaveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [tipRwf, setTipRwf] = useState<number>(0)
  const tipOptions = [0, 500, 1000]

  const displayAmount = amount + (tipRwf || 0)

  const [tipModalOpen, setTipModalOpen] = useState(false)
  const [tipSuggestion, setTipSuggestion] = useState<{
    enabled: boolean
    billAmountCents: number
    suggestedAmountCents: number
    tipAmountCents: number
    currency: string
  } | null>(null)

  const callCheckout = async (tipRwfValue: number) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/checkout/tap-and-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          phone,
          tipCents: Math.max(0, Math.round((tipRwfValue || 0) * 100)),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Show payment modal
      setShowModal(true)
      setPaymentId(data.data.paymentId)
      setPaymentStatus(data.data.status === 'pending' ? 'pending' : 'success')

      // Start polling if pending
      if (data.data.status === 'pending') {
        startPolling(data.data.paymentId)
      } else {
        // Immediate success
        setLoading(false)
        onSuccess?.(data.data)
      }
    } catch (error: any) {
      setLoading(false)
      setErrorMessage(error.message || 'Failed to initiate checkout')
      onError?.(error.message)
    }
  }

  const handleTapAndLeave = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // 1) Try fetch round-up tip suggestion (session-level)
      const sRes = await fetch(`/api/tips/suggest/session/${sessionId}`)
      const sData = await sRes.json()
      if (sRes.ok && sData.success && sData.data?.enabled && sData.data?.tipAmountCents > 0) {
        setTipSuggestion(sData.data)
        setTipModalOpen(true)
        setLoading(false)
        return
      }

      // 2) If no suggestion or disabled, proceed directly
      await callCheckout(tipRwf || 0)
    } catch (error: any) {
      setLoading(false)
      setErrorMessage(error.message || 'Failed to initiate checkout')
      onError?.(error.message)
    }
  }

  const startPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/checkout/tap-and-leave/status/${paymentId}`)
        const data = await response.json()

        if (data.success) {
          const status = data.data.status

          if (status === 'paid') {
            setPaymentStatus('success')
            setLoading(false)
            stopPolling()
            onSuccess?.(data.data)
          } else if (status === 'failed') {
            setPaymentStatus('failed')
            setErrorMessage(data.data.message || 'Payment failed')
            setLoading(false)
            stopPolling()
            onError?.(data.data.message)
          }
          // If still pending, continue polling
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)

    // Auto-stop after 5 minutes
    setTimeout(() => {
      stopPolling()
      if (paymentStatus === 'pending') {
        setPaymentStatus('failed')
        setErrorMessage('Payment timeout. Please check your phone.')
        setLoading(false)
      }
    }, 5 * 60 * 1000)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  const closeModal = () => {
    stopPolling()
    setShowModal(false)
    setPaymentStatus(null)
    setPaymentId(null)
    setErrorMessage(null)
  }

  return (
    <>
      {/* Round-up Tip Suggestion Modal */}
      <TipSuggestionModal
        isOpen={tipModalOpen && !!tipSuggestion}
        onClose={() => setTipModalOpen(false)}
        billAmountCents={tipSuggestion?.billAmountCents || Math.round(amount * 100)}
        suggestedAmountCents={tipSuggestion?.suggestedAmountCents || Math.round(amount * 100)}
        tipAmountCents={tipSuggestion?.tipAmountCents || 0}
        currency={tipSuggestion?.currency || 'RWF'}
        onAccept={async () => {
          try {
            const tipCents = tipSuggestion?.tipAmountCents || 0
            await fetch('/api/tips/record-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, accepted: true, tipAmountCents: tipCents }),
            })
            setTipRwf(Math.round(tipCents / 100))
            setTipModalOpen(false)
            await callCheckout(Math.round(tipCents / 100))
          } catch (e) {
            setTipModalOpen(false)
            await callCheckout(0)
          }
        }}
        onSkip={async () => {
          try {
            await fetch('/api/tips/record-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, accepted: false }),
            })
          } catch (e) {
            // ignore logging failure
          } finally {
            setTipRwf(0)
            setTipModalOpen(false)
            await callCheckout(0)
          }
        }}
      />
      {/* Optional Tip Selector */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Add a tip (optional)</span>
          {tipRwf > 0 && (
            <button className="text-xs text-red-500 hover:underline" onClick={() => setTipRwf(0)} disabled={loading}>
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tipOptions.map((t) => (
            <button
              key={t}
              type="button"
              disabled={loading}
              onClick={() => setTipRwf(t)}
              className={`px-3 py-1.5 rounded-full text-sm border ${tipRwf === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {t === 0 ? 'No tip' : `+${t.toLocaleString()} RWF`}
            </button>
          ))}
          <input
            type="number"
            min={0}
            step={100}
            disabled={loading}
            value={tipRwf || 0}
            onChange={(e) => setTipRwf(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            className="ml-1 w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Custom"
          />
        </div>
      </div>

      {/* Main Button */}
      <button
        onClick={handleTapAndLeave}
        disabled={disabled || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
      >
        <CreditCard className="w-6 h-6" />
        <span className="text-lg">Tap & Leave™</span>
      </button>

      {/* Payment Status Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Close button (only show after completion) */}
            {paymentStatus !== 'pending' && (
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}

            {/* Pending State */}
            {paymentStatus === 'pending' && (
              <div className="text-center">
                <div className="mb-6">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Awaiting Payment
                </h2>
                <p className="text-gray-600 mb-6">
                  Please approve the payment on your phone via <strong>*182#</strong>
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Amount: <span className="text-lg font-bold">RWF {displayAmount.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                  {tipRwf > 0 && (
                    <p className="text-xs text-blue-600 mt-1">Includes tip: RWF {tipRwf.toLocaleString()}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Waiting for confirmation...
                </p>
              </div>
            )}

            {/* Success State */}
            {paymentStatus === 'success' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Payment Successful! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Your payment has been confirmed. Thank you for dining with us!
                </p>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-800 font-medium">
                    Paid: <span className="text-lg font-bold">RWF {displayAmount.toLocaleString()}</span>
                  </p>
                  {tipRwf > 0 && (
                    <p className="text-xs text-green-700 mt-1">Includes tip: RWF {tipRwf.toLocaleString()}</p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Failed State */}
            {paymentStatus === 'failed' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Payment Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  {errorMessage || 'Unable to process payment. Please try again.'}
                </p>
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message (outside modal) */}
      {errorMessage && !showModal && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}
    </>
  )
}
