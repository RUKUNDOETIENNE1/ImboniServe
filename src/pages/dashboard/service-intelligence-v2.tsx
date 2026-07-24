/**
 * Service Intelligence™ Dashboard Page
 */

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import type { ServiceIntelligenceResponse } from '@/lib/service-intelligence/types'

export default function ServiceIntelligencePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ServiceIntelligenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    if (!session?.user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/service-intelligence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: (session.user as any).businessId,
          selection: {
            period: 'today',
            label: 'Today',
          },
          includeComparison: false,
          includeHistorical: false,
        }),
      })

      const data: ServiceIntelligenceResponse = await response.json()

      if (data.success) {
        setReport(data)
      } else {
        setError(data.error ?? 'Failed to generate report')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Service Intelligence™</h1>
          <p className="text-gray-600 mt-2">
            Operational intelligence for service performance, staff efficiency, and customer flow
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {report?.success && report.report && (
          <div className="space-y-6">
            {/* Metrics Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Service Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Orders"
                  value={report.report.metrics?.totalOrders ?? 0}
                />
                <MetricCard
                  label="Completion Rate"
                  value={`${(report.report.metrics?.completionRate ?? 0).toFixed(1)}%`}
                />
                <MetricCard
                  label="Avg Service Time"
                  value={formatDuration(report.report.metrics?.avgServiceDuration ?? 0)}
                />
                <MetricCard
                  label="Quality Score"
                  value={`${(report.report.metrics?.serviceQualityScore ?? 0).toFixed(1)}/100`}
                />
              </div>
            </div>

            {/* Waiter Performance */}
            {report.report.topPerformers && report.report.topPerformers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
                <div className="space-y-3">
                  {report.report.topPerformers.map((waiter, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{waiter.waiterName}</p>
                        <p className="text-sm text-gray-600">
                          {waiter.ordersHandled} orders • {waiter.completionRate.toFixed(1)}% completion
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        waiter.trend === 'improving' ? 'bg-green-100 text-green-800' :
                        waiter.trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {waiter.trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottlenecks */}
            {report.report.bottlenecks && report.report.bottlenecks.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Bottlenecks</h2>
                <div className="space-y-3">
                  {report.report.bottlenecks.map((bottleneck, i) => (
                    <div key={i} className="p-4 border border-orange-200 bg-orange-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-orange-900">{bottleneck.stationName}</p>
                          <p className="text-sm text-orange-700 mt-1">
                            {formatDuration(bottleneck.avgDelay)} delay • {bottleneck.ordersAffected} orders affected
                          </p>
                          {bottleneck.recommendation && (
                            <p className="text-sm text-orange-600 mt-2">
                              💡 {bottleneck.recommendation}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bottleneck.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          bottleneck.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          bottleneck.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bottleneck.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {report.report.insights && report.report.insights.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Insights</h2>
                <div className="space-y-3">
                  {report.report.insights.map((insight, i) => (
                    <div key={i} className={`p-4 rounded border ${
                      insight.type === 'achievement' ? 'bg-green-50 border-green-200' :
                      insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-sm mt-1">{insight.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-white rounded">
                          {insight.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-white rounded">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Peak Periods */}
            {report.report.peakPeriods && report.report.peakPeriods.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Peak Service Periods</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.report.peakPeriods.map((peak, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded">
                      <p className="font-medium">{peak.startTime} - {peak.endTime}</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{peak.orderVolume}</p>
                      <p className="text-sm text-gray-600">orders</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Avg service: {formatDuration(peak.avgServiceTime)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p>Report ID: {report.report.id}</p>
              <p>Generated: {new Date(report.report.generatedAt).toLocaleString()}</p>
              <p>Events analyzed: {report.report.eventsAnalyzed}</p>
              <p>Confidence: {(report.report.confidence * 100).toFixed(1)}%</p>
              <p>Generation time: {report.diagnostics.totalTime}ms</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}
