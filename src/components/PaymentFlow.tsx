import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface PaymentFlowProps {
  subscriptionId: string
  businessId: string
  planName: string
  amount: number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function PaymentFlow({ 
  subscriptionId, 
  businessId,
  planName, 
  amount,
  onSuccess,
  onError
}: PaymentFlowProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)
    setPaymentStatus('idle')

    try {
      const response = await fetch('/api/payments/irembo/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, businessId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      setTransactionId(result.data.transactionId)
      setPaymentStatus('pending')

      // Open hosted checkout in new tab
      window.open(result.data.paymentLinkUrl, '_blank')
      
      // Start polling for status
      pollPaymentStatus(result.data.transactionId)
    } catch (err: any) {
      setError(err.message)
      setPaymentStatus('failed')
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (txnId: string) => {
    const maxAttempts = 60 // Poll for up to 5 minutes
    let attempts = 0

    const interval = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/payments/irembo/status?transactionId=${txnId}`)
        const result = await response.json()

        if (result.data.status === 'PAID') {
          clearInterval(interval)
          setPaymentStatus('success')
          onSuccess?.()
        } else if (result.data.status === 'FAILED' || result.data.status === 'EXPIRED') {
          clearInterval(interval)
          setPaymentStatus('failed')
          setError('Payment failed or expired. Please try again.')
          onError?.('Payment failed or expired')
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setError('Payment status check timed out. Please refresh to check status.')
        }
      } catch (err) {
        console.error('Status polling error:', err)
      }
    }, 5000) // Poll every 5 seconds
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">{planName}</h3>
        <div className="mt-2">
          <p className="text-3xl font-bold text-gray-900">{amount.toLocaleString()} RWF</p>
          <p className="text-sm text-gray-600 mt-1">VAT inclusive • No extra charges</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Payment window opened. Complete your payment and we'll confirm it automatically.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Your subscription is now active.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Payment failed. Please try again or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handlePayment}
        disabled={loading || paymentStatus === 'pending' || paymentStatus === 'success'}
        className="w-full"
        size="lg"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {paymentStatus === 'success' ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Payment Complete
          </>
        ) : paymentStatus === 'pending' ? (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Awaiting Payment...
          </>
        ) : (
          <>
            <ExternalLink className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Secure payment powered by IremboPay
      </p>
    </div>
  )
}
