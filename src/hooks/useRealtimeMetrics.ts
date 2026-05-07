import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface RealtimeMetrics {
  todayRevenue: number
  revenueChange: number
  activeOrders: number
  customersToday: number
  customerChange: number
  avgOrderValue: number
}

export function useRealtimeMetrics() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    todayRevenue: 0,
    revenueChange: 0,
    activeOrders: 0,
    customersToday: 0,
    customerChange: 0,
    avgOrderValue: 0
  })
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/dashboard/live-metrics')
        if (res.ok) {
          const data = await res.json()
          setMetrics(data)
          setIsLive(true)
        }
      } catch (error) {
        console.error('Failed to fetch live metrics:', error)
        setIsLive(false)
      }
    }

    // Initial fetch
    fetchMetrics()

    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchMetrics, 5000)

    return () => clearInterval(interval)
  }, [session])

  return { metrics, isLive }
}
