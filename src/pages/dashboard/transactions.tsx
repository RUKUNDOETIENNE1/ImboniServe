import { useState, useEffect } from 'react'
import { formatDateTimeRW } from '@/utils/datetimeRW'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import DateTimeDisplay from '@/components/DateTimeDisplay'
import { useTranslation } from '@/lib/i18n'
import { Download, Filter, Search, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react'

export default function Transactions() {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchTransactions()
  }, [filterType])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?status=${filterType}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Total Transactions', value: transactions.length, change: '+12%', icon: ArrowUpRight, color: 'blue' },
    { label: 'Completed', value: transactions.filter(t => t.status === 'completed').length, change: '+8%', icon: ArrowUpRight, color: 'green' },
    { label: 'Pending', value: transactions.filter(t => t.status === 'pending').length, change: '-2%', icon: ArrowDownRight, color: 'yellow' },
    { label: 'Failed', value: transactions.filter(t => t.status === 'failed').length, change: '0%', icon: ArrowDownRight, color: 'red' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

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
            <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.transactions.title', 'Transactions')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('dashboard.transactions.subtitle', 'View and manage all payment transactions')}</p>
          </div>
          <button className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all">
            <Download className="w-4 h-4 mr-2" />
            {t('dashboard.transactions.export', 'Export')} Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <Icon className={`w-5 h-5 ${stat.color === 'green' ? 'text-green-600' : stat.color === 'red' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className={`text-xs font-medium mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-slate-600'}`}>
                {stat.change} from yesterday
              </p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterType === 'completed'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterType === 'pending'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterType('failed')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterType === 'failed'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Failed
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 w-64"
              />
            </div>
            <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <Calendar className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.transaction_id', 'Transaction ID')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.date_time', 'Date & Time')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.customer', 'Customer')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.method', 'Method')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.amount', 'Amount')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">{t('dashboard.transactions.status', 'Status')}</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-slate-800">{txn.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{formatDateTimeRW(txn.date, 'en')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{txn.customer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(txn.method)}`}>
                        {txn.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-bold ${txn.amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        <CurrencyDisplay amount={Math.abs(txn.amount)} />
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600">{t('dashboard.transactions.no_transactions', 'No transactions found')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
