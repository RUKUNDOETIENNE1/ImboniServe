import { useState, useEffect } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

export default function OfflineIndicator() {
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingItems()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check pending items count periodically
    const checkPending = async () => {
      try {
        const { outboxService } = await import('@/lib/services/outbox.service')
        const pending = await outboxService.getPending()
        setPendingCount(pending.length)
      } catch (error) {
        console.error('Failed to check pending items:', error)
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 10000) // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const syncPendingItems = async () => {
    setSyncing(true)
    try {
      const { outboxService } = await import('@/lib/services/outbox.service')
      await outboxService.syncAll()
      setPendingCount(0)
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Don't render on server
  if (!mounted) {
    return null
  }

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
          isOnline
            ? 'bg-blue-500 text-white'
            : 'bg-yellow-500 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            {pendingCount > 0 && (
              <>
                <span className="text-sm font-medium">
                  Syncing {pendingCount} item{pendingCount !== 1 ? 's' : ''}...
                </span>
                {syncing && <RefreshCw className="w-4 h-4 animate-spin" />}
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline Mode</span>
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {pendingCount} pending
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
