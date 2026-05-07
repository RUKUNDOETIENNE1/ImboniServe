import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Calendar, Clock, ShoppingBag, Plus, Minus, Check } from 'lucide-react'
import Card from '@/components/ui/Card'

export default function PreOrderPage() {
  const router = useRouter()
  const { businessId } = router.query

  const [business, setBusiness] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    if (businessId) {
      fetchBusiness()
      fetchMenu()
    }
  }, [businessId])

  async function fetchBusiness() {
    try {
      const res = await fetch(`/api/businesses/${businessId}`)
      if (res.ok) {
        const data = await res.json()
        setBusiness(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch business:', error)
    }
  }

  async function fetchMenu() {
    try {
      const res = await fetch(`/api/menu/${businessId}`)
      if (res.ok) {
        const data = await res.json()
        setMenu(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    }
  }

  function addToCart(item: any) {
    const existing = cart.find(c => c.menuItemId === item.id)
    if (existing) {
      setCart(cart.map(c => 
        c.menuItemId === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ))
    } else {
      setCart([...cart, { menuItemId: item.id, name: item.name, price: item.priceCents, quantity: 1 }])
    }
  }

  function removeFromCart(menuItemId: string) {
    const existing = cart.find(c => c.menuItemId === menuItemId)
    if (existing && existing.quantity > 1) {
      setCart(cart.map(c => 
        c.menuItemId === menuItemId 
          ? { ...c, quantity: c.quantity - 1 }
          : c
      ))
    } else {
      setCart(cart.filter(c => c.menuItemId !== menuItemId))
    }
  }

  async function submitPreOrder() {
    if (!scheduledDate || !scheduledTime) {
      setMessage({ text: 'Please select date and time', type: 'error' })
      return
    }

    if (cart.length === 0) {
      setMessage({ text: 'Cart is empty', type: 'error' })
      return
    }

    if (!customerName || !customerPhone) {
      setMessage({ text: 'Please provide your name and phone', type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)
      
      const res = await fetch('/api/pre-order/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          items: cart,
          scheduledAt: scheduledAt.toISOString(),
          customerName,
          customerPhone,
          orderType: 'TAKEAWAY'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ text: 'Pre-order placed successfully!', type: 'success' })
        setCart([])
        setTimeout(() => {
          router.push(`/order/confirmation?orderId=${data.data.order.id}`)
        }, 2000)
      } else {
        const error = await res.json()
        setMessage({ text: error.error || 'Failed to place pre-order', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'Network error', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Pre-Order</h1>
          {business && (
            <p className="text-slate-600">Order ahead from {business.name}</p>
          )}
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Menu</h2>
              <div className="space-y-3">
                {menu.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-sm font-semibold text-imboni-blue mt-2">
                        RWF {(item.priceCents / 100).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="ml-4 p-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Cart & Schedule */}
          <div className="space-y-6">
            {/* Schedule */}
            <Card>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-imboni-blue" />
                Schedule Pickup
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    min={minDateStr}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+250788123456"
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                  />
                </div>
              </div>
            </Card>

            {/* Cart */}
            <Card>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-imboni-blue" />
                Your Order
              </h2>
              {cart.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-600">
                          RWF {(item.price / 100).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="p-1 bg-slate-200 rounded hover:bg-slate-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => addToCart({ id: item.menuItemId, name: item.name, priceCents: item.price })}
                          className="p-1 bg-slate-200 rounded hover:bg-slate-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-slate-800">Total</span>
                      <span className="text-xl font-bold text-imboni-blue">
                        RWF {(total / 100).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={submitPreOrder}
                      disabled={loading || cart.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
                    >
                      <Check className="w-5 h-5" />
                      {loading ? 'Placing Order...' : 'Place Pre-Order'}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
