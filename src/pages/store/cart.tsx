import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, AlertCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import CurrencyDisplay from '@/components/CurrencyDisplay'

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

interface GroupedCart {
  [supplierId: string]: {
    supplierName: string
    items: CartItem[]
    subtotal: number
  }
}

export default function CartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { cart, updateQuantity: updateQty, removeFromCart: removeItem, clearCart: clear } = useCart()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/store/cart')
    }
  }, [status, router])

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId)
    if (item) {
      updateQty(productId, Math.max(1, item.quantity + delta))
    }
  }

  const groupBySupplier = (): GroupedCart => {
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
    }, {} as GroupedCart)
  }

  const MINIMUM_ORDER_CENTS = 5000 // 5,000 RWF minimum order

  const getTotalCents = () => {
    return cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) return
    const total = getTotalCents()
    if (total < MINIMUM_ORDER_CENTS) {
      alert(`Minimum order value is ${(MINIMUM_ORDER_CENTS / 100).toLocaleString()} RWF. Please add ${((MINIMUM_ORDER_CENTS - total) / 100).toLocaleString()} RWF more to proceed.`)
      return
    }
    router.push('/store/checkout')
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p>Loading...</p>
      </div>
    )
  }

  const groupedCart = groupBySupplier()
  const totalCents = getTotalCents()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-imboni-orange" />
            Shopping Cart
          </h1>
          <p className="text-gray-600 mt-2">Review your items and proceed to checkout</p>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add products from the marketplace to get started</p>
            <button
              onClick={() => router.push('/store')}
              className="bg-gradient-to-r from-imboni-blue to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(groupedCart).map(([supplierId, group]) => (
                <div key={supplierId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Supplier Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900">{group.supplierName}</h3>
                    <p className="text-sm text-gray-600">
                      {group.items.length} item{group.items.length > 1 ? 's' : ''} · Subtotal: {(group.subtotal / 100).toLocaleString()} RWF
                    </p>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div key={item.productId} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.productName}</h4>
                            <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-imboni-orange">
                                {(item.unitPriceCents / 100).toLocaleString()} RWF
                              </span>
                              <span className="text-sm text-gray-500">per {item.unit}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, -1)}
                                className="p-2 hover:bg-white rounded transition-colors"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4 text-gray-600" />
                              </button>
                              <span className="w-12 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.productId, 1)}
                                className="p-2 hover:bg-white rounded transition-colors"
                              >
                                <Plus className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="w-32 text-right">
                              <p className="text-sm text-gray-500">Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                {((item.unitPriceCents * item.quantity) / 100).toLocaleString()} RWF
                              </p>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Clear Cart */}
              <button
                onClick={clear}
                className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear entire cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.length})</span>
                    <span><CurrencyDisplay amount={totalCents} inCents={true} /></span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600 font-semibold">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Subtotal</span>
                      <span><CurrencyDisplay amount={totalCents} inCents={true} /></span>
                    </div>
                  </div>
                </div>

                {/* Minimum Order Warning */}
                {totalCents < MINIMUM_ORDER_CENTS && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900">
                        <p className="font-semibold mb-1">Minimum order not met</p>
                        <p className="text-yellow-700">
                          Add {((MINIMUM_ORDER_CENTS - totalCents) / 100).toLocaleString()} RWF more to reach the minimum order of {(MINIMUM_ORDER_CENTS / 100).toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={proceedToCheckout}
                  disabled={totalCents < MINIMUM_ORDER_CENTS}
                  className={`w-full font-bold py-4 px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 mb-4 ${
                    totalCents < MINIMUM_ORDER_CENTS
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-imboni-orange to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => router.push('/store')}
                  className="w-full text-imboni-blue hover:text-blue-700 font-semibold py-2"
                >
                  ← Continue Shopping
                </button>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Orders grouped by supplier</p>
                      <p className="text-blue-700">Each supplier will process their items separately for faster delivery.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
