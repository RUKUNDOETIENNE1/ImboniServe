import { MessageSquare, Users, Activity, ArrowRight } from 'lucide-react'

export interface CustomerEngagementData {
  totalCustomers: number
  activeCustomers30d: number
  activeCustomers7d: number
  newCustomers7d: number
  newCustomers30d: number
  dormantCustomers90d: number
  openSupportConversations: number
  highPrioritySupport: number
  recentSupportConversations: Array<{
    id: string
    subject: string | null
    status: string
    priority: string
    businessName: string
    updatedAt: string
  }>
  totalUsers: number
  activeUsers7d: number
}

interface Props {
  data: CustomerEngagementData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function CustomerEngagementCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Customer engagement center unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const activeRate = data.totalCustomers > 0 ? Math.round((data.activeCustomers30d / data.totalCustomers) * 100) : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-slate-900">Customer Engagement Center</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
          className="rounded-xl border border-slate-200 p-3 text-left hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">Total Customers</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{data.totalCustomers}</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Active (30d)</p>
          <p className="text-xl font-bold text-emerald-700">{data.activeCustomers30d}</p>
          <p className="text-xs text-slate-400">{activeRate}% active rate</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
          className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">New (7d)</p>
          <p className="text-xl font-bold text-blue-700">{data.newCustomers7d}</p>
          <p className="text-xs text-slate-400">{data.newCustomers30d} in 30d</p>
        </button>
        <button
          onClick={() => onNavigate?.('/admin/operations-intelligence')}
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-slate-500 mb-1">Dormant (90d+)</p>
          <p className="text-xl font-bold text-amber-700">{data.dormantCustomers90d}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Platform Engagement</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Active Users (7d)</span>
              <span className="text-sm font-medium text-slate-900">{data.activeUsers7d} / {data.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="text-sm text-slate-600">Active Customers (7d)</span>
              <span className="text-sm font-medium text-slate-900">{data.activeCustomers7d}</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Support Interactions</p>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
              className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
            >
              <span className="text-sm text-slate-600">Open Conversations</span>
              <span className="text-sm font-bold text-slate-900">{data.openSupportConversations}</span>
            </button>
            <button
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
              className={`flex items-center justify-between w-full rounded-xl border p-3 hover:shadow-md transition-all ${data.highPrioritySupport > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}
            >
              <span className="text-sm text-slate-600">High Priority</span>
              <span className={`text-sm font-bold ${data.highPrioritySupport > 0 ? 'text-red-700' : 'text-slate-900'}`}>{data.highPrioritySupport}</span>
            </button>
          </div>
        </div>
      </div>

      {data.recentSupportConversations.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Recent Support Conversations</p>
          <div className="space-y-2">
            {data.recentSupportConversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => onNavigate?.('/admin/operations-intelligence')}
                className="flex items-center justify-between w-full rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{conv.subject || 'No subject'}</p>
                    <p className="text-xs text-slate-400">{conv.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conv.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {conv.priority}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
