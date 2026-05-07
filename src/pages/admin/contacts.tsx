import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { 
  Users, Search, Filter, Download, Eye, Building2, 
  TrendingUp, Activity, UserCircle, MapPin
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Link from 'next/link'

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  type: string
  status: string
  city?: string
  activityScore: number
  business: {
    id: string
    name: string
  }
  createdAt: string
}

interface AdminContactStats {
  totalContacts: number
  totalBusinesses: number
  activeContacts: number
  contactsByType: Record<string, number>
  topCities: Array<{ city: string; count: number }>
}

export default function AdminContactsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<AdminContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const userRoles = (session.user as any)?.roles || []
    if (!userRoles.includes('ADMIN')) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchContacts()
      fetchStats()
    }
  }, [session, selectedType, selectedCity, page])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }

      if (selectedCity !== 'all') {
        params.append('city', selectedCity)
      }

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await fetch(`/api/admin/contacts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/contacts/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchContacts()
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLIENT: 'bg-blue-100 text-blue-700',
      SUPPLIER: 'bg-green-100 text-green-700',
      STAFF: 'bg-purple-100 text-purple-700',
      CUSTOMER: 'bg-amber-100 text-amber-700',
      PARTNER: 'bg-cyan-100 text-cyan-700',
      LEAD: 'bg-orange-100 text-orange-700',
    }
    return colors[type] || 'bg-slate-100 text-slate-700'
  }

  if (status === 'loading' || !session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Platform Contact Management
          </h1>
          <p className="text-slate-600">
            View and manage contacts across all businesses
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.totalContacts.toLocaleString()}
              </h3>
              <p className="text-sm text-slate-600">Total Contacts</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.totalBusinesses}
              </h3>
              <p className="text-sm text-slate-600">Businesses Using CMS</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.activeContacts}
              </h3>
              <p className="text-sm text-slate-600">Active Contacts</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {stats.topCities?.[0]?.city || 'N/A'}
              </h3>
              <p className="text-sm text-slate-600">Top City</p>
            </Card>
          </div>
        )}

        {/* Type Breakdown */}
        {stats && stats.contactsByType && (
          <Card className="p-6 mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">Contacts by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.contactsByType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className={`px-3 py-2 rounded-lg ${getTypeColor(type)}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs mt-1">{type}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="CLIENT">Client</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="STAFF">Staff</option>
            <option value="CUSTOMER">Customer</option>
            <option value="PARTNER">Partner</option>
            <option value="LEAD">Lead</option>
          </select>

          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Cities</option>
            {stats?.topCities?.map(({ city }) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {/* Contacts Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Activity Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800">{contact.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {contact.phone && (
                              <span className="text-xs text-slate-400">{contact.phone}</span>
                            )}
                            {contact.email && (
                              <span className="text-xs text-slate-400">{contact.email}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/restaurants?id=${contact.business.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {contact.business.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(contact.type)}`}>
                          {contact.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {contact.status}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {contact.city || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {Math.round(contact.activityScore)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
