import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { Store, Package, ShoppingCart, TrendingUp, Search, Eye, DollarSign } from 'lucide-react'

export default function AdminMarketplace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/marketplace/orders'),
        fetch('/api/admin/marketplace/products')
      ])
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }
      
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'blue' },
    { label: 'Total Products', value: products.length, icon: Package, color: 'green' },
    { label: 'Revenue', value: `RWF ${orders.reduce((sum, o) => sum + (o.totalAmountCents || 0), 0) / 100}`, icon: DollarSign, color: 'purple' },
    { label: 'Active Products', value: products.filter(p => p.isAvailable).length, icon: TrendingUp, color: 'orange' }
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Marketplace Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage marketplace orders and products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Products ({products.length})
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Restaurant</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-slate-800">{order.orderNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-800">{order.restaurant?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">RWF {(order.totalAmountCents / 100).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No orders found</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{product.name}</h3>
                  <p className="text-sm text-slate-500">{product.category}</p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {product.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">{product.description || 'No description'}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Price per {product.unit}</p>
                  <p className="text-lg font-bold text-slate-800">RWF {(product.unitPriceCents / 100).toLocaleString()}</p>
                </div>
                <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No products found</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
