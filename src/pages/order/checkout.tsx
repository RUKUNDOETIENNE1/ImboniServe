/**
 * Customer Checkout Page
 * Integrates Live Order Summary + Tap & Leave™ Button
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { LiveOrderSummary } from '@/components/LiveOrderSummary'
import { TapAndLeaveButton } from '@/components/TapAndLeaveButton'
import { useDiningSession } from '@/hooks/useDiningSession'
import { ArrowLeft, Phone } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { sessionId } = router.query

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const { slip, total, canCheckout, isCompleted } = useDiningSession({
    sessionId: sessionId as string,
    autoRefresh: true,
  })

  const [feePercent, setFeePercent] = useState<number>(5)

  useEffect(() => {
    let mounted = true
    const loadFee = async () => {
      try {
        const res = await fetch('/api/fees/DIGITAL_PAYMENT_FEE')
        const data = await res.json()
        if (res.ok && data.success && typeof data.data?.percent === 'number') {
          if (mounted) setFeePercent(data.data.percent)
        }
      } catch (e) {
        // ignore, fallback to default 5%
      }
    }
    loadFee()
    return () => {
      mounted = false
    }
  }, [])

  // Redirect if session is completed
  useEffect(() => {
    if (isCompleted) {
      router.push(`/order/receipt?sessionId=${sessionId}`)
    }
  }, [isCompleted, sessionId, router])

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    
    if (!cleaned) {
      setPhoneError('Phone number is required')
      return false
    }

    if (!cleaned.match(/^(078|079|072|073)\d{7}$/)) {
      setPhoneError('Please enter a valid Rwandan phone number (078/079/072/073)')
      return false
    }

    setPhoneError('')
    return true
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(value)
    if (value) {
      validatePhone(value)
    }
  }

  const handleSuccess = () => {
    // Redirect to receipt page
    router.push(`/order/receipt?sessionId=${sessionId}`)
  }

  const handleError = (error: string) => {
    console.error('Payment error:', error)
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">No session found</p>
          <button
            onClick={() => router.push('/order')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Checkout</h1>
              <p className="text-sm text-gray-500">Review and pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Live Order Summary */}
        <LiveOrderSummary sessionId={sessionId as string} showKitchenStatus={true} />

        {/* Payment Section */}
        {canCheckout && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h2>
              
              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Mobile Money Number
                  </div>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="078 XXX XXXX"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {phoneError && (
                  <p className="mt-2 text-sm text-red-600">{phoneError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  MTN Mobile Money or Airtel Money
                </p>
              </div>
            </div>

            {/* Fee Information */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Payment Fee:</strong> {feePercent}% (RWF {Math.round(total * (feePercent / 100)).toLocaleString()})
              </p>
              <p className="text-xs text-blue-600">
                Total to pay: <strong>RWF {Math.round(total * (1 + feePercent / 100)).toLocaleString()}</strong>
              </p>
            </div>

            {/* Tap & Leave Button */}
            <TapAndLeaveButton
              sessionId={sessionId as string}
              phone={phone}
              amount={total}
              itemCount={slip?.itemCount || 0}
              disabled={!phone || !!phoneError || !canCheckout}
              onSuccess={handleSuccess}
              onError={handleError}
            />

            {/* Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                You will receive a USSD prompt on your phone to approve the payment
              </p>
            </div>
          </div>
        )}

        {/* Not Ready for Checkout */}
        {!canCheckout && !isCompleted && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
            <p className="text-yellow-800 font-medium">
              {slip?.runningTotalCents === 0
                ? 'No items in your order yet'
                : 'Checkout is not available at the moment'}
            </p>
            <button
              onClick={() => router.push(`/order?sessionId=${sessionId}`)}
              className="mt-4 text-yellow-700 hover:text-yellow-800 font-medium"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
