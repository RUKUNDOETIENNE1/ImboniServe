import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { 
  Users, TrendingUp, DollarSign, Calendar, Filter, Download,
  Star, AlertCircle, CheckCircle, XCircle, Search, Mail, Phone
} from 'lucide-react'
import Card from '@/components/ui/Card'
import CurrencyDisplay from '@/components/CurrencyDisplay'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  firstOrderDate: string
  avgOrderValue: number
  rfmScore: number
  segment: 'Champions' | 'Loyal' | 'At Risk' | 'Lost' | 'New' | 'Promising'
  recencyScore: number
  frequencyScore: number
  monetaryScore: number
}

export default function CustomerCRM() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalCustomers: 0,
    champions: 0,
    atRisk: 0,
    lost: 0,
    avgLifetimeValue: 0,
    retentionRate: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [selectedSegment])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/customers?segment=${selectedSegment}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const segments = [
    { name: 'All', value: 'all', color: 'slate', icon: Users },
    { name: 'Champions', value: 'Champions', color: 'green', icon: Star },
    { name: 'Loyal', value: 'Loyal', color: 'blue', icon: CheckCircle },
    { name: 'At Risk', value: 'At Risk', color: 'amber', icon: AlertCircle },
    { name: 'Lost', value: 'Lost', color: 'red', icon: XCircle },
    { name: 'New', value: 'New', color: 'purple', icon: Users },
    { name: 'Promising', value: 'Promising', color: 'cyan', icon: TrendingUp }
  ]

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      'Champions': 'bg-green-100 text-green-700 border-green-200',
      'Loyal': 'bg-blue-100 text-blue-700 border-blue-200',
      'At Risk': 'bg-amber-100 text-amber-700 border-amber-200',
      'Lost': 'bg-red-100 text-red-700 border-red-200',
      'New': 'bg-purple-100 text-purple-700 border-purple-200',
      'Promising': 'bg-cyan-100 text-cyan-700 border-cyan-200'
    }
    return colors[segment] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {t('crm.title', 'Customer Relationship Management')}
          </h1>
          <p className="text-slate-600">
            {t('crm.subtitle', 'Segment, analyze, and engage your customers with RFM intelligence')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {stats.totalCustomers.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">{t('crm.total_customers', 'Total Customers')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {stats.champions}
            </h3>
            <p className="text-sm text-slate-600">{t('crm.champions', 'Champions')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {stats.atRisk}
            </h3>
            <p className="text-sm text-slate-600">{t('crm.at_risk', 'At Risk')}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              <CurrencyDisplay amount={stats.avgLifetimeValue} />
            </h3>
            <p className="text-sm text-slate-600">{t('crm.avg_ltv', 'Avg Lifetime Value')}</p>
          </Card>
        </div>

        {/* Segment Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {segments.map(seg => {
            const Icon = seg.icon
            const isActive = selectedSegment === seg.value
            return (
              <button
                key={seg.value}
                onClick={() => setSelectedSegment(seg.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? `bg-${seg.color}-600 text-white shadow-lg`
                    : `bg-white text-slate-700 border border-slate-200 hover:border-${seg.color}-300`
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {seg.name}
              </button>
            )
          })}
        </div>

        {/* Search & Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('crm.search_placeholder', 'Search by name, phone, or email...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-imboni-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('common.export', 'Export')}
          </button>
        </div>

        {/* Customer Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.customer', 'Customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.segment', 'Segment')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.orders', 'Orders')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.total_spent', 'Total Spent')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.avg_order', 'Avg Order')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.last_order', 'Last Order')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('crm.rfm_score', 'RFM Score')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t('common.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      {t('common.loading', 'Loading...')}
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      {t('crm.no_customers', 'No customers found')}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800">{customer.name}</p>
                          <p className="text-sm text-slate-500">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-slate-400">{customer.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSegmentColor(customer.segment)}`}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {customer.totalOrders}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <CurrencyDisplay amount={customer.totalSpent} />
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <CurrencyDisplay amount={customer.avgOrderValue} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(customer.lastOrderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-slate-800">
                            {customer.rfmScore}
                          </div>
                          <div className="text-xs text-slate-500">
                            R:{customer.recencyScore} F:{customer.frequencyScore} M:{customer.monetaryScore}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Send Email">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </button>
                          <button className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Call">
                            <Phone className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
