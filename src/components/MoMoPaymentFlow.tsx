import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Loader2, XCircle, Smartphone, AlertCircle, Clock } from 'lucide-react'

interface MoMoPaymentFlowProps {
  orderId: string
  orderNumber: string
  provider: 'MTN' | 'AIRTEL'
  amountCents: number
  defaultPhone?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function MoMoPaymentFlow({
  orderId,
  orderNumber,
  provider,
  amountCents,
  defaultPhone,
  onSuccess,
  onError
}: MoMoPaymentFlowProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'initiated' | 'polling' | 'success' | 'failed'>('idle')
  const [pollingCount, setPollingCount] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const maxPollingAttempts = 60 // 60 attempts × 5 seconds = 5 minutes

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Remove leading 250 if present
    const cleaned = digits.replace(/^250/, '')
    
    // Format as XXX XXX XXX
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhoneNumber(formatted)
    setError(null)
  }

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 9
  }

  const handleInitiatePayment = async () => {
    setError(null)
    
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid 9-digit phone number (e.g., 788 123 456)')
      return
    }

    setLoading(true)
    setStatus('initiated')

    try {
      const response = await fetch('/api/payments/momo/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          provider,
          phoneNumber: '250' + phoneNumber.replace(/\D/g, '')
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed')
      }

      setTransactionId(result.transactionId)
      setStatus('polling')
      setStatusMessage(result.message || 'Check your phone to approve the payment')
      setPollingCount(0)
      
      // Start polling for status
      startStatusPolling(result.transactionId)

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to initiate payment'
      setError(errorMsg)
      setStatus('failed')
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = (txId: string) => {
    const pollInterval = setInterval(async () => {
      setPollingCount(prev => {
        const newCount = prev + 1
        
        if (newCount >= maxPollingAttempts) {
          clearInterval(pollInterval)
          setStatus('failed')
          setError('Payment timeout. Please try again.')
          onError?.('Payment timeout')
          return newCount
        }

        return newCount
      })

      try {
        const response = await fetch(`/api/payments/momo/status/${txId}`)
        const result = await response.json()

        if (result.status === 'SUCCESSFUL') {
          clearInterval(pollInterval)
          setStatus('success')
          setStatusMessage('Payment confirmed! Your order is being prepared.')
          onSuccess?.()
        } else if (result.status === 'FAILED') {
          clearInterval(pollInterval)
          setStatus('failed')
          setError(result.reason || 'Payment failed. Please try again.')
          onError?.(result.reason || 'Payment failed')
        }
        // Continue polling for PENDING or TIMEOUT
      } catch (err) {
        console.error('Status check error:', err)
      }
    }, 5000) // Poll every 5 seconds
  }

  const getProviderColor = () => {
    return provider === 'MTN' ? 'yellow' : 'red'
  }

  const getProviderName = () => {
    return provider === 'MTN' ? 'MTN Mobile Money' : 'Airtel Money'
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-1">Payment Successful!</h3>
            <p className="text-sm text-green-800 mb-3">{statusMessage}</p>
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">Order Number:</span>
                <span className="font-mono font-semibold text-green-900">{orderNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-green-700">Amount Paid:</span>
                <span className="font-semibold text-green-900">{(amountCents / 100).toLocaleString()} RWF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'polling') {
    const secondsElapsed = pollingCount * 5
    const secondsRemaining = (maxPollingAttempts - pollingCount) * 5

    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-1">Waiting for Payment Approval</h3>
            <p className="text-sm text-blue-800 mb-4">{statusMessage}</p>
            
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="w-5 h-5 text-blue-700" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">Check your phone</p>
                  <p className="text-xs text-blue-700">Enter your {getProviderName()} PIN to approve</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-blue-700 mb-2">
                  <span>Phone:</span>
                  <span className="font-mono font-semibold">+250 {phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Amount:</span>
                  <span className="font-semibold">{(amountCents / 100).toLocaleString()} RWF</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking payment status...
              </span>
              <span>{Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s remaining</span>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                style={{ width: `${(pollingCount / maxPollingAttempts) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const colorClass = getProviderColor() === 'yellow' ? 'yellow' : 'red'
  const colors = {
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600'
    }
  }[colorClass]

  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${colors.border}`}>
          <Smartphone className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${colors.text} mb-1`}>Pay with {getProviderName()}</h3>
          <p className="text-sm text-slate-600">
            You'll receive a payment prompt on your phone to approve the transaction
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {provider === 'MTN' ? 'MTN' : 'Airtel'} Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              +250
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="788 123 456"
              maxLength={11}
              className="w-full pl-16 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              disabled={loading || status === 'initiated'}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enter your 9-digit {provider === 'MTN' ? 'MTN' : 'Airtel'} number
          </p>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Order Number:</span>
            <span className="font-mono font-semibold text-slate-900">{orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Amount to Pay:</span>
            <span className="text-xl font-bold text-slate-900">{(amountCents / 100).toLocaleString()} RWF</span>
          </div>
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleInitiatePayment}
          disabled={loading || !validatePhone(phoneNumber) || status === 'initiated'}
          className={`w-full ${colors.button} text-white py-6 text-base font-semibold`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initiating Payment...
            </>
          ) : (
            <>
              <Smartphone className="mr-2 h-5 w-5" />
              Send Payment Request
            </>
          )}
        </Button>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You'll receive a payment prompt on your phone. Enter your {provider === 'MTN' ? 'MTN' : 'Airtel'} Mobile Money PIN to complete the payment. The payment must be approved within 5 minutes.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
