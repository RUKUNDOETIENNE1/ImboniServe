import { useState, useEffect, useCallback } from 'react'
import { outboxService } from '@/lib/services/outbox.service'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      outboxService.syncAll()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check pending items periodically
    const checkPending = async () => {
      try {
        const pending = await outboxService.getPending()
        setPendingCount(pending.length)
      } catch {
        // Outbox DB may not be initialized yet
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const saveOffline = useCallback(async (type: 'SALE' | 'PAYMENT' | 'SLIP' | 'INVENTORY' | 'CONSENT', data: any): Promise<string> => {
    return outboxService.add(type, data)
  }, [])

  const retrySync = useCallback(async () => {
    await outboxService.syncAll()
  }, [])

  return {
    isOnline,
    pendingCount,
    saveOffline,
    retrySync
  }
}