import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { CheckCircle2, Clock, Loader2, AlertCircle, Share2, Users } from 'lucide-react'
import { OrderPaymentStatus } from '@/components/OrderPaymentStatus'
import { PaymentFeedback } from '@/components/PaymentFeedback'
import { MoMoPaymentFlow } from '@/components/MoMoPaymentFlow'
import { useRealtime } from '@/lib/realtime'
import { getSessionInfo } from '@/lib/sessionManager'

interface OrderConfirmationData {
  orderId: string
  orderNumber: string
  paymentMethod: string
  paymentStatus: string
  paymentLinkUrl?: string
  totalCents: number
  currency: string
  items: Array<{
    name: string
    quantity: number
    priceCents: number
  }>
  eta: string
  businessName: string
  requiresManualConfirmation: boolean
  momoInitiationUrl?: string
  phoneNumber?: string
}

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { orderId } = router.query
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderConfirmationData | null>(null)
  const [showMomoFlow, setShowMomoFlow] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const session = getSessionInfo()

  useEffect(() => {
    if (!orderId || typeof orderId !== 'string') return

    fetchOrder(orderId)
  }, [orderId])

  // Real-time updates for order status
  const realtimeData = useRealtime(
    order ? `business:${order.orderId}` : '',
    'status'
  )

  useEffect(() => {
    if (realtimeData?.type === 'ORDER_PAYMENT_CONFIRMED' && order) {
      setOrder({
        ...order,
        paymentStatus: 'PAID'
      })
    }
  }, [realtimeData, order])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}/status`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load order')
      }

      setOrder(data)
      
      // Auto-show MoMo flow if payment method is MoMo and not paid
      if (
        ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY'].includes(data.paymentMethod) &&
        data.paymentStatus !== 'PAID'
      ) {
        setShowMomoFlow(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMomoSuccess = () => {
    setShowMomoFlow(false)
    if (orderId && typeof orderId === 'string') {
      fetchOrder(orderId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-imboni-blue mx-auto mb-4" />
          <p className="text-slate-600">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-imboni-blue text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const isPaid = order.paymentStatus === 'PAID'
  const isMoMoPayment = ['MTN_MOBILE_MONEY', 'AIRTEL_MONEY'].includes(order.paymentMethod)
  const isCashPayment = ['CASH', 'BANK_TRANSFER', 'OTHER'].includes(order.paymentMethod)
  const isOnlinePayment = order.paymentMethod === 'WEB'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Order Confirmed</h1>
              <p className="text-sm text-slate-600">{order.businessName}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
              isPaid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {isPaid ? '✅ Paid' : '⏳ Pending Payment'}
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Order Number</p>
                <p className="text-lg font-mono font-bold text-slate-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600 mb-1">Total</p>
                <p className="text-lg font-bold text-slate-900">
                  {(order.totalCents / 100).toLocaleString()} {order.currency}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status / Actions */}
        {!isPaid && isMoMoPayment && showMomoFlow && (
          <div className="mb-6">
            <MoMoPaymentFlow
              orderId={order.orderId}
              orderNumber={order.orderNumber}
              provider={order.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN' : 'AIRTEL'}
              amountCents={order.totalCents}
              defaultPhone={order.phoneNumber}
              onSuccess={handleMomoSuccess}
            />
          </div>
        )}

        {!isPaid && isMoMoPayment && !showMomoFlow && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
            <p className="text-sm text-slate-600 mb-4">
              Complete your {order.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN Mobile Money' : 'Airtel Money'} payment to confirm your order
            </p>
            <button
              onClick={() => setShowMomoFlow(true)}
              className="w-full bg-imboni-blue hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {!showMomoFlow && (
          <div className="mb-6">
            <OrderPaymentStatus
              paymentStatus={order.paymentStatus}
              paymentMethod={order.paymentMethod}
              paymentLinkUrl={order.paymentLinkUrl}
              totalCents={order.totalCents}
              orderNumber={order.orderNumber}
            />
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-semibold text-sm text-slate-700">
                    {item.quantity}×
                  </span>
                  <span className="text-slate-900">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {((item.priceCents * item.quantity) / 100).toLocaleString()} {order.currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ETA */}
        {isPaid && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">Your Order is Being Prepared</h3>
                <p className="text-sm text-blue-800">
                  Estimated time: <span className="font-semibold">{order.eta}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Share Table / Invite Friends */}
        {isPaid && session && (
          <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-3 border-blue-300 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🎉 Invite Friends to Join Your Table
              </h3>
              <p className="text-sm text-gray-700 mb-1 leading-relaxed">
                Share your table link and order together!
              </p>
              <p className="text-xs text-blue-700 font-semibold mb-4">
                💡 Everyone gets their own receipt • Split bills easily
              </p>
              <button
                onClick={async () => {
                  try {
                    // Generate invite code
                    const inviteRes = await fetch('/api/session/generate-invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: session.sessionId,
                        inviterId: session.participantId
                      })
                    })

                    if (!inviteRes.ok) {
                      throw new Error('Failed to generate invite')
                    }

                    const { shareUrl } = await inviteRes.json()

                    if (navigator.share) {
                      await navigator.share({
                        title: `Join my table at ${order.businessName}`,
                        text: `I'm ordering at ${order.businessName}! Join my table and order with me:`,
                        url: shareUrl,
                      })
                      setShareSuccess(true)
                      setTimeout(() => setShareSuccess(false), 3000)
                    } else {
                      await navigator.clipboard.writeText(shareUrl)
                      setShareSuccess(true)
                      setTimeout(() => setShareSuccess(false), 3000)
                    }
                  } catch (err) {
                    console.error('Share failed:', err)
                    alert('Failed to generate share link. Please try again.')
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 text-base"
              >
                <Share2 className="w-5 h-5" />
                {shareSuccess ? '✅ Link Copied!' : 'Share Table Link'}
              </button>
              <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <p className="text-sm font-bold text-amber-900 mb-1">
                  🎁 Bonus: Invite 2+ friends & get 10% off your next order!
                </p>
                <p className="text-xs text-amber-800">
                  More friends = more rewards
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Share Restaurant (for non-table orders) */}
        {isPaid && !session && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ❤️ Love {order.businessName}?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Share this restaurant with friends and <strong className="text-green-700">earn 500 RWF</strong> when they order!
              </p>
              <button
                onClick={async () => {
                  const shareUrl = window.location.origin
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: order.businessName,
                        text: `Just ordered from ${order.businessName}! Check them out:`,
                        url: shareUrl,
                      })
                      setShareSuccess(true)
                      setTimeout(() => setShareSuccess(false), 3000)
                    } else {
                      await navigator.clipboard.writeText(shareUrl)
                      setShareSuccess(true)
                      setTimeout(() => setShareSuccess(false), 3000)
                    }
                  } catch (err) {
                    console.error('Share failed:', err)
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                {shareSuccess ? '✅ Shared!' : 'Share & Earn 500 RWF'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Feedback (shown after successful payment) */}
        {isPaid && (
          <div className="mb-6">
            <PaymentFeedback
              orderId={order.orderId}
              orderNumber={order.orderNumber}
              paymentMethod={order.paymentMethod}
              onComplete={() => { /* noop */ }}
            />
          </div>
        )}

        {/* Help Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>• Show your order number <span className="font-mono font-semibold">{order.orderNumber}</span> to staff</p>
            {!isPaid && isCashPayment && (
              <p>• Pay at the counter when you arrive</p>
            )}
            {!isPaid && isOnlinePayment && (
              <p>• Complete your online payment to confirm your order</p>
            )}
            {isPaid && (
              <p>• Your order will be ready in approximately {order.eta}</p>
            )}
            <p>• Keep this page open to receive updates</p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => orderId && typeof orderId === 'string' && fetchOrder(orderId)}
            className="text-sm text-imboni-blue hover:text-primary-700 font-medium"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  )
}
