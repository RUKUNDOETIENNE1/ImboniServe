import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { ShoppingCart, Clock, CheckCircle, XCircle, Filter, RefreshCw, MessageSquare, Smartphone, Monitor } from 'lucide-react'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import type { GetServerSideProps } from 'next'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type Order = {
  id: string
  orderNumber: string
  orderSource: string
  orderType: string
  status: string
  totalAmountCents: number
  createdAt: string
  table?: { number: string }
  notes?: string | null
  items: Array<{ quantity: number; menuItem: { name: string }; instructions?: any; instructionTags?: string[] }>
  user?: { name: string }
}

export default function UnifiedOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'>('ALL')
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'QR' | 'WHATSAPP' | 'POS'>('ALL')

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [filter, sourceFilter])

  async function fetchOrders() {
    try {
      const params = new URLSearchParams()
      if (filter !== 'ALL') params.append('status', filter)
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter)

      const res = await fetch(`/api/orders/unified?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const getSourceIcon = (source: string) => {
    if (source === 'QR') return <Smartphone className="w-4 h-4" />
    if (source === 'WHATSAPP') return <MessageSquare className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  const getSourceColor = (source: string) => {
    if (source === 'QR') return 'bg-blue-100 text-blue-700'
    if (source === 'WHATSAPP') return 'bg-green-100 text-green-700'
    return 'bg-slate-100 text-slate-700'
  }

  const getStatusColor = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (status === 'PREPARING') return 'bg-orange-100 text-orange-700'
    if (status === 'READY') return 'bg-green-100 text-green-700'
    if (status === 'COMPLETED') return 'bg-slate-100 text-slate-700'
    return 'bg-red-100 text-red-700'
  }

  const stats = [
    { label: t('unified_orders.total_orders'), value: orders.length, icon: ShoppingCart, color: 'blue' },
    { label: t('unified_orders.pending'), value: orders.filter(o => o.status === 'PENDING').length, icon: Clock, color: 'yellow' },
    { label: t('unified_orders.preparing'), value: orders.filter(o => o.status === 'PREPARING').length, icon: Clock, color: 'orange' },
    { label: t('unified_orders.ready'), value: orders.filter(o => o.status === 'READY').length, icon: CheckCircle, color: 'green' }
  ]

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-imboni-blue" />
              <span suppressHydrationWarning>{t('unified_orders.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1" suppressHydrationWarning>{t('unified_orders.subtitle')}</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span suppressHydrationWarning>{t('unified_orders.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            green: { bg: 'bg-green-100', text: 'text-green-600' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600' }
          }[stat.color] || { bg: 'bg-slate-100', text: 'text-slate-600' }

          return (
            <Card key={index}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('unified_orders.status')}</p>
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-imboni-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span suppressHydrationWarning>{t(`unified_orders.${status.toLowerCase()}`)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('unified_orders.source')}</p>
            <div className="flex gap-2">
              {['ALL', 'QR', 'WHATSAPP', 'POS'].map(source => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sourceFilter === source
                      ? 'bg-imboni-blue text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span suppressHydrationWarning>{t(`unified_orders.${source.toLowerCase()}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600" suppressHydrationWarning>{t('unified_orders.no_orders_found')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </h3>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(order.orderSource)}`}>
                      {getSourceIcon(order.orderSource)}
                      {order.orderSource}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500" suppressHydrationWarning>
                    {order.table ? `${t('unified_orders.table')} ${order.table.number}` : t('unified_orders.takeaway')} • {formatDateTimeRW(new Date(order.createdAt))}
                  </p>
                  {order.user && (
                    <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>{t('unified_orders.staff')}: {order.user.name}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('unified_orders.items')}:</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-600">
                      {item.quantity}x {item.menuItem.name}
                    </li>
                  ))}
                </ul>
              </div>

              {(order.notes || order.items.some(i => (i.instructions && (Array.isArray(i.instructions?.notes) ? i.instructions.notes.length > 0 : false)) || (i.instructionTags && i.instructionTags.length > 0))) && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2" suppressHydrationWarning>{t('unified_orders.instructions')}:</p>
                  <ul className="space-y-1">
                    {order.notes && (
                      <li className="text-sm text-slate-600">
                        <span className="font-medium" suppressHydrationWarning>{t('unified_orders.order')}:</span> {order.notes}
                      </li>
                    )}
                    {order.items.map((item, idx) => {
                      const notes: string[] = Array.isArray((item as any).instructions?.notes)
                        ? (item as any).instructions.notes
                        : []
                      const tags: string[] = Array.isArray(item.instructionTags) ? (item.instructionTags as string[]) : []
                      const hasAny = notes.length > 0 || tags.length > 0
                      if (!hasAny) return null
                      return (
                        <li key={`instr-${idx}`} className="text-sm text-slate-600">
                          <span className="font-medium">{item.quantity}x {item.menuItem.name}:</span>{' '}
                          {[...notes, ...(tags.length ? [`Tags: ${tags.join(', ')}`] : [])].join('; ')}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="font-semibold text-slate-800">
                  RWF {(order.totalAmountCents / 100).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                    >
                      <span suppressHydrationWarning>{t('unified_orders.start_preparing')}</span>
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      <span suppressHydrationWarning>{t('unified_orders.mark_ready')}</span>
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <span suppressHydrationWarning>{t('unified_orders.complete')}</span>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
