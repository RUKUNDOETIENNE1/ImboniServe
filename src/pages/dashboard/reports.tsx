import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Download, Calendar, TrendingUp, DollarSign, TrendingDown, BarChart3 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'

export default function Reports() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      const endpoint = `/api/reports/${reportType}`
      const res = await fetch(endpoint)
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [reportType])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('reports.title', 'Reports & Analytics')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('reports.subtitle', 'View and download your business reports')}</p>
          </div>
          <button 
            onClick={() => showToast('info', t('reports.export_coming_soon', 'PDF export coming soon'))}
            className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('reports.export_pdf', 'Export PDF')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'daily'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('reports.daily', 'Daily')}
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'weekly'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('reports.weekly', 'Weekly')}
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'monthly'
                ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('reports.monthly', 'Monthly')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
          <p className="mt-4 text-slate-600">{t('reports.loading', 'Loading report...')}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{t('reports.revenue', 'Revenue')}</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                <CurrencyDisplay amount={(reportData.sales?.revenue || reportData.summary?.revenue || 0) / 100} />
              </p>
              <p className="text-xs text-slate-400 font-medium">{t('reports.revenue_period', 'Period total')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{t('reports.cost', 'Cost')}</p>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                <CurrencyDisplay amount={(reportData.profit?.cost || reportData.summary?.cost || 0) / 100} />
              </p>
              <p className="text-xs text-red-600 font-medium">{t('reports.operating_expenses', 'Operating expenses')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{t('reports.profit', 'Profit')}</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                <CurrencyDisplay amount={(reportData.profit?.profit || reportData.summary?.profit || 0) / 100} />
              </p>
              <p className="text-xs text-blue-600 font-medium">{t('reports.net_profit', 'Net profit')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{t('reports.margin', 'Margin')}</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {(reportData.profit?.margin || reportData.summary?.margin || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 font-medium">{t('reports.profit_margin', 'Profit margin')}</p>
            </div>
          </div>

          {/* Sales Breakdown Table */}
          {reportData.sales && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('reports.sales_breakdown', 'Sales Breakdown')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('reports.metric', 'Metric')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">{t('reports.value', 'Value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-600">{t('reports.total_orders', 'Total Orders')}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">{reportData.sales.count || 0}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-600">{t('reports.total_revenue', 'Total Revenue')}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">
                        <CurrencyDisplay amount={(reportData.sales.revenue || 0) / 100} />
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-600">{t('reports.avg_order_value', 'Average Order Value')}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-800 text-right">
                        <CurrencyDisplay amount={(reportData.sales.avg || 0) / 100} />
                      </td>
                    </tr>
                    {reportData.profit && (
                      <>
                        <tr className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-600">{t('reports.total_cost', 'Total Cost')}</td>
                          <td className="py-3 px-4 text-sm font-medium text-red-600 text-right">
                            <CurrencyDisplay amount={(reportData.profit.cost || 0) / 100} />
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-600">{t('reports.net_profit', 'Net Profit')}</td>
                          <td className="py-3 px-4 text-sm font-medium text-green-600 text-right">
                            <CurrencyDisplay amount={(reportData.profit.profit || 0) / 100} />
                          </td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-3 px-4 text-sm font-semibold text-slate-700">{t('reports.profit_margin', 'Profit Margin')}</td>
                          <td className="py-3 px-4 text-sm font-bold text-blue-600 text-right">
                            {(reportData.profit.margin || 0).toFixed(1)}%
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200/60">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('reports.no_data', 'No report data available')}</p>
          <button 
            onClick={fetchReport}
            className="mt-4 px-6 py-2 bg-imboni-blue text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t('reports.refresh', 'Refresh Report')}
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}
