/**
 * Waiter Operational Dashboard
 * Real-time order queue for waiter workflow
 * 
 * Workflow Stages:
 * 1. Waiting for Preparation
 * 2. Preparing
 * 3. Ready for Pickup
 * 4. Picked Up
 * 5. Delivered
 * 
 * Integrates with Heart Pulse for live updates
 */

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Clock, CheckCircle, Package, Truck, UtensilsCrossed, AlertCircle, RefreshCw } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { useRealtimeMulti } from '@/lib/realtime'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import StaffGuestIntelligence from '@/components/staff/StaffGuestIntelligence'

const ALLOWED_ROLES = new Set(['OWNER', 'WAITER', 'SUPERVISOR', 'FRONT_DESK', 'ADMIN', 'MANAGER'])

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  const roles: string[] = (session.user as any).roles || []
  if (!roles.some((r) => ALLOWED_ROLES.has(r))) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: { businessId: (session.user as any).businessId || '' } }
}

interface StationProgress {
  stationId: string
  stationName: string
  itemCount: number
  readyCount: number
  allReady: boolean
}

interface QueueOrder {
  id: string
  orderNumber: string
  tableNumber?: string
  participantName?: string
  customerPhone?: string
  customerId?: string
  kitchenStatus: string
  expoStatus: string | null
  createdAt: string
  readyAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  itemCount: number
  stationProgress: StationProgress[]
  priority: 'normal' | 'urgent' | 'delayed'
  waitTimeMinutes: number
}

interface WaiterQueue {
  waitingForPreparation: QueueOrder[]
  preparing: QueueOrder[]
  readyForPickup: QueueOrder[]
  pickedUp: QueueOrder[]
  delivered: QueueOrder[]
}

