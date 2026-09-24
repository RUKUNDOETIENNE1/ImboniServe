'use client'

import type { KeyMetrics as MetricsData } from '@/lib/service-intelligence/v2'
import { ShoppingCart, Clock, TrendingUp } from 'lucide-react'

interface Props {
  metrics: MetricsData
}

export function KeyMetrics({ metrics }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Orders</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-semibold">{metrics.orders.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{metrics.orders.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <span className="font-semibold text-red-600">{metrics.orders.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Timing</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Prep</span>
              <span className="font-semibold">{metrics.timing.avgPrepTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Service</span>
              <span className="font-semibold">{metrics.timing.avgServiceTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Payment</span>
              <span className="font-semibold">{metrics.timing.avgPaymentTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Peak Hour</span>
              <span className="font-semibold">{metrics.timing.peakHour}</span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-semibold">{metrics.performance.completionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">On-Time Rate</span>
              <span className="font-semibold">{metrics.performance.onTimeRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Efficiency</span>
              <span className="font-semibold">{metrics.performance.efficiency.toFixed(0)}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
