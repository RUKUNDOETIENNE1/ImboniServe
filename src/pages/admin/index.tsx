import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useTranslation } from '@/lib/i18n'
import AdminLayout from '@/components/AdminLayout'
import { 
  Building2, Users, ShoppingCart, DollarSign, 
  TrendingUp, Package, Store, Activity, ArrowUpRight, CreditCard 
} from 'lucide-react'
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  if (!roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      const userRoles = (session?.user as any)?.roles || []
      if (!userRoles.includes('ADMIN')) {
        router.push('/dashboard')
      } else {
        fetchOverview()
      }
    }
  }, [status, session, router])

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/overview')
      if (response.ok) {
        const data = await response.json()
        setOverview(data)
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const stats = [
    {
      label: t('total_restaurants', 'Total Restaurants'),
      value: overview?.totalRestaurants || 0,
      icon: Building2,
      color: 'blue'
    },
    {
      label: t('total_users', 'Total Users'),
      value: overview?.totalUsers || 0,
      icon: Users,
      color: 'green'
    },
    {
      label: t('total_orders', 'Total Orders'),
      value: (overview?.totalSales || 0) + (overview?.totalMarketplaceOrders || 0),
      icon: ShoppingCart,
      color: 'purple'
    },
    {
      label: t('payment_transactions', 'Payment Transactions'),
      value: overview?.totalPayments || 0,
      icon: CreditCard,
      color: 'yellow'
    }
  ]

  const colorClasses: Record<string, { text: string; bg: string; icon: string }> = {
    blue: { text: 'text-imboni-blue', bg: 'bg-blue-50', icon: 'text-imboni-blue' },
    green: { text: 'text-imboni-green', bg: 'bg-green-50', icon: 'text-imboni-green' },
    purple: { text: 'text-imboni-orange', bg: 'bg-orange-50', icon: 'text-imboni-orange' },
    yellow: { text: 'text-imboni-gold', bg: 'bg-yellow-50', icon: 'text-imboni-gold' }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('platform_overview', 'Platform Overview')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('welcome', 'Welcome')}, {session?.user?.name}</p>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const classes = colorClasses[stat.color] || colorClasses.blue

            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <div className={`p-3 ${classes.bg} rounded-xl`}>
                    <Icon className={`w-6 h-6 ${classes.icon}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${classes.text}`}>
                  {stat.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+12% this month</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t('manage_tenants', 'Manage Tenants')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('total_restaurants', 'Total Restaurants')}: {overview?.totalRestaurants || 0}
            </p>
            <button
              onClick={() => router.push('/admin/restaurants')}
              className="w-full bg-gradient-to-r from-imboni-blue to-blue-600 text-white py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              {t('view_details', 'View Details')}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('manage_users', 'Manage Users')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('total_users', 'Total Users')}: {overview?.totalUsers || 0}
            </p>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full bg-gradient-to-r from-imboni-green to-green-600 text-white py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all"
            >
              {t('view_details', 'View Details')}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Store className="w-5 h-5" />
              {t('marketplace', 'Marketplace')} {t('metrics', 'Metrics')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('total_orders', 'Total Orders')}: {overview?.totalMarketplaceOrders || 0}
            </p>
            <button
              onClick={() => router.push('/admin/marketplace')}
              className="w-full bg-gradient-to-r from-imboni-orange to-orange-500 text-white py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
            >
              {t('view_details', 'View Details')}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('subscription', 'Subscriptions')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('active', 'Active')}: {overview?.activeSubscriptions || 0}
            </p>
            <button
              onClick={() => router.push('/admin/subscriptions')}
              className="w-full bg-gradient-to-r from-imboni-gold to-yellow-500 text-white py-2.5 rounded-xl hover:shadow-lg hover:shadow-yellow-200 transition-all"
            >
              {t('view_details', 'View Details')}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('payment_monitoring', 'Payment Monitoring')}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">InTouch (Mobile Money)</span>
                <span className="font-semibold text-green-600">{overview?.intouchPayments || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IremboPay (Cards)</span>
                <span className="font-semibold text-blue-600">{overview?.iremboPayments || 0}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600 font-medium">Total Transactions</span>
                <span className="font-bold text-slate-900">{overview?.totalPayments || 0}</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/analytics')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              {t('view_analytics', 'View Analytics')}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