function OrderCard({ order, onPickup, onDeliver, businessId }: {
  order: QueueOrder
  onPickup?: (id: string) => void
  onDeliver?: (id: string) => void
  businessId: string
}) {
  const { t } = useTranslation()
  const isUrgent = order.priority === 'urgent'
  const isDelayed = order.priority === 'delayed'

  const borderColor = isDelayed ? 'border-red-500' : isUrgent ? 'border-orange-400' : 'border-slate-200'
  const bgColor = isDelayed ? 'bg-red-50' : isUrgent ? 'bg-orange-50' : 'bg-white'

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${borderColor} ${bgColor}`}>
      {order.customerPhone && (
        <StaffGuestIntelligence phone={order.customerPhone} businessId={businessId} />
      )}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono font-bold text-lg">{order.orderNumber}</span>
          {order.tableNumber && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Table {order.tableNumber}
            </span>
          )}
          {order.participantName && (
            <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {order.participantName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDelayed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold animate-pulse">
              DELAYED
            </span>
          )}
          {isUrgent && !isDelayed && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              URGENT
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
        <Clock className="w-4 h-4" />
        <span>{order.waitTimeMinutes}m</span>
        <span className="mx-1">•</span>
        <UtensilsCrossed className="w-4 h-4" />
        <span>{order.itemCount} items</span>
      </div>

      {order.stationProgress.length > 0 && (
        <div className="mb-3 space-y-1">
          {order.stationProgress.map((station) => (
            <div key={station.stationId} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{station.stationName}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{station.readyCount}/{station.itemCount}</span>
                {station.allReady ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-orange-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {onPickup && (
        <button
          onClick={() => onPickup(order.id)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" />
          Mark as Picked Up
        </button>
      )}

      {onDeliver && (
        <button
          onClick={() => onDeliver(order.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Mark as Delivered
        </button>
      )}
    </div>
  )
}

export default function WaiterDashboard({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [queue, setQueue] = useState<WaiterQueue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/waiter/queue')
      if (!res.ok) throw new Error('Failed to fetch queue')
      const data = await res.json()
      setQueue(data.queue)
      setError(null)
    } catch (err) {
      console.error('Error fetching queue:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Subscribe to Heart Pulse events for live updates
  const channel = `private-business-${businessId}`
  useRealtimeMulti([
    { channel, event: 'order.created', onData: fetchQueue },
    { channel, event: 'order.updated', onData: fetchQueue },
    { channel, event: 'order.ready_for_pickup', onData: fetchQueue },
    { channel, event: 'order.picked_up', onData: fetchQueue },
    { channel, event: 'order.delivered', onData: fetchQueue },
    { channel, event: 'kitchen.status.changed', onData: fetchQueue },
    { channel, event: 'item.status.changed', onData: fetchQueue },
  ])

  const handlePickup = async (orderId: string) => {
    try {
      const res = await fetch('/api/waiter/pickup-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) throw new Error('Failed to pickup order')
      await fetchQueue()
    } catch (err) {
      console.error('Error picking up order:', err)
      showToast('error', 'Failed to mark order as picked up')
    }
  }

  const handleDeliver = async (orderId: string) => {
    try {
      const res = await fetch('/api/waiter/deliver-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) throw new Error('Failed to deliver order')
      await fetchQueue()
    } catch (err) {
      console.error('Error delivering order:', err)
      showToast('error', 'Failed to mark order as delivered')
    }
  }

  if (loading && !queue) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const urgentCount = queue ? [
    ...queue.readyForPickup,
    ...queue.preparing,
  ].filter(o => o.priority === 'urgent' || o.priority === 'delayed').length : 0

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Waiter Dashboard</h1>
            <p className="text-sm text-slate-600">Real-time order queue</p>
          </div>
          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {urgentCount > 0 && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-400 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-bold text-orange-900">Attention Required</p>
              <p className="text-sm text-orange-700">{urgentCount} order{urgentCount > 1 ? 's' : ''} need{urgentCount === 1 ? 's' : ''} immediate attention</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ready for Pickup - Highest Priority */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-green-700" />
              <h2 className="font-bold text-green-900">Ready for Pickup</h2>
              <span className="ml-auto bg-green-200 text-green-800 text-sm font-bold px-2 py-1 rounded-full">
                {queue?.readyForPickup.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {queue?.readyForPickup.map((order) => (
                <OrderCard key={order.id} order={order} onPickup={handlePickup} businessId={businessId} />
              ))}
              {(!queue?.readyForPickup.length) && (
                <p className="text-sm text-green-700 text-center py-8">No orders ready</p>
              )}
            </div>
          </div>

          {/* Picked Up - Awaiting Delivery */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-blue-700" />
              <h2 className="font-bold text-blue-900">Picked Up</h2>
              <span className="ml-auto bg-blue-200 text-blue-800 text-sm font-bold px-2 py-1 rounded-full">
                {queue?.pickedUp.length || 0}
              </span>
            </div>
            <div className="space-y-3">
              {queue?.pickedUp.map((order) => (
                <OrderCard key={order.id} order={order} onDeliver={handleDeliver} businessId={businessId} />
              ))}
              {(!queue?.pickedUp.length) && (
                <p className="text-sm text-blue-700 text-center py-8">No orders in transit</p>
              )}
            </div>
          </div>

          {/* Preparing - Informational */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-orange-700" />
              <h2 className="font-bold text-orange-900">Preparing</h2>
              <span className="ml-auto bg-orange-200 text-orange-800 text-sm font-bold px-2 py-1 rounded-full">
                {queue?.preparing.length || 0}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queue?.preparing.map((order) => (
                <OrderCard key={order.id} order={order} businessId={businessId} />
              ))}
              {(!queue?.preparing.length) && (
                <p className="text-sm text-orange-700 text-center py-8">No orders in preparation</p>
              )}
            </div>
          </div>
        </div>

        {/* Completed Orders - Collapsed View */}
        {queue && queue.delivered.length > 0 && (
          <div className="mt-6 bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-slate-600" />
              <h2 className="font-bold text-slate-700">Delivered Today</h2>
              <span className="ml-auto bg-slate-200 text-slate-700 text-sm font-bold px-2 py-1 rounded-full">
                {queue.delivered.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">Orders successfully delivered to customers</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
