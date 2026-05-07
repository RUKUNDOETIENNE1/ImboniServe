import { useState, useEffect } from 'react'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import DateTimeDisplay from '@/components/DateTimeDisplay'
import { ShoppingCart, Plus, TrendingUp, DollarSign, Calendar, Download, Filter } from 'lucide-react'
import { useRouter } from 'next/router'
import Card from '@/components/ui/Card'
import { useTranslation } from '@/lib/i18n'

export default function Sales() {
  const { t } = useTranslation()
  const router = useRouter()
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    fetchSales()
  }, [dateFilter])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales?period=${dateFilter}`)
      if (res.ok) {
        const data = await res.json()
        setSalesData(data.sales || [])
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = salesData.reduce((sum, s) => sum + s.totalAmountCents, 0) / 100
  const totalOrders = salesData.length
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const cashSales = salesData.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.totalAmountCents, 0) / 100

  const stats = [
    { label: t('sales.todays_sales', "Today's Sales"), value: totalRevenue, change: '+12%', icon: DollarSign, color: 'green', isCurrency: true },
    { label: t('sales.total_orders', 'Total Orders'), value: totalOrders, change: '+8%', icon: ShoppingCart, color: 'blue', isCurrency: false },
    { label: t('sales.average_order', 'Average Order'), value: avgOrder, change: '+5%', icon: TrendingUp, color: 'purple', isCurrency: true },
    { label: t('sales.cash_sales', 'Cash Sales'), value: cashSales, change: '+15%', icon: DollarSign, color: 'orange', isCurrency: true },
  ]

  const getMethodColor = (method: string) => {
    if (method.includes('MTN')) return 'bg-yellow-100 text-yellow-700'
    if (method.includes('AIRTEL')) return 'bg-red-100 text-red-700'
    if (method === 'CASH') return 'bg-green-100 text-green-700'
    if (method.includes('CARD')) return 'bg-blue-100 text-blue-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-imboni-blue" />
              {t('sales.title', 'Sales')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{t('sales.subtitle', 'View and manage all sales transactions')}</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/sales/new')}
            className="bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 flex items-center gap-2 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('sales.new_sale', 'New Sale')}
          </button>
        </div>
      </div>

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
              <p className="text-3xl font-bold text-slate-800">
                {stat.isCurrency ? <CurrencyDisplay amount={stat.value} /> : stat.value}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">{stat.change} {t('sales.from_yesterday', 'from yesterday')}</p>
            </Card>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                dateFilter === 'today'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('sales.today', 'Today')}
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                dateFilter === 'week'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('sales.this_week', 'This Week')}
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                dateFilter === 'month'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('sales.this_month', 'This Month')}
            </button>
          </div>

          <div className="flex gap-2">
            <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <Calendar className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <button className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all">
              <Download className="w-4 h-4 mr-2" />
              {t('sales.export', 'Export')}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.order_id', 'Order ID')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.date_time', 'Date & Time')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.customer', 'Customer')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.items', 'Items')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.payment_method', 'Payment Method')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.amount', 'Amount')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('sales.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {salesData.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm font-medium text-slate-800">{sale.orderNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{formatDateTimeRW(sale.createdAt, 'en')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-800">{sale.customer?.name || t('sales.walk_in', 'Walk-in')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{sale.items?.length || 0} {t('sales.items_count', 'items')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(sale.paymentMethod)}`}>
                          {sale.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">
                          <CurrencyDisplay amount={sale.totalAmountCents / 100} />
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesData.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">{t('sales.no_sales', 'No sales found for this period')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-br from-imboni-blue to-blue-600 rounded-2xl p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-blue-200 mb-1">{t('sales.total_sales', 'Total Sales')}</p>
                <p className="text-3xl font-bold"><CurrencyDisplay amount={totalRevenue} /></p>
              </div>
              <div>
                <p className="text-sm text-blue-200 mb-1">{t('sales.total_orders', 'Total Orders')}</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-blue-200 mb-1">{t('sales.average_order_value', 'Average Order Value')}</p>
                <p className="text-3xl font-bold"><CurrencyDisplay amount={avgOrder} /></p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
