import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Loader2, AlertCircle } from 'lucide-react'
import { OrderPaymentStatus } from '@/components/OrderPaymentStatus'
import { PaymentFeedback } from '@/components/PaymentFeedback'
import { MoMoPaymentFlow } from '@/components/MoMoPaymentFlow'
import GoodbyeScreen from '@/components/order/GoodbyeScreen'
import OrderTimeline from '@/components/order/OrderTimeline'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
  kitchenStatus?: string | null
  receivedAt?: string | null
  acceptedAt?: string | null
  preparingAt?: string | null
  almostReadyAt?: string | null
  readyAt?: string | null
  servedAt?: string | null
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-imboni-blue mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Preparing your order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-imboni-dark mb-2">Order Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'We couldn\'t load your order details. Please try again or ask your server for assistance.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-imboni-dark text-white rounded-xl text-sm font-medium hover:bg-imboni-blue transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-blue/30"
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

  const handleShare = async () => {
    try {
      if (session) {
        const inviteRes = await fetch('/api/session/generate-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            inviterId: session.participantId
          })
        })
        if (!inviteRes.ok) throw new Error('Failed to generate invite')
        const { shareUrl } = await inviteRes.json()
        if (navigator.share) {
          await navigator.share({
            title: `Join my table at ${order.businessName}`,
            text: `I'm ordering at ${order.businessName}! Join my table and order with me:`,
            url: shareUrl,
          })
        } else {
          await navigator.clipboard.writeText(shareUrl)
        }
      } else {
        const shareUrl = window.location.origin
        if (navigator.share) {
          await navigator.share({
            title: order.businessName,
            text: `Just ordered from ${order.businessName}! Check them out:`,
            url: shareUrl,
          })
        } else {
          await navigator.clipboard.writeText(shareUrl)
        }
      }
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  // MoMo payment flow (before goodbye screen)
  if (!isPaid && isMoMoPayment && showMomoFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <MoMoPaymentFlow
            orderId={order.orderId}
            orderNumber={order.orderNumber}
            provider={order.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN' : 'AIRTEL'}
            amountCents={order.totalCents}
            defaultPhone={order.phoneNumber}
            onSuccess={handleMomoSuccess}
          />
        </div>
      </div>
    )
  }

  // MoMo payment prompt (before goodbye screen)
  if (!isPaid && isMoMoPayment && !showMomoFlow) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <h2 className="text-lg font-bold text-imboni-dark mb-2">Complete Your Payment</h2>
            <p className="text-sm text-gray-500 mb-6">
              Complete your {order.paymentMethod === 'MTN_MOBILE_MONEY' ? 'MTN Mobile Money' : 'Airtel Money'} payment to confirm your order
            </p>
            <button
              onClick={() => setShowMomoFlow(true)}
              className="w-full py-3.5 bg-imboni-dark hover:bg-imboni-blue text-white font-semibold rounded-xl transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Non-MoMo pending payment
  if (!isPaid && !isMoMoPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <OrderPaymentStatus
              paymentStatus={order.paymentStatus}
              paymentMethod={order.paymentMethod}
              paymentLinkUrl={order.paymentLinkUrl}
              totalCents={order.totalCents}
              orderNumber={order.orderNumber}
            />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
            {isCashPayment ? 'Please pay at the counter when you arrive.' : 'Complete your online payment to confirm your order.'}
          </div>
        </div>
      </div>
    )
  }

  // Paid — Goodbye Experience
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <GoodbyeScreen
          restaurantName={order.businessName}
          orderNumber={order.orderNumber}
          totalCents={order.totalCents}
          currency={order.currency}
          items={order.items.map(item => ({ name: item.name, quantity: item.quantity }))}
          isPaid={isPaid}
          eta={order.eta}
          onShare={handleShare}
        />

        {/* Share success toast */}
        {shareSuccess && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-imboni-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-fade-in">
            Shared successfully!
          </div>
        )}

        {/* Order Timeline */}
        <div className="mt-6">
          <OrderTimeline
            kitchenStatus={order.kitchenStatus}
            receivedAt={order.receivedAt}
            acceptedAt={order.acceptedAt}
            preparingAt={order.preparingAt}
            almostReadyAt={order.almostReadyAt}
            readyAt={order.readyAt}
            servedAt={order.servedAt}
            estimatedMinutes={order.eta}
            orderNumber={order.orderNumber}
          />
        </div>

        {/* Payment Feedback */}
        <div className="mt-6">
          <PaymentFeedback
            orderId={order.orderId}
            orderNumber={order.orderNumber}
            paymentMethod={order.paymentMethod}
            onComplete={() => { /* noop */ }}
          />
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mt-6">
          <h3 className="font-semibold text-imboni-dark text-sm mb-3">Need Help?</h3>
          <div className="space-y-1.5 text-xs text-gray-500">
            <p>• Show your order number <span className="font-mono font-semibold text-imboni-dark">{order.orderNumber}</span> to staff</p>
            <p>• Your order will be ready in approximately {order.eta}</p>
            <p>• Keep this page open to receive real-time updates</p>
          </div>
        </div>

        {/* Refresh */}
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
    </ErrorBoundary>
  )
}
