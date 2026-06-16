/**
 * Pilot Observer Dashboard
 * Read-only view for tracking real-world adoption metrics
 * Phase 5: Live Pilot Validation
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  BarChart3,
} from 'lucide-react'

interface AdoptionMetrics {
  trustScore: number
  complianceScore: number
  confusionScore: number
  adoptionReadinessScore: number
  totalUpdates: number
  stationOriginatedUpdates: number
  crossStationUpdates: number
  managerOverrides: number
  offSystemActions: number
  totalItems: number
  canonicalPathCompletions: number
  invalidTransitions: number
  hesitationEvents: number
  wrongStationAttempts: number
  abandonedActions: number
}

interface WorkflowDrift {
  name: string
  description: string
  frequency: number
  impact: 'low' | 'medium' | 'high'
}

export default function PilotObserverDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [metrics, setMetrics] = useState<AdoptionMetrics | null>(null)
  const [drifts, setDrifts] = useState<WorkflowDrift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMetrics()
      const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [status])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/pilot/metrics')
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
        setDrifts(data.drifts || [])
      }
    } catch (error) {
      console.error('Failed to fetch pilot metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number, inverted: boolean = false): string => {
    if (inverted) {
      if (score <= 20) return 'text-green-600'
      if (score <= 40) return 'text-orange-600'
      return 'text-red-600'
    } else {
      if (score >= 80) return 'text-green-600'
      if (score >= 65) return 'text-orange-600'
      return 'text-red-600'
    }
  }

  const getScoreIcon = (score: number, inverted: boolean = false) => {
    const isGood = inverted ? score <= 20 : score >= 80
    const isMedium = inverted ? score <= 40 : score >= 65

    if (isGood) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (isMedium) return <AlertTriangle className="w-5 h-5 text-orange-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getImpactBadge = (impact: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    }
    return colors[impact as keyof typeof colors] || colors.low
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-slate-600">
            No pilot metrics available yet. Start observing to collect data.
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-8 h-8 text-imboni-blue" />
            <h1 className="text-3xl font-bold text-slate-900">Pilot Observer Dashboard</h1>
          </div>
          <p className="text-slate-600">
            Real-world adoption metrics from live pilot deployment
          </p>
        </div>

        {/* Overall Adoption Score */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Overall Adoption Readiness</h2>
            {getScoreIcon(metrics.adoptionReadinessScore)}
          </div>
          <div className="flex items-end gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(metrics.adoptionReadinessScore)}`}>
              {metrics.adoptionReadinessScore.toFixed(0)}
            </div>
            <div className="text-2xl text-slate-400 mb-2">/100</div>
          </div>
          <div className="mt-4">
            {metrics.adoptionReadinessScore >= 80 && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ready to scale deployment</span>
              </div>
            )}
            {metrics.adoptionReadinessScore >= 65 && metrics.adoptionReadinessScore < 80 && (
              <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Iterate on top friction points and re-measure</span>
              </div>
            )}
            {metrics.adoptionReadinessScore < 65 && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Hold scale - simplify top confusion points</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Trust Score */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Trust Score</h3>
              {getScoreIcon(metrics.trustScore)}
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(metrics.trustScore)}`}>
              {metrics.trustScore.toFixed(1)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Station-originated:</span>
                <span className="font-medium">
                  {((metrics.stationOriginatedUpdates / metrics.totalUpdates) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Overrides:</span>
                <span className="font-medium">{metrics.managerOverrides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Off-system:</span>
                <span className="font-medium">{metrics.offSystemActions}</span>
              </div>
            </div>
          </div>

          {/* Compliance Score */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Compliance Score</h3>
              {getScoreIcon(metrics.complianceScore)}
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(metrics.complianceScore)}`}>
              {metrics.complianceScore.toFixed(1)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Canonical path:</span>
                <span className="font-medium">
                  {((metrics.canonicalPathCompletions / metrics.totalItems) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Invalid transitions:</span>
                <span className="font-medium">{metrics.invalidTransitions}</span>
              </div>
            </div>
          </div>

          {/* Confusion Score */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Confusion Score</h3>
              {getScoreIcon(metrics.confusionScore, true)}
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(metrics.confusionScore, true)}`}>
              {metrics.confusionScore.toFixed(0)}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Hesitations:</span>
                <span className="font-medium">{metrics.hesitationEvents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Wrong-station:</span>
                <span className="font-medium">{metrics.wrongStationAttempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Abandoned:</span>
                <span className="font-medium">{metrics.abandonedActions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Drifts */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-imboni-blue" />
            <h2 className="text-xl font-semibold text-slate-900">Top Workflow Drifts</h2>
          </div>

          {drifts.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No workflow drifts detected yet
            </div>
          ) : (
            <div className="space-y-4">
              {drifts.map((drift, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{drift.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{drift.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getImpactBadge(drift.impact)}`}
                    >
                      {drift.impact.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Frequency: {drift.frequency}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observer Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Observer Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Watch staff behavior without coaching or interrupting</li>
            <li>• Note timestamps of confusion, hesitation, or bypass events</li>
            <li>• Record verbatim staff comments during post-service debrief</li>
            <li>• Focus on "where do humans think too much" not "where does system fail"</li>
            <li>• Metrics refresh every 30 seconds automatically</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
