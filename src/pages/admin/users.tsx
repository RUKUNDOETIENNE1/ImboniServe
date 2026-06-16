import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { Users, Search, Mail, Phone, Shield, Eye, Ban } from 'lucide-react'

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

export default function AdminUsers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || u.roles.includes(filterRole.toUpperCase())
    return matchesSearch && matchesRole
  })

  const stats = [
    { label: 'Total Users', value: users.length, color: 'blue' },
    { label: 'Active', value: users.filter(u => u.isActive).length, color: 'green' },
    { label: 'Owners', value: users.filter(u => u.roles.includes('OWNER')).length, color: 'purple' },
    { label: 'Staff', value: users.filter(u => u.roles.includes('CASHIER') || u.roles.includes('KITCHEN_MANAGER')).length, color: 'orange' }
  ]

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('ADMIN')) return { text: 'Admin', color: 'bg-purple-100 text-purple-700' }
    if (roles.includes('OWNER')) return { text: 'Owner', color: 'bg-blue-100 text-blue-700' }
    if (roles.includes('CASHIER')) return { text: 'Cashier', color: 'bg-green-100 text-green-700' }
    if (roles.includes('KITCHEN_MANAGER')) return { text: 'Kitchen', color: 'bg-orange-100 text-orange-700' }
    return { text: 'User', color: 'bg-slate-100 text-slate-700' }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all platform users</p>
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
            {['all', 'owner', 'cashier', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filterRole === role
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search users..." 
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
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Restaurant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => {
                const roleBadge = getRoleBadge(user.roles)
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-800">{user.restaurant?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                        {roleBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors">
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No users found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
