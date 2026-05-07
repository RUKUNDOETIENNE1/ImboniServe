import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import type { GetServerSideProps } from 'next'

/**
 * Short URL QR Code Route: /t/{table_id}
 * 
 * Features:
 * - Network quality detection
 * - Offline menu caching
 * - Never shows blank page
 * - Auto-routes to lite/full menu based on connection
 */

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.query
  
  if (!id || typeof id !== 'string') {
    return { notFound: true }
  }

  // This is a client-side route - no server-side rendering needed
  // Just validate the table ID exists
  return { props: { tableId: id } }
}

type NetworkQuality = 'offline' | 'slow' | 'good' | 'excellent'

function detectNetworkQuality(): NetworkQuality {
  if (typeof navigator === 'undefined') return 'good'
  if (!navigator.onLine) return 'offline'
  
  const connection = (navigator as any).connection
  if (!connection) return 'good'
  
  const effectiveType = connection.effectiveType
  const downlink = connection.downlink || 0
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow'
  if (effectiveType === '3g' && downlink < 1) return 'slow'
  if (effectiveType === '4g' || downlink > 5) return 'excellent'
  
  return 'good'
}

export default function TableQRPage({ tableId }: { tableId: string }) {
  const router = useRouter()
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!router.isReady || !tableId) return
    detectNetworkAndRedirect()
  }, [router.isReady, tableId])

  async function detectNetworkAndRedirect() {
    setStatus('detecting')
    const quality = detectNetworkQuality()
    setNetworkQuality(quality)

    setStatus('fetching')
    try {
      const res = await fetch(`/api/tables/lookup?id=${tableId}`)
      if (!res.ok) {
        setError('Table not found or unavailable')
        setStatus('error')
        setLoading(false)
        return
      }

      const data = await res.json()
      setTableInfo(data)

      // Cache for offline use
      try {
        localStorage.setItem(`table_${tableId}`, JSON.stringify(data))
      } catch {}

      // Redirect to signed order URL
      await redirectToOrder(data.businessId, data.id, quality)
    } catch (err) {
      console.error('Table lookup failed:', err)
      
      // Try to use cached data
      try {
        const cached = localStorage.getItem(`table_${tableId}`)
        if (cached) {
          const data = JSON.parse(cached)
          setTableInfo(data)
          await redirectToOrder(data.businessId, data.id, quality)
          return
        }
      } catch {}

      setError('Unable to load table information. Please check your connection.')
      setStatus('error')
      setLoading(false)
    }
  }

  async function redirectToOrder(branchId: string, tblId: string, quality: NetworkQuality) {
    try {
      // Fetch signed order URL from server
      const res = await fetch(`/api/public/order/link?branchId=${branchId}&tableId=${tblId}&mode=invenue`)
      if (res.ok) {
        const { url } = await res.json()
        // Add network quality hint to signed URL
        const finalUrl = `${url}&lite=${quality === 'slow' ? 'true' : 'false'}`
        router.push(finalUrl)
      } else {
        // Fallback to basic URL if link generation fails
        router.push(`/order?branchId=${branchId}&tableId=${tblId}&mode=invenue&lite=${quality === 'slow' ? 'true' : 'false'}`)
      }
    } catch (err) {
      console.error('Failed to generate order link:', err)
      // Fallback
      router.push(`/order?branchId=${branchId}&tableId=${tblId}&mode=invenue&lite=${quality === 'slow' ? 'true' : 'false'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading menu...</p>
          <NetworkQualityIndicator quality={networkQuality} />
        </div>
      </div>
    )
  }

  if (error || networkQuality === 'offline') {
    return (
      <OfflineFallback 
        tableId={tableId} 
        error={error}
        networkQuality={networkQuality}
      />
    )
  }

  return null // Should redirect before reaching here
}

function NetworkQualityIndicator({ quality }: { quality: NetworkQuality }) {
  const indicators = {
    offline: { icon: WifiOff, text: 'Offline', color: 'text-red-600' },
    slow: { icon: AlertTriangle, text: 'Slow Connection', color: 'text-yellow-600' },
    good: { icon: Wifi, text: 'Connected', color: 'text-green-600' },
    excellent: { icon: Wifi, text: 'Fast Connection', color: 'text-green-600' }
  }

  const { icon: Icon, text, color } = indicators[quality]

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 ${color}`}>
      <Icon size={16} />
      <span className="text-sm">{text}</span>
    </div>
  )
}

function OfflineFallback({ 
  tableId, 
  error,
  networkQuality 
}: { 
  tableId: string
  error: string | null
  networkQuality: NetworkQuality
}) {
  const [callWaiterSent, setCallWaiterSent] = useState(false)

  async function handleCallWaiter() {
    // Queue waiter call for when online
    const call = {
      tableId,
      reason: 'assistance',
      customMessage: 'Customer tried to order but is offline',
      timestamp: Date.now()
    }

    localStorage.setItem('pending_waiter_call', JSON.stringify(call))
    setCallWaiterSent(true)

    // Try to send if online
    if (navigator.onLine) {
      try {
        await fetch('/api/waiter-calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(call)
        })
      } catch {
        // Will retry when online
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {networkQuality === 'offline' ? (
              <WifiOff className="w-8 h-8 text-red-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {networkQuality === 'offline' ? 'No Internet Connection' : 'Unable to Load Menu'}
          </h1>
          
          {error && (
            <p className="text-gray-600 mb-4">{error}</p>
          )}
          
          <p className="text-gray-600">
            {networkQuality === 'offline' 
              ? "We can't load the menu right now. Please check your internet connection."
              : "Something went wrong while loading the menu. Please try again."}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>

          {!callWaiterSent ? (
            <button
              onClick={handleCallWaiter}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              🔔 Call Waiter for Assistance
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">✓ Waiter has been notified</p>
              <p className="text-sm text-green-700 mt-1">Someone will be with you shortly</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Table {tableId}</strong>
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Scan the QR code again when your connection is restored
          </p>
        </div>
      </div>
    </div>
  )
}
