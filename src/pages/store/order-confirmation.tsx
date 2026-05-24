import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle, Package, Truck, Phone, MapPin, ArrowRight } from 'lucide-react'
// Note: confetti is dynamically imported client-side to avoid SSR issues

interface Order {
  id: string
  status: string
  totalCents: number
  deliveryAddress: string
  deliveryPhone: string
  createdAt: string
  supplier: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPriceCents: number
    subtotalCents: number
  }>
}

export default function OrderConfirmationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { orderIds } = router.query
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && orderIds) {
      fetchOrders()
      triggerConfetti()
    }
  }, [status, orderIds, router])

  const triggerConfetti = async () => {
    const confetti = (await import('canvas-confetti')).default
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const fetchOrders = async () => {
    try {
      const ids = (orderIds as string).split(',')
      const response = await fetch(`/api/marketplace/orders/details?ids=${ids.join(',')}`)
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

  if (loading || status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.totalCents, 0)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your order. We've sent confirmation details to your phone.
          </p>
        </div>

        {/* Order Summary Cards */}
        <div className="space-y-6 mb-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{order.supplier.name}</h2>
                    <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className="bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-imboni-blue" />
                  Order Items
                </h3>
                <div className="space-y-3 mb-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {(item.subtotalCents / 100).toLocaleString()} RWF
                      </p>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-imboni-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Delivery Address</p>
                      <p className="text-gray-900">{order.deliveryAddress}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-imboni-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Contact Phone</p>
                      <p className="text-gray-900">{order.deliveryPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Order Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      {(order.totalCents / 100).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        {orders.length > 1 && (
          <div className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 mb-1">Total for {orders.length} orders</p>
                <p className="text-3xl font-bold">{(totalAmount / 100).toLocaleString()} RWF</p>
              </div>
              <Truck className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-imboni-blue" />
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-imboni-blue text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Each supplier will review and confirm your order</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-imboni-blue text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>You'll receive SMS updates on order status</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-imboni-blue text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Suppliers will deliver to your specified address</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-imboni-blue text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Complete payment upon delivery (or via Mobile Money if selected)</span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/store/orders')}
            className="flex-1 bg-gradient-to-r from-imboni-blue to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            View Order History
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/store')}
            className="flex-1 bg-white text-imboni-blue border-2 border-imboni-blue font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
