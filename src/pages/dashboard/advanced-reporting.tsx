import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter, Plus, FileText, DollarSign, Users, Package } from 'lucide-react'

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: string
}

interface ReportMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

interface ReportData {
  period: string
  metrics: ReportMetric[]
}

export default function AdvancedReporting() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'sales',
      name: 'Sales Performance',
      description: 'Revenue, orders, and average order value',
      icon: DollarSign,
      category: 'Financial'
    },
    {
      id: 'customers',
      name: 'Customer Analytics',
      description: 'Customer segments, retention, and lifetime value',
      icon: Users,
      category: 'CRM'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      description: 'Stock levels, turnover, and waste',
      icon: Package,
      category: 'Operations'
    },
    {
      id: 'staff',
      name: 'Staff Performance',
      description: 'Productivity, ratings, and tips',
      icon: TrendingUp,
      category: 'HR'
    },
    {
      id: 'menu',
      name: 'Menu Analysis',
      description: 'Popular items, margins, and recommendations',
      icon: BarChart3,
      category: 'Menu'
    },
    {
      id: 'profitability',
      name: 'Profitability Report',
      description: 'Costs, margins, and net profit',
      icon: PieChart,
      category: 'Financial'
    }
  ]

  const mockReportData: Record<string, ReportData> = {
    sales: {
      period: 'Last 30 days',
      metrics: [
        { label: 'Total Revenue', value: 4500000, change: 12.5, trend: 'up' },
        { label: 'Total Orders', value: 850, change: 8.2, trend: 'up' },
        { label: 'Average Order Value', value: 5294, change: 3.9, trend: 'up' },
        { label: 'Gross Margin', value: 68, change: -2.1, trend: 'down' }
      ]
    },
    customers: {
      period: 'Last 30 days',
      metrics: [
        { label: 'Total Customers', value: 420, change: 15.3, trend: 'up' },
        { label: 'New Customers', value: 85, change: 22.1, trend: 'up' },
        { label: 'Retention Rate', value: 78, change: 4.5, trend: 'up' },
        { label: 'Avg Lifetime Value', value: 125000, change: 8.7, trend: 'up' }
      ]
    },
    inventory: {
      period: 'Last 30 days',
      metrics: [
        { label: 'Stock Turnover', value: 4.2, change: 0.5, trend: 'up' },
        { label: 'Waste Rate', value: 3.8, change: -1.2, trend: 'up' },
        { label: 'Stock Value', value: 2800000, change: 5.4, trend: 'up' },
        { label: 'Low Stock Alerts', value: 12, change: -15.0, trend: 'up' }
      ]
    }
  }

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ]

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!selectedReport) {
    return (
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{t('reporting.title', 'Advanced Reporting')}</h1>
            <p className="text-slate-600">{t('reporting.subtitle', 'Create and view custom reports')}</p>
          </div>

          {/* Report Templates */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('reporting.templates', 'Report Templates')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map(template => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedReport(template.id)}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-imboni-blue transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-imboni-blue/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-imboni-blue" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Custom Report */}
              <button className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-imboni-blue hover:bg-blue-50 transition-all flex flex-col items-center justify-center min-h-[160px]">
                <Plus className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-slate-600 font-medium">{t('reporting.createCustom', 'Create Custom Report')}</span>
              </button>
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('reporting.recent', 'Recent Reports')}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.name', 'Name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.period', 'Period')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.created', 'Created')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">Monthly Sales Report</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">March 2026</td>
                    <td className="px-6 py-4 text-sm text-slate-600">Apr 1, 2026</td>
                    <td className="px-6 py-4">
                      <button className="text-imboni-blue hover:text-blue-700 text-sm font-medium">
                        {t('reporting.view', 'View')}
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">Customer Analysis Q1</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">Q1 2026</td>
                    <td className="px-6 py-4 text-sm text-slate-600">Mar 31, 2026</td>
                    <td className="px-6 py-4">
                      <button className="text-imboni-blue hover:text-blue-700 text-sm font-medium">
                        {t('reporting.view', 'View')}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const selectedTemplate = reportTemplates.find(r => r.id === selectedReport)
  const reportData = mockReportData[selectedReport] || mockReportData.sales

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="text-slate-600 hover:text-slate-900"
            >
              ← {t('reporting.back', 'Back')}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{selectedTemplate?.name}</h1>
              <p className="text-slate-600">{selectedTemplate?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-imboni-blue"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t('reporting.filter', 'Filter')}
            </button>
            <button className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('reporting.export', 'Export')}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportData.metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">{metric.label}</span>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {typeof metric.value === 'number' && metric.value > 1000
                  ? metric.value.toLocaleString()
                  : metric.value}
                {typeof metric.value === 'number' && metric.value < 100 && '%'}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('reporting.trendChart', 'Trend Over Time')}</h3>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <BarChart3 className="w-16 h-16" />
            <span className="ml-2">{t('reporting.chartPlaceholder', 'Chart visualization here')}</span>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{t('reporting.detailedData', 'Detailed Data')}</h3>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.date', 'Date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.metric1', 'Revenue')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.metric2', 'Orders')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t('reporting.metric3', 'Avg Order')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {(150000 + Math.random() * 50000).toLocaleString()} RWF
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {Math.floor(25 + Math.random() * 10)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {Math.floor(5000 + Math.random() * 2000).toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
