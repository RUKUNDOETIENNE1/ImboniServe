import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { Plus, Minus, Search, Utensils, Clock, User, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
}

interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

interface Table {
  id: string
  number: string
  seats: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

export default function TabletOrdering() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showCheckout, setShowCheckout] = useState(false)

  const tables: Table[] = [
    { id: '1', number: 'Table 1', seats: 4, status: 'AVAILABLE' },
    { id: '2', number: 'Table 2', seats: 2, status: 'OCCUPIED' },
    { id: '3', number: 'Table 3', seats: 6, status: 'AVAILABLE' },
    { id: '4', number: 'Table 4', seats: 4, status: 'RESERVED' },
    { id: '5', number: 'Table 5', seats: 8, status: 'AVAILABLE' },
  ]

  const menuItems: MenuItem[] = [
    { id: '1', name: 'Grilled Chicken', description: 'Marinated chicken with herbs', price: 12000, category: 'Main Course', available: true },
    { id: '2', name: 'Beef Burger', description: 'Juicy beef patty with cheese', price: 8000, category: 'Main Course', available: true },
    { id: '3', name: 'Caesar Salad', description: 'Fresh romaine with parmesan', price: 6000, category: 'Appetizers', available: true },
    { id: '4', name: 'French Fries', description: 'Crispy golden fries', price: 4000, category: 'Sides', available: true },
    { id: '5', name: 'Chocolate Cake', description: 'Rich chocolate dessert', price: 5000, category: 'Desserts', available: true },
    { id: '6', name: 'Iced Tea', description: 'Refreshing tea with lemon', price: 2000, category: 'Beverages', available: true },
    { id: '7', name: 'Pasta Carbonara', description: 'Creamy pasta with bacon', price: 10000, category: 'Main Course', available: false },
    { id: '8', name: 'Tomato Soup', description: 'Warm tomato basil soup', price: 4500, category: 'Appetizers', available: true },
  ]

  const categories = ['ALL', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory
    const isAvailable = item.available
    return matchesSearch && matchesCategory && isAvailable
  })

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = () => {
    // In production, this would send the order to the server
    console.log('Placing order:', { table: selectedTable, items: cart })
    toast.success(t('tablet.orderPlaced', 'Order placed successfully!'))
    setCart([])
    setSelectedTable(null)
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!selectedTable) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('tablet.selectTable', 'Select Table')}</h1>
            <p className="text-slate-600">{t('tablet.selectTableDesc', 'Choose a table to start ordering')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => table.status === 'AVAILABLE' && setSelectedTable(table)}
                disabled={table.status !== 'AVAILABLE'}
                className={`p-6 rounded-xl border-2 transition-all ${
                  table.status === 'AVAILABLE'
                    ? 'border-slate-200 hover:border-imboni-blue hover:bg-blue-50 cursor-pointer'
                    : table.status === 'OCCUPIED'
                    ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                    : 'border-yellow-300 bg-yellow-50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="text-center">
                  <Utensils className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <div className="font-bold text-lg text-slate-900">{table.number}</div>
                  <div className="text-sm text-slate-600">{table.seats} seats</div>
                  <div className={`mt-2 text-xs font-medium ${
                    table.status === 'AVAILABLE' ? 'text-green-600' :
                    table.status === 'OCCUPIED' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {t(`tablet.status.${table.status.toLowerCase()}`, table.status)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex h-screen">
        {/* Menu Section */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-sm text-slate-600 hover:text-slate-900 mb-2"
              >
                ← {t('tablet.changeTable', 'Change Table')}
              </button>
              <h1 className="text-2xl font-bold text-slate-900">{selectedTable.number}</h1>
              <p className="text-slate-600">{t('tablet.orderingFor', 'Ordering for')} {selectedTable.seats} {t('tablet.seats', 'seats')}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('tablet.searchMenu', 'Search menu...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-imboni-blue"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-imboni-blue text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t(`tablet.category.${category.replace(/\s+/g, '').toLowerCase()}`, category)}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-imboni-blue">
                      {item.price.toLocaleString()} RWF
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t('tablet.add', 'Add')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t('tablet.yourOrder', 'Your Order')}</h2>
              <span className="bg-imboni-blue text-white text-xs px-2 py-1 rounded-full">
                {cartCount} {t('tablet.items', 'items')}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('tablet.emptyCart', 'Your cart is empty')}</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{item.name}</h4>
                      <p className="text-sm text-slate-600">{item.price.toLocaleString()} RWF</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Check className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="ml-auto font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString()} RWF
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-slate-900">{t('tablet.total', 'Total')}</span>
              <span className="text-2xl font-bold text-imboni-blue">
                {cartTotal.toLocaleString()} RWF
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
              className="w-full py-3 bg-imboni-blue text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {t('tablet.placeOrder', 'Place Order')}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
