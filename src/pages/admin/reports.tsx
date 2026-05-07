import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Download, TrendingUp, DollarSign, Users, Building2 } from 'lucide-react'

export default function AdminReports() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('platform')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchReports()
    }
  }, [status, reportType])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
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

  const stats = [
    { label: 'Platform Revenue', value: `RWF ${((reportData?.totalRevenue || 0) / 100).toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Total Restaurants', value: reportData?.totalRestaurants || 0, icon: Building2, color: 'blue' },
    { label: 'Active Users', value: reportData?.activeUsers || 0, icon: Users, color: 'purple' },
    { label: 'Growth Rate', value: `${reportData?.growthRate || 0}%`, icon: TrendingUp, color: 'orange' }
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Platform Reports</h1>
            <p className="text-sm text-slate-500 mt-1">View comprehensive platform analytics</p>
          </div>
          <button className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('platform')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'platform'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setReportType('revenue')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'revenue'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Revenue Analysis
          </button>
          <button
            onClick={() => setReportType('growth')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              reportType === 'growth'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Growth Metrics
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
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Report Data</h3>
        {reportData ? (
          <pre className="bg-slate-50 p-4 rounded-xl overflow-auto text-sm text-slate-700 border border-slate-200">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        ) : (
          <p className="text-center py-8 text-slate-500">No report data available</p>
        )}
      </div>
    </AdminLayout>
  )
}
