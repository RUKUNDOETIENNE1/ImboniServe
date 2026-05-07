/**
 * Live Order Summary Component
 * Shows real-time order status with kitchen updates
 */

import { useDiningSession } from '@/hooks/useDiningSession'
import { Clock, CheckCircle, Flame, UtensilsCrossed, RefreshCw } from 'lucide-react'

interface LiveOrderSummaryProps {
  sessionId: string
  showKitchenStatus?: boolean
}

export function LiveOrderSummary({ sessionId, showKitchenStatus = true }: LiveOrderSummaryProps) {
  const { slip, loading, error, refresh, total, subtotal, vat, itemCount } = useDiningSession({
    sessionId,
    autoRefresh: true,
    refreshInterval: 5000,
  })

  const getKitchenStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'accepted':
      case 'preparing':
        return <Flame className="w-4 h-4 text-orange-600" />
      case 'almost_ready':
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'served':
        return <UtensilsCrossed className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getKitchenStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Accepted'
      case 'preparing':
        return 'Preparing'
      case 'almost_ready':
        return 'Almost Ready'
      case 'ready':
        return 'Ready'
      case 'served':
        return 'Served'
      default:
        return status
    }
  }

  const getKitchenStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'accepted':
      case 'preparing':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'almost_ready':
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'served':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600'
    }
  }

  if (loading && !slip) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!slip) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
        <p className="text-gray-600">No active session</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Order</h2>
            <p className="text-blue-100 text-sm mt-1">
              {slip.session?.table ? `Table ${slip.session.table.number}` : 'Takeaway'} • {itemCount} item{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={refresh}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="p-6 space-y-4">
        {slip.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No items yet</p>
          </div>
        ) : (
          slip.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.quantity}× {item.itemName}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 whitespace-nowrap">
                    RWF {(item.totalPriceCents / 100).toLocaleString()}
                  </p>
                </div>

                {/* Kitchen Status */}
                {showKitchenStatus && (
                  <div className="mt-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getKitchenStatusColor(
                        item.kitchenStatus
                      )}`}
                    >
                      {getKitchenStatusIcon(item.kitchenStatus)}
                      {getKitchenStatusLabel(item.kitchenStatus)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {slip.items.length > 0 && (
        <div className="bg-gray-50 p-6 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>RWF {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>VAT ({slip.taxMode === 'INCLUSIVE' ? 'Included' : `${slip.taxRate}%`})</span>
            <span>RWF {vat.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>RWF {total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
