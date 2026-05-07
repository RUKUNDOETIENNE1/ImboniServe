import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Package, Clock, CheckCircle, XCircle, Truck, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import CurrencyDisplay from '@/components/CurrencyDisplay'

interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPriceCents: number
  subtotalCents: number
}

interface Order {
  id: string
  status: string
  totalCents: number
  deliveryAddress: string
  deliveryPhone: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
  supplier: {
    id: string
    name: string
    phone?: string
  }
  items: OrderItem[]
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/marketplace/orders/list')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />
      case 'cancelled':
        return <XCircle className="w-5 h-5" />
      default:
        return <Truck className="w-5 h-5" />
    }
  }

  if (loading || status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-imboni-blue" />
            Order History
          </h1>
          <p className="text-gray-600 mt-2">View and track all your marketplace orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your order history here</p>
            <button
              onClick={() => router.push('/store')}
              className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id)
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  {/* Order Header - Always Visible */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{order.supplier.name}</h3>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Order ID:</span> #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-semibold">Items:</span> {order.items.length}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total</p>
                          <p className="text-2xl font-bold text-imboni-orange">
                            <CurrencyDisplay amount={order.totalCents} inCents={true} />
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details - Expandable */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      {/* Order Items */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package className="w-5 h-5 text-imboni-blue" />
                          Order Items
                        </h4>
                        <div className="bg-white rounded-lg divide-y divide-gray-100">
                          {order.items.map((item) => (
                            <div key={item.id} className="p-4 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">{item.productName}</p>
                                <p className="text-sm text-gray-600">
                                  <CurrencyDisplay amount={item.unitPriceCents} inCents={true} /> × {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                <CurrencyDisplay amount={item.subtotalCents} inCents={true} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-imboni-orange" />
                            Delivery Address
                          </h4>
                          <p className="text-gray-700">{order.deliveryAddress}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-imboni-orange" />
                            Contact Information
                          </h4>
                          <p className="text-gray-700 mb-1">Phone: {order.deliveryPhone}</p>
                          {order.supplier.phone && (
                            <p className="text-sm text-gray-600">Supplier: {order.supplier.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Payment Information */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Method:</span>
                            <span className="ml-2 font-semibold text-gray-900">
                              {order.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Cash on Delivery'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className={`ml-2 font-semibold ${
                              order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => router.push(`/store/supplier/${order.supplier.id}`)}
                          className="flex-1 bg-imboni-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Supplier
                        </button>
                        <button
                          onClick={() => router.push('/store')}
                          className="flex-1 bg-white text-imboni-blue border-2 border-imboni-blue font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Order Again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
