import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { Building2, MapPin, Phone, Users, DollarSign, Search, Filter, Eye } from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function AdminRestaurants() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchRestaurants()
    }
  }, [status])

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/admin/restaurants')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data.restaurants || [])
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
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

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && r.isActive) ||
                         (filterStatus === 'inactive' && !r.isActive)
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: 'Total Restaurants', value: restaurants.length, color: 'blue' },
    { label: 'Active', value: restaurants.filter(r => r.isActive).length, color: 'green' },
    { label: 'Inactive', value: restaurants.filter(r => !r.isActive).length, color: 'red' },
    { label: 'This Month', value: restaurants.filter(r => {
      const created = new Date(r.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length, color: 'purple' }
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Restaurant Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all restaurants on the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'active'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search restaurants..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Restaurant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-imboni-blue to-blue-600 flex items-center justify-center text-white font-semibold">
                        {restaurant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{restaurant.name}</p>
                        <p className="text-sm text-slate-500">{restaurant.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {restaurant.city}, {restaurant.country}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-800">{restaurant.owner?.name || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{restaurant.owner?.email || ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {restaurant.plan?.name || 'No Plan'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      restaurant.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {restaurant.isActive ? '● Active' : '○ Inactive'}
                    </span>
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
          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No restaurants found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
