import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Loader2, XCircle, Banknote, Smartphone } from 'lucide-react'

interface ManualPaymentConfirmationProps {
  orderId: string
  orderNumber: string
  paymentMethod: string
  amountCents: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function ManualPaymentConfirmation({
  orderId,
  orderNumber,
  paymentMethod,
  amountCents,
  onSuccess,
  onError
}: ManualPaymentConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment confirmation failed')
      }

      setSuccess(true)
      setShowConfirmDialog(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to confirm payment'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodIcon = () => {
    if (paymentMethod === 'CASH') return Banknote
    if (paymentMethod.includes('MOBILE_MONEY') || paymentMethod.includes('AIRTEL')) return Smartphone
    return CheckCircle2
  }

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'CASH': return 'Cash'
      case 'MTN_MOBILE_MONEY': return 'MTN Mobile Money'
      case 'AIRTEL_MONEY': return 'Airtel Money'
      case 'BANK_TRANSFER': return 'Bank Transfer'
      default: return paymentMethod
    }
  }

  const Icon = getPaymentMethodIcon()

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Payment confirmed successfully! Order released to kitchen.
        </AlertDescription>
      </Alert>
    )
  }

  if (showConfirmDialog) {
    return (
      <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Confirm Payment Received</h4>
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="text-slate-500 hover:text-slate-700"
            disabled={loading}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
            <div>
              <p className="text-sm text-slate-600">Order Number</p>
              <p className="font-mono font-semibold text-slate-900">{orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Amount</p>
              <p className="font-semibold text-slate-900">{(amountCents / 100).toLocaleString()} RWF</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white rounded border border-slate-200">
            <Icon className="h-5 w-5 text-slate-600" />
            <div>
              <p className="text-sm text-slate-600">Payment Method</p>
              <p className="font-medium text-slate-900">{getPaymentMethodLabel()}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction reference..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Payment Received
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowConfirmDialog(true)}
      className="bg-green-600 hover:bg-green-700 text-white"
      size="sm"
    >
      <CheckCircle2 className="mr-2 h-4 w-4" />
      Mark as Paid
    </Button>
  )
}
