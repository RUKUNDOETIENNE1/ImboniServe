import { CheckCircle2, Clock, ExternalLink, AlertCircle } from 'lucide-react'

interface OrderPaymentStatusProps {
  paymentStatus: string
  paymentMethod: string
  paymentLinkUrl?: string | null
  totalCents: number
  orderNumber: string
}

export function OrderPaymentStatus({
  paymentStatus,
  paymentMethod,
  paymentLinkUrl,
  totalCents,
  orderNumber
}: OrderPaymentStatusProps) {
  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'CASH': return 'Cash'
      case 'MTN_MOBILE_MONEY': return 'MTN Mobile Money'
      case 'AIRTEL_MONEY': return 'Airtel Money'
      case 'BANK_TRANSFER': return 'Bank Transfer'
      case 'WEB': return 'Online Payment'
      case 'DIGITAL': return 'Digital Payment'
      default: return paymentMethod
    }
  }

  const isManualPayment = ['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'OTHER'].includes(paymentMethod)
  const isPaid = paymentStatus === 'PAID'
  const isPending = paymentStatus === 'PENDING'
  const isOnlinePayment = paymentMethod === 'WEB' || paymentMethod === 'DIGITAL'

  if (isPaid) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-1">Payment Received</h3>
            <p className="text-sm text-green-800 mb-3">
              Your payment has been confirmed. Your order is being prepared!
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Payment Method:</span>
                <span className="ml-2 text-green-900 font-semibold">{getPaymentMethodLabel()}</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Amount:</span>
                <span className="ml-2 text-green-900 font-semibold">{(totalCents / 100).toLocaleString()} RWF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isPending && isManualPayment) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900 mb-1">Payment Required</h3>
            <p className="text-sm text-amber-800 mb-3">
              Please pay at the counter when you arrive. Show your order number to the staff.
            </p>
            <div className="bg-white border border-amber-200 rounded-xl p-4 mb-3">
              <div className="text-center">
                <p className="text-xs text-amber-700 font-medium uppercase mb-1">Your Order Number</p>
                <p className="text-3xl font-mono font-bold text-amber-900">{orderNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Payment Method</p>
                <p className="text-sm text-amber-900 font-semibold">{getPaymentMethodLabel()}</p>
              </div>
              <div className="bg-white border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Amount to Pay</p>
                <p className="text-sm text-amber-900 font-semibold">{(totalCents / 100).toLocaleString()} RWF</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-100 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Your order will be sent to the kitchen once payment is confirmed by our staff.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isPending && isOnlinePayment) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-1">Online Payment Pending</h3>
            <p className="text-sm text-blue-800 mb-4">
              Please complete your payment to confirm your order.
            </p>
            {paymentLinkUrl && (
              <a
                href={paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Complete Payment Now
              </a>
            )}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Amount:</span>
                <span className="ml-2 text-blue-900 font-semibold">{(totalCents / 100).toLocaleString()} RWF</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Order:</span>
                <span className="ml-2 text-blue-900 font-mono font-semibold">{orderNumber}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                Payment link expires in 15 minutes. Your order will be confirmed automatically once payment is received.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-slate-400 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Awaiting Payment</h3>
          <p className="text-sm text-slate-700 mb-3">
            Payment status: {paymentStatus}
          </p>
          <div className="text-sm text-slate-600">
            <p>Order Number: <span className="font-mono font-semibold">{orderNumber}</span></p>
            <p>Amount: <span className="font-semibold">{(totalCents / 100).toLocaleString()} RWF</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
