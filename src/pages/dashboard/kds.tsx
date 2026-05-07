import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { Clock, CheckCircle, AlertCircle, ChefHat, Flame, Timer, Volume2, VolumeX } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface OrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  modifiers?: string[]
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
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY'>('ALL')
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Mock data - replace with real-time API
  useEffect(() => {
    const mockOrders: KitchenOrder[] = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        table: 'Table 5',
        items: [
          { id: '1', name: 'Grilled Chicken', quantity: 2, notes: 'No salt', modifiers: ['Extra sauce'] },
          { id: '2', name: 'Caesar Salad', quantity: 1 }
        ],
        status: 'NEW',
        priority: 'URGENT',
        orderTime: new Date(Date.now() - 2 * 60000),
        prepTime: 15,
        server: 'Alice'
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        table: 'Table 12',
        items: [
          { id: '3', name: 'Beef Burger', quantity: 3, modifiers: ['No onions', 'Extra cheese'] },
          { id: '4', name: 'French Fries', quantity: 3 }
        ],
        status: 'PREPARING',
        priority: 'NORMAL',
        orderTime: new Date(Date.now() - 8 * 60000),
        prepTime: 20,
        server: 'Bob'
      },
      {
        id: '3',
        orderNumber: 'ORD-003',
        table: 'Table 3',
        items: [
          { id: '5', name: 'Pasta Carbonara', quantity: 1 },
          { id: '6', name: 'Margherita Pizza', quantity: 1 }
        ],
        status: 'READY',
        priority: 'NORMAL',
        orderTime: new Date(Date.now() - 18 * 60000),
        prepTime: 25,
        server: 'Charlie'
      }
    ]
    setOrders(mockOrders)

    // Simulate real-time updates
    const interval = setInterval(() => {
      // In production, this would be a WebSocket or Pusher subscription
      console.log('Fetching new orders...')
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const updateOrderStatus = (orderId: string, newStatus: KitchenOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))

    // Play sound on status change
    if (soundEnabled) {
      playNotificationSound()
    }
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  const getFilteredOrders = () => {
    if (filter === 'ALL') return orders
    return orders.filter(order => order.status === filter)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'NORMAL': return 'bg-blue-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'border-l-4 border-l-blue-500'
      case 'PREPARING': return 'border-l-4 border-l-orange-500'
      case 'READY': return 'border-l-4 border-l-green-500'
      case 'SERVED': return 'border-l-4 border-l-slate-400'
      default: return ''
    }
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const filteredOrders = getFilteredOrders()

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
              <h1 className="text-2xl font-bold text-slate-900">{t('kds.title', 'Kitchen Display System')}</h1>
              <p className="text-sm text-slate-600">{t('kds.subtitle', 'Real-time order management')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
