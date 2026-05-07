import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle, MapPin, Phone, CreditCard, Truck, AlertCircle, Loader } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface CartItem {
  productId: string
  productName: string
  supplierId: string
  supplierName: string
  category: string
  unit: string
  unitPriceCents: number
  quantity: number
}

interface GroupedOrder {
  [supplierId: string]: {
    supplierName: string
    items: CartItem[]
    subtotal: number
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { cart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money'>('mobile_money')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/store/checkout')
    } else if (status === 'authenticated') {
      if (cart.length === 0) {
        router.push('/store/cart')
      }
      loadBusinessInfo()
    }
  }, [status, router, cart])

  const loadBusinessInfo = async () => {
    try {
      const response = await fetch('/api/business/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.business) {
          setDeliveryAddress(data.business.address || '')
        }
      }
    } catch (error) {
      console.error('Failed to load business info:', error)
    }
  }

  const groupBySupplier = (): GroupedOrder => {
    return cart.reduce((acc, item) => {
      if (!acc[item.supplierId]) {
        acc[item.supplierId] = {
          supplierName: item.supplierName,
          items: [],
          subtotal: 0
        }
      }
      acc[item.supplierId].items.push(item)
      acc[item.supplierId].subtotal += item.unitPriceCents * item.quantity
      return acc
    }, {} as GroupedOrder)
  }

  const getTotalCents = () => {
    return cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  }

  const placeOrder = async () => {
    if (!deliveryAddress || !deliveryPhone) {
      alert('Please fill in delivery address and phone number')
      return
    }

    setPlacingOrder(true)

    try {
      const groupedOrders = groupBySupplier()

      const response = await fetch('/api/marketplace/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: Object.entries(groupedOrders).map(([supplierId, group]) => ({
            supplierId,
            items: group.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents
            })),
            deliveryAddress,
            deliveryPhone,
            deliveryNotes,
            paymentMethod
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to place order')
      }

      const data = await response.json()

      // Clear cart
      clearCart()

      // Redirect to confirmation
      router.push(`/store/order-confirmation?orderIds=${data.orderIds.join(',')}`)
    } catch (error) {
      console.error('Order placement error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  const groupedOrders = groupBySupplier()
  const totalCents = getTotalCents()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Checkout
          </h1>
          <p className="text-gray-600 mt-2">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-6 h-6 text-imboni-blue" />
                Delivery Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      placeholder="+250 XXX XXX XXX"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Any special instructions for delivery..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-imboni-blue focus:border-imboni-blue transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-imboni-orange" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="mobile_money"
                    checked={paymentMethod === 'mobile_money'}
                    onChange={() => setPaymentMethod('mobile_money')}
                    className="w-5 h-5 text-imboni-blue"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Mobile Money</p>
                    <p className="text-sm text-gray-600">Pay via MTN Mobile Money or Airtel Money</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="w-5 h-5 text-imboni-blue"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Review */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Review</h2>

              <div className="space-y-4">
                {Object.entries(groupedOrders).map(([supplierId, group]) => (
                  <div key={supplierId} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-2">{group.supplierName}</h3>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.productName} × {item.quantity} {item.unit}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {((item.unitPriceCents * item.quantity) / 100).toLocaleString()} RWF
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between font-semibold">
                      <span>Subtotal</span>
                      <span>{(group.subtotal / 100).toLocaleString()} RWF</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{(totalCents / 100).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-semibold">TBD</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{(totalCents / 100).toLocaleString()} RWF</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">+ delivery fees to be confirmed</p>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placingOrder || !deliveryAddress || !deliveryPhone}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {placingOrder ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/store/cart')}
                className="w-full text-imboni-blue hover:text-blue-700 font-semibold py-2"
              >
                ← Back to Cart
              </button>

              {/* Security Notice */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-semibold mb-1">Secure Checkout</p>
                    <p className="text-green-700">Your order information is encrypted and secure.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
