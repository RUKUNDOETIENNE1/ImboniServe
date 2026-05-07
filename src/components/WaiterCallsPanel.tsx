import { useEffect, useState } from 'react'
import { Bell, Check, X, Clock, AlertTriangle, Droplet, HelpCircle, DollarSign, MessageSquare } from 'lucide-react'
import { useRealtime } from '@/lib/realtime'

interface WaiterCall {
  id: string
  tableId: string
  reason: string
  customMessage?: string
  status: 'pending' | 'acknowledged' | 'resolved'
  priority: number
  createdAt: string
  acknowledgedAt?: string
  table: {
    number: string
  }
  session?: {
    participants: Array<{ name?: string }>
  }
}

interface WaiterCallsPanelProps {
  businessId: string
}

export default function WaiterCallsPanel({ businessId }: WaiterCallsPanelProps) {
  const [calls, setCalls] = useState<WaiterCall[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  // Real-time updates
  const newCall = useRealtime(`business-${businessId}`, 'waiter-call')
  const updatedCall = useRealtime(`business-${businessId}`, 'waiter-call-updated')

  // Load initial calls
  useEffect(() => {
    loadCalls()
  }, [businessId, filter])

  // Handle real-time new call
  useEffect(() => {
    if (newCall) {
      setCalls(prev => [newCall, ...prev])
      // Play notification sound
      playNotificationSound()
    }
  }, [newCall])

  // Handle real-time updates
  useEffect(() => {
    if (updatedCall) {
      setCalls(prev => prev.map(call => 
        call.id === updatedCall.id ? { ...call, ...updatedCall } : call
      ))
    }
  }, [updatedCall])

  async function loadCalls() {
    setLoading(true)
    try {
      const statusParam = filter === 'pending' ? '&status=pending' : ''
      const response = await fetch(`/api/waiter-calls?businessId=${businessId}${statusParam}`)
      if (response.ok) {
        const data = await response.json()
        setCalls(data.calls || [])
      }
    } catch (error) {
      console.error('Failed to load waiter calls:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAcknowledge(callId: string) {
    try {
      const response = await fetch(`/api/waiter-calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' })
      })

      if (response.ok) {
        setCalls(prev => prev.map(call =>
          call.id === callId ? { ...call, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : call
        ))
      }
    } catch (error) {
      console.error('Failed to acknowledge call:', error)
    }
  }

  async function handleResolve(callId: string) {
    try {
      const response = await fetch(`/api/waiter-calls/${callId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      })

      if (response.ok) {
        if (filter === 'pending') {
          setCalls(prev => prev.filter(call => call.id !== callId))
        } else {
          setCalls(prev => prev.map(call =>
            call.id === callId ? { ...call, status: 'resolved' } : call
          ))
        }
      }
    } catch (error) {
      console.error('Failed to resolve call:', error)
    }
  }

  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/urgent.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {}
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const reasonConfig = {
    water: { icon: Droplet, label: 'Water', color: 'blue' },
    assistance: { icon: HelpCircle, label: 'Assistance', color: 'orange' },
    bill: { icon: DollarSign, label: 'Bill', color: 'green' },
    other: { icon: MessageSquare, label: 'Other', color: 'gray' }
  } as const

  const pendingCalls = calls.filter(c => c.status === 'pending')
  const acknowledgedCalls = calls.filter(c => c.status === 'acknowledged')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Service Requests</h2>
              <p className="text-sm text-gray-600">
                {pendingCalls.length} pending, {acknowledgedCalls.length} acknowledged
              </p>
            </div>
          </div>
          <button
            onClick={loadCalls}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCalls.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({calls.length})
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div className="p-4">
        {calls.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No service requests</p>
            <p className="text-sm text-gray-500 mt-1">
              {filter === 'pending' ? 'All requests have been handled' : 'No requests yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const config = reasonConfig[call.reason as keyof typeof reasonConfig] || reasonConfig.other
              const Icon = config.icon
              const isPending = call.status === 'pending'
              const isUrgent = call.priority > 1

              return (
                <div
                  key={call.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isPending
                      ? isUrgent
                        ? 'border-red-300 bg-red-50 animate-pulse'
                        : 'border-orange-300 bg-orange-50'
                      : call.status === 'acknowledged'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Table and Reason */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${config.color}-100`}>
                          <Icon className={`w-5 h-5 text-${config.color}-600`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-gray-800">
                              Table {call.table.number}
                            </span>
                            {isUrgent && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                                URGENT
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isPending
                                ? 'bg-orange-100 text-orange-800'
                                : call.status === 'acknowledged'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {call.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{config.label}</p>
                        </div>
                      </div>

                      {/* Custom Message */}
                      {call.customMessage && (
                        <div className="ml-13 mb-2">
                          <p className="text-sm text-gray-700 italic">"{call.customMessage}"</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="ml-13 flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{formatTimeAgo(call.createdAt)}</span>
                        {call.acknowledgedAt && (
                          <span className="ml-2">• Acknowledged {formatTimeAgo(call.acknowledgedAt)}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4">
                      {isPending && (
                        <button
                          onClick={() => handleAcknowledge(call.id)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Acknowledge"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {(isPending || call.status === 'acknowledged') && (
                        <button
                          onClick={() => handleResolve(call.id)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          title="Resolve"
                        >
                          <Check size={18} className="font-bold" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
