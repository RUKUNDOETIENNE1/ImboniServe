import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import CurrencyRatesWidget from '@/components/CurrencyRatesWidget'
import dynamic from 'next/dynamic'
import { useOffline } from '@/hooks/useOffline'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import BusinessRevenueScanner from '@/components/BusinessRevenueScanner'
const LiveMetricsTicker = dynamic(
  () => import('@/components/dashboard/LiveMetricsTicker').then(m => m.LiveMetricsTicker),
  { ssr: false, loading: () => null }
)
import { 
  DollarSign, Package, TrendingUp, Smartphone, WifiOff, ChevronDown,
  ShoppingCart, ArrowUpRight, MoreVertical, Zap, UtensilsCrossed, ScanLine
} from 'lucide-react'

const SalesChart = dynamic(() => import('@/components/SalesChart'), { 
  ssr: false,
  loading: () => <div className="h-72 bg-slate-100 animate-pulse rounded-xl"></div>
})

export default function Dashboard() {
  const { isOnline, pendingCount } = useOffline()
  const { t } = useTranslation()
  const router = useRouter()
  const [dateFilter, setDateFilter] = useState('7')
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const [salesPeriod, setSalesPeriod] = useState('7')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [salesChartData, setSalesChartData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, transactionsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/sales-chart'),
        fetch('/api/dashboard/recent-transactions?limit=5')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (chartRes.ok) {
        const chartData = await chartRes.json()
        setSalesChartData(chartData.data || [])
      }

      if (transactionsRes.ok) {
        const txData = await transactionsRes.json()
        setRecentTransactions(txData.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const salesData = salesChartData.length > 0 ? salesChartData : []

  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([])

  const tables = stats?.tables || []

  const liveTransactions = recentTransactions

  const formatRWF = (amount: number) => `RWF ${amount.toLocaleString()}`

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 border-red-300 text-red-700'
      case 'available': return 'bg-green-100 border-green-300 text-green-700'
      case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'cleaning': return 'bg-gray-100 border-gray-300 text-gray-600'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const getTableDotColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-500'
      case 'available': return 'bg-green-500'
      case 'reserved': return 'bg-yellow-500'
      case 'cleaning': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8">
            <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
          </div>
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.title', 'Dashboard')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('dashboard.welcome', "Welcome back! Here's what's happening today.")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-imboni-orange to-orange-600 text-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all font-semibold"
            >
              <ScanLine className="w-4 h-4" />
              <span className="text-sm">{t('dashboard.scan_business', 'Scan My Business')}</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                onBlur={() => setTimeout(() => setShowDateDropdown(false), 200)}
                className="flex items-center gap-2 bg-imboni-blue text-white rounded-lg px-4 py-2 shadow-sm hover:bg-blue-700 transition-colors"
              >
                <span className="text-sm font-medium">
                  {dateFilter === 'today' ? t('dashboard.today', 'Today') :
                   dateFilter === '7' ? t('dashboard.last_7_days', 'Last 7 days') :
                   dateFilter === '28' ? t('dashboard.last_28_days', 'Last 28 days') :
                   dateFilter === '90' ? t('dashboard.last_90_days', 'Last 90 days') :
                   dateFilter === '365' ? t('dashboard.last_365_days', 'Last 365 days') : t('dashboard.lifetime', 'Lifetime')}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDateDropdown && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                <button onClick={() => setDateFilter('today')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 font-medium">{t('dashboard.today', 'Today')}</button>
                <button onClick={() => setDateFilter('7')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_7_days', 'Last 7 days')}</button>
                <button onClick={() => setDateFilter('28')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_28_days', 'Last 28 days')}</button>
                <button onClick={() => setDateFilter('90')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_90_days', 'Last 90 days')}</button>
                <button onClick={() => setDateFilter('365')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_365_days', 'Last 365 days')}</button>
                  <button onClick={() => setDateFilter('lifetime')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.lifetime', 'Lifetime')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isOnline && (
        <div className="mb-6 flex items-center bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl">
          <WifiOff className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">{t('dashboard.offline', "You're offline.")} {pendingCount} {t('dashboard.pending_syncs', 'pending sync(s)')}</span>
        </div>
      )}

      <LiveMetricsTicker />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">{t('dashboard.daily_sales', 'Daily Sales')} - {mounted && currentTime ? currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : t('common.loading', 'Loading...')}</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl font-bold text-slate-800">
                    {loading ? '...' : <CurrencyDisplay amount={stats?.todaySales?.revenue || 0} />}
                  </h2>
                  <span className="flex items-center text-green-600 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    {stats?.todaySales?.change || '+0%'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{t('dashboard.todays_performance', "Today's Performance")}</p>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="h-72">
              {loading ? (
                <div className="h-full bg-slate-100 animate-pulse rounded-xl"></div>
              ) : salesData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <p className="text-sm">{t('dashboard.no_sales_data', 'No sales data available yet')}</p>
                    <p className="text-xs mt-1">{t('dashboard.start_selling', 'Start making sales to see your chart')}</p>
                  </div>
                </div>
              ) : (
                <SalesChart data={salesData} formatRWF={formatRWF} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-800">{t('dashboard.inventory_alerts', 'Inventory Alerts')}</h3>
                <a href="/dashboard/inventory" className="text-sm text-imboni-blue hover:text-imboni-blue/80 font-medium">
                  {t('dashboard.view_all', 'View All')} →
                </a>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : inventoryAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">{t('dashboard.no_inventory_alerts', 'No inventory alerts')}</p>
                    <p className="text-xs mt-1">{t('dashboard.all_stock_good', 'All stock levels are good')}</p>
                  </div>
                ) : (
                  <>
                    {inventoryAlerts.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          item.color === 'red' ? 'bg-red-500' : 
                          item.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'low' ? 'bg-red-100 text-red-600' :
                              item.status === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {item.status === 'low' ? t('dashboard.low_stock', 'Low Stock') : item.status === 'medium' ? t('dashboard.warning', 'Warning') : t('dashboard.good', 'Good')}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                item.color === 'red' ? 'bg-red-500' : 
                                item.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((item.current / item.min) * 50, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{item.current} / {item.min} {t('dashboard.units', 'units')}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <button 
                onClick={() => router.push('/dashboard/inventory?add=1')}
                className="w-full mt-5 py-2.5 bg-imboni-orange/10 text-imboni-orange rounded-xl font-medium hover:bg-imboni-orange/20 transition-colors">
                {t('dashboard.restock_now', 'Restock Now')}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-800">{t('dashboard.table_management', 'Table Management')}</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('dashboard.available', 'Available')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> {t('dashboard.occupied', 'Occupied')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> {t('dashboard.reserved', 'Reserved')}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl"></div>
                  ))
                ) : tables.length === 0 ? (
                  <div className="col-span-4 text-center py-8 text-slate-400">
                    <p className="text-sm">{t('dashboard.no_tables', 'No tables configured')}</p>
                    <p className="text-xs mt-1">{t('dashboard.add_tables', 'Add tables to start managing them')}</p>
                  </div>
                ) : (
                  <>
                    {tables.map((table: any) => (
                      <div 
                        key={table.id}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${getTableStatusColor(table.status)}`}
                      >
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getTableDotColor(table.status)}`}></div>
                        <div className="text-center">
                          <UtensilsCrossed className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          <p className="text-xs font-bold">T{table.id}</p>
                          <p className="text-[10px] opacity-70">{table.seats} {t('dashboard.seats', 'seats')}</p>
                          
                          {table.time && (
                            <p className="text-[10px] mt-1 font-medium">{table.time}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button 
                  onClick={() => router.push('/dashboard/tables')}
                  className="flex-1 py-2.5 bg-imboni-green text-white rounded-xl font-medium hover:bg-imboni-green/90 transition-colors text-sm"
                >
                  {t('dashboard.add_table', 'Add Table')}
                </button>
                <button 
                  onClick={() => router.push('/dashboard/tables')}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
                >
                  {t('dashboard.floor_plan', 'Floor Plan')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <CurrencyRatesWidget />
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{t('dashboard.real_time_sales', 'Real-time Sales')}</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    onBlur={() => setTimeout(() => setShowPeriodDropdown(false), 200)}
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span className="text-slate-600">
                      {salesPeriod === '7' ? t('dashboard.last_7_days', 'Last 7 days') :
                       salesPeriod === '28' ? t('dashboard.last_28_days', 'Last 28 days') :
                       salesPeriod === '90' ? t('dashboard.last_90_days', 'Last 90 days') :
                       salesPeriod === '365' ? t('dashboard.last_365_days', 'Last 365 days') : t('dashboard.lifetime', 'Lifetime')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {showPeriodDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                      <button onClick={() => setSalesPeriod('7')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_7_days', 'Last 7 days')}</button>
                      <button onClick={() => setSalesPeriod('28')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_28_days', 'Last 28 days')}</button>
                      <button onClick={() => setSalesPeriod('90')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_90_days', 'Last 90 days')}</button>
                      <button onClick={() => setSalesPeriod('365')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.last_365_days', 'Last 365 days')}</button>
                      <button onClick={() => setSalesPeriod('lifetime')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{t('dashboard.lifetime', 'Lifetime')}</button>
                    </div>
                  )}
                </div>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-600 font-medium">{t('dashboard.live', 'Live')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-imboni-blue to-blue-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-5 h-5 opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{t('dashboard.today', 'Today')}</span>
                </div>
                <p className="text-2xl font-bold">{loading ? '...' : stats?.todaySales?.count || 0}</p>
                <p className="text-xs opacity-80">{t('dashboard.total_orders', 'Total Orders')}</p>
              </div>
              <div className="bg-gradient-to-br from-imboni-orange to-orange-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">+8%</span>
                </div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : <><CurrencyDisplay amount={(stats?.todaySales?.revenue || 0) / 1000} />K</>}
                </p>
                <p className="text-xs opacity-80">{t('dashboard.revenue', 'Revenue')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-600">{t('dashboard.live_sales', 'Live | Sales')}</h4>
              <a href="/dashboard/sales" className="text-xs text-imboni-blue hover:underline">{t('dashboard.view_all', 'View All')}</a>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
                ))
              ) : liveTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">{t('dashboard.no_recent_transactions', 'No recent transactions')}</p>
                  <p className="text-xs mt-1">{t('dashboard.transactions_will_appear', 'Transactions will appear here')}</p>
                </div>
              ) : (
                <>
                  {liveTransactions.map((tx: any) => (
                    <div 
                      key={tx.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-slate-50 ${
                        tx.status === 'pending' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50/50'
                      }`}
                    >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'MoMo' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <span className="text-lg font-bold text-yellow-600">
                      {tx.type === 'MoMo' ? 'M' : '📱'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.name}</p>
                    <p className="text-xs text-slate-400">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{formatRWF(tx.amount)}</p>
                    <p className={`text-xs ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                      {tx.status === 'completed' ? `✓ ${t('dashboard.done', 'Done')}` : `⏳ ${t('dashboard.pending', 'Pending')}`}
                    </p>
                  </div>
                </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.quick_actions', 'Quick Actions')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="/dashboard/sales/new" 
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-imboni-orange to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
              >
                <ShoppingCart className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{t('dashboard.new_sale', 'New Sale')}</span>
              </a>
              <a 
                href="/dashboard/inventory" 
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-imboni-green to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all"
              >
                <Package className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{t('dashboard.add_stock', 'Add Stock')}</span>
              </a>
              <a 
                href="/dashboard/reports" 
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-imboni-blue to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{t('dashboard.reports', 'Reports')}</span>
              </a>
              <a 
                href="/whatsapp-setup" 
                className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-imboni-gold to-yellow-500 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-200 transition-all"
              >
                <Smartphone className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{t('dashboard.whatsapp', 'WhatsApp')}</span>
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold">{t('dashboard.pro_plan', 'Pro Plan')}</h3>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">{t('dashboard.active', 'Active')}</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">{t('dashboard.next_billing', 'Next billing:')} RWF 10,000 on Feb 15</p>
            <div className="flex gap-2">
              <button 
                onClick={() => router.push('/dashboard/settings?tab=billing')}
                className="flex-1 py-2 bg-imboni-orange rounded-lg text-sm font-medium hover:bg-imboni-orange/90 transition-colors">
                {t('dashboard.upgrade', 'Upgrade')}
              </button>
              <button 
                onClick={() => router.push('/dashboard/settings?tab=billing#invoices')}
                className="px-4 py-2 bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
                {t('dashboard.invoice', 'Invoice')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showScanner && <BusinessRevenueScanner onClose={() => setShowScanner(false)} />}
    </DashboardLayout>
  )
}
