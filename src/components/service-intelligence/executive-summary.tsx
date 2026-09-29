'use client'

import type { ExecutiveSummary as SummaryData } from '@/lib/service-intelligence/v2'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  summary: SummaryData
}

export function ExecutiveSummary({ summary }: Props) {
  const TrendIcon = summary.overallTrend === 'improving'
    ? TrendingUp
    : summary.overallTrend === 'declining'
    ? TrendingDown
    : Minus

  const trendColor = summary.overallTrend === 'improving'
    ? 'text-green-600'
    : summary.overallTrend === 'declining'
    ? 'text-red-600'
    : 'text-gray-600'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Executive Summary</h2>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
          <span className="text-sm font-medium capitalize">{summary.overallTrend}</span>
        </div>
      </div>

      <p className="text-gray-700 mb-6">{summary.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalOrders}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{summary.completionRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{summary.avgServiceTime}</div>
          <div className="text-sm text-gray-500">Avg Service Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{summary.highlightCount}</div>
          <div className="text-sm text-gray-500">Highlights</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{summary.issueCount}</div>
          <div className="text-sm text-gray-500">Issues</div>
        </div>
      </div>
    </div>
  )
}
