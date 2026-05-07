/**
 * useDiningSession Hook
 * Manages dining session state and live order tracking
 */

import { useState, useEffect, useCallback } from 'react'

export interface DiningSessionSlip {
  id: string
  slipNumber: string
  sessionId: string
  status: string
  runningSubtotalCents: number
  runningVatCents: number
  runningTotalCents: number
  finalBillCents: number | null
  orderCount: number
  itemCount: number
  sessionStartedAt: string
  taxMode: string
  taxRate: number
  items: Array<{
    id: string
    itemName: string
    quantity: number
    unitPriceCents: number
    totalPriceCents: number
    kitchenStatus: string
    notes?: string
  }>
  session: {
    table?: {
      number: string
    }
  }
}

interface UseDiningSessionOptions {
  sessionId: string | null
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useDiningSession({
  sessionId,
  autoRefresh = true,
  refreshInterval = 5000,
}: UseDiningSessionOptions) {
  const [slip, setSlip] = useState<DiningSessionSlip | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlip = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/session/slip/${sessionId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setSlip(data.data)
      } else {
        setError(data.error || 'Failed to load session')
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchSlip()
    }
  }, [sessionId, fetchSlip])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !sessionId) return

    const interval = setInterval(fetchSlip, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, sessionId, refreshInterval, fetchSlip])

  const refresh = useCallback(() => {
    fetchSlip()
  }, [fetchSlip])

  return {
    slip,
    loading,
    error,
    refresh,
    // Computed values
    total: slip ? slip.runningTotalCents / 100 : 0,
    subtotal: slip ? slip.runningSubtotalCents / 100 : 0,
    vat: slip ? slip.runningVatCents / 100 : 0,
    itemCount: slip?.itemCount || 0,
    orderCount: slip?.orderCount || 0,
    canCheckout: slip ? slip.status === 'active' && slip.runningTotalCents > 0 : false,
    isCheckoutInProgress: slip ? ['checkout_initiated', 'bill_finalized', 'payment_triggered'].includes(slip.status) : false,
    isCompleted: slip ? slip.status === 'checkout_completed' || slip.status === 'closed' : false,
  }
}
