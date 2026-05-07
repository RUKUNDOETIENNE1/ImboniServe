import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, Package, TrendingDown, Zap } from 'lucide-react'
import { useRouter } from 'next/router'

interface LowStockItem {
  id: string
  name: string
  currentStock: number
  minStock: number
  unit: string
  stockPercentage: number
  urgency: 'critical' | 'low' | 'warning'
}

interface ReorderSuggestion {
  item: LowStockItem
  recommendedSupplier: {
    id: string
    name: string
    distance?: number
    reasoning: string
    unitPrice: number
    estimatedTotal: number
  }
  suggestedQuantity: number
  estimatedCost: number
}

interface AutopilotDashboard {
  lowStockCount: number
  criticalCount: number
  suggestions: ReorderSuggestion[]
  totalEstimatedCost: number
}

export default function ReorderAutopilot() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AutopilotDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/autopilot/reorder-suggestions')
      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch autopilot dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveOrder = async (index: number) => {
    setProcessing(index)
    try {
      const response = await fetch('/api/autopilot/reorder-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionIndex: index, action: 'approve' })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Order created successfully! Order ID: ${data.order.id}`)
        fetchDashboard()
      } else {
        alert('Failed to create order')
      }
    } catch (error) {
      console.error('Error approving order:', error)
      alert('Error creating order')
    } finally {
      setProcessing(null)
    }
  }

  const handleDismiss = async (index: number) => {
    try {
      await fetch('/api/autopilot/reorder-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionIndex: index, action: 'dismiss' })
      })
      fetchDashboard()
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'low':
        return <TrendingDown className="w-5 h-5 text-orange-600" />
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Analyzing inventory...</p>
      </div>
    )
  }

  if (!dashboard || dashboard.suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">All Good!</h3>
        <p className="text-gray-600">No low stock items detected. Your inventory is healthy.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Smart Reorder Autopilot</h2>
            <p className="text-purple-100">AI-powered inventory management</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-purple-100">Low Stock Items</p>
            <p className="text-3xl font-bold">{dashboard.lowStockCount}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-purple-100">Critical Items</p>
            <p className="text-3xl font-bold text-red-300">{dashboard.criticalCount}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-purple-100">Est. Reorder Cost</p>
            <p className="text-3xl font-bold">
              {dashboard.totalEstimatedCost.toLocaleString()} RWF
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        {dashboard.suggestions.map((suggestion, index) => (
          <div
            key={suggestion.item.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              suggestion.item.urgency === 'critical'
                ? 'border-red-500'
                : suggestion.item.urgency === 'low'
                ? 'border-orange-500'
                : 'border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                {getUrgencyIcon(suggestion.item.urgency)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{suggestion.item.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(
                        suggestion.item.urgency
                      )}`}
                    >
                      {suggestion.item.urgency.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-lg font-semibold text-red-600">
                        {suggestion.item.currentStock} {suggestion.item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Minimum Required</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {suggestion.item.minStock} {suggestion.item.unit}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      🤖 AI Recommendation
                    </p>
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Supplier:</strong> {suggestion.recommendedSupplier.name}
                      {suggestion.recommendedSupplier.distance && (
                        <span className="text-blue-600 ml-2">
                          ({suggestion.recommendedSupplier.distance.toFixed(1)} km away)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-blue-700 mb-2">
                      💡 {suggestion.recommendedSupplier.reasoning}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-blue-600">Quantity:</span>
                        <span className="font-semibold ml-1">
                          {suggestion.suggestedQuantity} {suggestion.item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Unit Price:</span>
                        <span className="font-semibold ml-1">
                          {suggestion.recommendedSupplier.unitPrice.toLocaleString()} RWF
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600">Total:</span>
                        <span className="font-semibold ml-1 text-green-600">
                          {suggestion.estimatedCost.toLocaleString()} RWF
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveOrder(index)}
                      disabled={processing === index}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      {processing === index ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Approve Order
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDismiss(index)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => router.push(`/store/supplier/${suggestion.recommendedSupplier.id}`)}
                      className="px-6 py-3 border-2 border-imboni-blue text-imboni-blue font-semibold rounded-lg hover:bg-blue-50 transition-all"
                    >
                      View Supplier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
