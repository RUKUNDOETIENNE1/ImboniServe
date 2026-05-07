import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { User, Heart, ShoppingBag, Star, TrendingUp, Award } from 'lucide-react'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import Card from '@/components/ui/Card'

export default function CustomerProfilePage() {
  const router = useRouter()
  const { id } = router.query

  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchCustomer()
      fetchOrders()
      fetchFavorites()
    }
  }, [id])

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error)
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/customers/${id}/orders`)
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

  async function fetchFavorites() {
    try {
      const res = await fetch(`/api/customers/${id}/favorites`)
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  if (loading || !customer) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  const vipBenefits: Record<string, any> = {
    NONE: { discount: 0, pointsMultiplier: 1, color: 'slate' },
    BRONZE: { discount: 5, pointsMultiplier: 1.2, color: 'amber' },
    SILVER: { discount: 10, pointsMultiplier: 1.5, color: 'slate' },
    GOLD: { discount: 15, pointsMultiplier: 2, color: 'yellow' },
    PLATINUM: { discount: 20, pointsMultiplier: 3, color: 'purple' }
  }

  const tierInfo = vipBenefits[customer.vipTier || 'NONE']

  const stats = [
    { label: 'Total Spent', value: `RWF ${(customer.lifetimeSpendCents / 100).toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { label: 'Total Orders', value: customer.visitCount, icon: ShoppingBag, color: 'blue' },
    { label: 'Loyalty Points', value: customer.loyaltyPoints.toLocaleString(), icon: Star, color: 'orange' },
    { label: 'VIP Tier', value: customer.vipTier || 'NONE', icon: Award, color: tierInfo.color }
  ]

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <User className="w-6 h-6 text-imboni-blue" />
              {customer.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{customer.phone} • {customer.email || 'No email'}</p>
          </div>
          {customer.vipTier && customer.vipTier !== 'NONE' && (
            <div className={`px-4 py-2 bg-${tierInfo.color}-100 text-${tierInfo.color}-700 rounded-xl font-semibold flex items-center gap-2`}>
              <Award className="w-5 h-5" />
              {customer.vipTier} VIP
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </Card>
          )
        })}
      </div>

      {/* VIP Benefits */}
      {customer.vipTier && customer.vipTier !== 'NONE' && (
        <Card className={`mb-6 border-${tierInfo.color}-200 bg-${tierInfo.color}-50`}>
          <h2 className="text-xl font-bold text-slate-800 mb-4">VIP Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-slate-600">Discount</p>
              <p className="text-2xl font-bold text-imboni-blue">{tierInfo.discount}%</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-sm text-slate-600">Points Multiplier</p>
              <p className="text-2xl font-bold text-imboni-blue">{tierInfo.pointsMultiplier}x</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorite Items */}
        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorite Items
          </h2>
          {favorites.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No favorites yet</p>
          ) : (
            <div className="space-y-3">
              {favorites.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">Ordered {item.orderCount} times</p>
                  <p className="text-sm font-semibold text-imboni-blue mt-1">
                    RWF {(item.priceCents / 100).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Order History */}
        <Card>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-imboni-blue" />
            Recent Orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTimeRW(new Date(order.createdAt))}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-imboni-blue">
                    RWF {(order.totalAmountCents / 100).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
