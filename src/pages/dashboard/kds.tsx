import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { Clock, CheckCircle, AlertCircle, ChefHat, Flame, Timer, Volume2, VolumeX, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useRealtimeMulti } from '@/lib/realtime'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { workflowTracker } from '@/lib/monitoring/workflow-tracker'

interface OrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  modifiers?: string[]
  itemStatus?: string
  prepStartedAt?: Date | null
  readyAt?: Date | null
  deliveredAt?: Date | null
}

interface KitchenOrder {
  id: string
  orderNumber: string
  table: string
  items: OrderItem[]
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  orderTime: Date
  prepTime: number // minutes
  server: string
}

export default function KitchenDisplaySystem() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const { station: stationParam } = router.query
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY'>('ALL')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stationId, setStationId] = useState<string | null>(null)
  const [stationName, setStationName] = useState<string>('Kitchen')
  const [availableStations, setAvailableStations] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [isConnected, setIsConnected] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Phase 4: Start monitoring on mount
  useEffect(() => {
    if (status === 'authenticated' && stationId) {
      performanceMonitor.start()
      const sessionId = workflowTracker.startSession(stationId)

      return () => {
        performanceMonitor.stop()
        workflowTracker.completeSession()
      }
    }
  }, [status, stationId])

  // Load available stations
  useEffect(() => {
    if (status !== 'authenticated') return

    const loadStations = async () => {
      try {
        const res = await fetch('/api/station/list')
        if (res.ok) {
          const data = await res.json()
          setAvailableStations(data.stations || [])

          // Auto-select station from query param or first available
          if (stationParam && typeof stationParam === 'string') {
            const station = data.stations?.find((s: any) => s.code === stationParam || s.id === stationParam)
            if (station) {
              setStationId(station.id)
              setStationName(station.name)
            }
          } else if (data.stations?.length > 0) {
            setStationId(data.stations[0].id)
            setStationName(data.stations[0].name)
          }
        }
      } catch (err) {
        console.error('Failed to load stations:', err)
      }
    }

    loadStations()
  }, [status, stationParam])

  // Fetch station orders
  const fetchOrders = useCallback(async () => {
    if (!stationId) return

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/station/orders?stationId=${stationId}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [stationId])

  // Initial load
  useEffect(() => {
    if (stationId) {
      fetchOrders()
    }
  }, [stationId, fetchOrders])

  // Real-time updates via Pusher
  useRealtimeMulti(
    stationId
      ? [
          {
            channel: `private-station-${stationId}`,
            event: 'items.routed',
            onData: () => {
              fetchOrders()
              if (soundEnabled) playNotificationSound()
            },
          },
          {
            channel: `private-station-${stationId}`,
            event: 'item.updated',
            onData: (data: any) => {
              // Update specific item in state
              setOrders((prev) =>
                prev.map((order) => {
                  if (order.id === data.saleId) {
                    return {
                      ...order,
                      items: order.items.map((item) =>
                        item.id === data.itemId
                          ? { ...item, itemStatus: data.itemStatus }
                          : item
                      ),
                    }
                  }
                  return order
                })
              )
            },
          },
        ]
      : []
  )

  // Phase 3: Reconnection handling
  useEffect(() => {
    if (!stationId) return

    const handleReconnect = () => {
      console.log('[KDS] Pusher reconnected - fetching snapshot')
      fetchOrders() // Full refresh on reconnect
    }

    // Register reconnect handler
    const realtimeService = (window as any).__realtimeService
    if (realtimeService) {
      const cleanup = realtimeService.onReconnect(handleReconnect)
      return cleanup
    }
  }, [stationId, fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['status']) => {
    // Phase 4: Track interaction performance
    await performanceMonitor.trackInteraction(`update-order-${newStatus}`, async () => {
      try {
        workflowTracker.trackAction('update', `order-${orderId}-${newStatus}`, true)

        // Get all items for this order
        const order = orders.find((o) => o.id === orderId)
        if (!order) return

        // Map KDS status to item status
        const itemStatusMap: Record<string, string> = {
          NEW: 'NEW',
          PREPARING: 'PREPARING',
          READY: 'READY',
          SERVED: 'DELIVERED',
        }

        const itemStatus = itemStatusMap[newStatus]

        // Generate idempotency key for this batch
        const idempotencyKey = `kds-${orderId}-${newStatus}-${Date.now()}`

        // Update all items in this order
        await Promise.all(
          order.items.map((item) =>
            fetch('/api/station/update-item-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': `${idempotencyKey}-${item.id}`,
              },
              body: JSON.stringify({
                itemId: item.id,
                newStatus: itemStatus,
                stationId,
                idempotencyKey: `${idempotencyKey}-${item.id}`,
              }),
            })
          )
        )

        // Optimistically update UI
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )

        // Play sound on status change
        if (soundEnabled) {
          playNotificationSound()
        }
      } catch (err) {
        console.error('Failed to update order status:', err)
        workflowTracker.trackAction('error', `order-${orderId}-${newStatus}`, false)
      }
    })
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  // Phase 4: Optimize filtering with useMemo
  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders
    return orders.filter(order => order.status === filter)
  }, [orders, filter])

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'NORMAL': return 'bg-blue-500'
      default: return 'bg-slate-500'
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'NEW': return 'border-l-4 border-l-blue-600 bg-blue-50'
      case 'PREPARING': return 'border-l-4 border-l-orange-600 bg-orange-50'
      case 'READY': return 'border-l-4 border-l-green-600 bg-green-50'
      case 'SERVED': return 'border-l-4 border-l-slate-400 bg-slate-50'
      default: return ''
    }
  }, [])

  const getTimeAgo = useCallback((date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }, [])

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-imboni-blue" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {stationName} {t('kds.station', 'Station')}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-600">{t('kds.subtitle', 'Real-time order management')}</p>
                {/* Phase 4: Connection status */}
                <div className="flex items-center gap-1">
                  {isConnected ? (
                    <Wifi className="w-3 h-3 text-green-600" aria-label="Connected" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-600" aria-label="Disconnected" />
                  )}
                  <span className="text-xs text-slate-500">
                    {getTimeAgo(lastSyncTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Station Selector */}
            {availableStations.length > 1 && (
              <select
                value={stationId || ''}
                onChange={(e) => {
                  const selected = availableStations.find((s) => s.id === e.target.value)
                  if (selected) {
                    setStationId(selected.id)
                    setStationName(selected.name)
                    router.push(`/dashboard/kds?station=${selected.code}`, undefined, { shallow: true })
                  }
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
              >
                {availableStations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            )}

            {/* Refresh Button */}
            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-slate-700 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-slate-700" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {['ALL', 'NEW', 'PREPARING', 'READY'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-imboni-blue text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {t(`kds.filter.${status.toLowerCase()}`, status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 ${getStatusColor(order.status)} overflow-hidden`}
            >
              {/* Order Header */}
              <div className={`p-4 ${getPriorityColor(order.priority)} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.orderNumber}</span>
                    <span className="text-sm opacity-90">{order.table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{getTimeAgo(order.orderTime)}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm opacity-90">
                  Server: {order.server} • Prep: {order.prepTime} min
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 space-y-3">
                {order.items.map(item => (
                  <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          <span className="bg-imboni-blue text-white text-xs px-2 py-0.5 rounded">
                            x{item.quantity}
                          </span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers.map(mod => (
                              <span key={mod} className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-1 text-sm text-orange-600 italic">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex gap-2">
                  {order.status === 'NEW' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      <Flame className="w-4 h-4" />
                      {t('kds.startCooking', 'Start Cooking')}
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('kds.markReady', 'Mark Ready')}
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'SERVED')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('kds.markServed', 'Mark Served')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ChefHat className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {t('kds.noOrders', 'No orders')}
            </h3>
            <p className="text-slate-600">
              {t('kds.noOrdersDesc', 'New orders will appear here in real-time')}
            </p>
          </div>
        )}

        {/* Stats Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
          <div className="flex items-center justify-center gap-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-slate-600">
                {t('kds.new')}: {orders.filter(o => o.status === 'NEW').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-slate-600">
                {t('kds.preparing')}: {orders.filter(o => o.status === 'PREPARING').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">
                {t('kds.ready')}: {orders.filter(o => o.status === 'READY').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
