/**
 * Daily Briefings™ - Core Section Components
 * Includes: Snapshot, Comparison, Highlights, Attention
 */

'use client'

import { TrendingUp, TrendingDown, Minus, Play, FileText, ChefHat, CheckCircle, Clock, CreditCard, Utensils, Users, XCircle, AlertTriangle } from 'lucide-react'
import type {
  SnapshotDisplay,
  ComparisonDisplay,
  HighlightCard,
  AttentionCard,
} from '@/lib/daily-briefings/types'

// ═════════════════════════════════════════════════════════════════════════════
// Today's Snapshot
// ═════════════════════════════════════════════════════════════════════════════

interface SnapshotProps {
  snapshot: SnapshotDisplay
}

export function TodaySnapshotSection({ snapshot }: SnapshotProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Snapshot</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Orders</p>
          <div className="space-y-2">
            {snapshot.orders.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Timing</p>
          <div className="space-y-2">
            {snapshot.timing.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Flow */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Customer Flow</p>
          <div className="space-y-2">
            {snapshot.customerFlow.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Score */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Operational Score</p>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{snapshot.score.value}</div>
            <div className="text-lg font-semibold text-gray-600">{snapshot.score.grade}</div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {snapshot.score.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {snapshot.score.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
              {snapshot.score.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
              <span className="text-sm text-gray-600 capitalize">{snapshot.score.trend}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(snapshot.score.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Yesterday Compared
// ═════════════════════════════════════════════════════════════════════════════

interface ComparisonProps {
  comparison: ComparisonDisplay
}

export function YesterdayComparisonSection({ comparison }: ComparisonProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Yesterday Compared</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparison.metrics.map((metric, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500 mb-2">{metric.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{metric.current}</span>
              <span className="text-sm text-gray-500">vs {metric.previous}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {metric.changeDirection === 'up' && <TrendingUp className={`w-4 h-4 ${metric.isImprovement ? 'text-green-600' : 'text-red-600'}`} />}
              {metric.changeDirection === 'down' && <TrendingDown className={`w-4 h-4 ${metric.isImprovement ? 'text-green-600' : 'text-red-600'}`} />}
              {metric.changeDirection === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
              <span className={`text-sm font-medium ${metric.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Operational Highlights
// ═════════════════════════════════════════════════════════════════════════════

interface HighlightsProps {
  highlights: HighlightCard[]
  onViewEvidence: (item: any) => void
}

export function HighlightsSection({ highlights, onViewEvidence }: HighlightsProps) {
  const icons = { ChefHat, CheckCircle, Clock, CreditCard, Utensils, Users }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Operational Highlights</h3>
      
      {highlights.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No highlights for this period</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map((highlight) => {
            const Icon = icons[highlight.icon as keyof typeof icons] || CheckCircle
            
            return (
              <div key={highlight.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">{highlight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                    {highlight.value && (
                      <p className="text-sm font-medium text-green-600 mt-2">{highlight.value}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{highlight.improvement} improvement</span>
                      <span>{(highlight.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onViewEvidence(highlight)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Evidence ({highlight.evidenceCount})
                      </button>
                      {highlight.replayLink && (
                        <a
                          href={highlight.replayLink}
                          className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Replay
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Things That Need Attention
// ═════════════════════════════════════════════════════════════════════════════

interface AttentionProps {
  attention: AttentionCard[]
  onViewEvidence: (item: any) => void
}

export function AttentionSection({ attention, onViewEvidence }: AttentionProps) {
  const icons = { ChefHat, XCircle, AlertTriangle, Clock, Users }
  
  const severityColors = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50',
  }

  const severityTextColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Things That Need Attention</h3>
      
      {attention.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No issues detected - excellent work!</p>
      ) : (
        <div className="space-y-4">
          {attention.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons] || AlertTriangle
            
            return (
              <div key={item.id} className={`border rounded-lg p-4 ${severityColors[item.severity]}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${severityTextColors[item.severity]} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${severityTextColors[item.severity]} bg-white`}>
                        {item.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Impact:</span> {item.impact}
                    </p>
                    {item.historicalComparison && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Historical:</span> {item.historicalComparison}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onViewEvidence(item)}
                        className={`text-xs ${severityTextColors[item.severity]} hover:opacity-80 font-medium flex items-center gap-1`}
                      >
                        <FileText className="w-3 h-3" />
                        Evidence ({item.evidenceCount})
                      </button>
                      {item.replayLink && (
                        <a
                          href={item.replayLink}
                          className={`text-xs ${severityTextColors[item.severity]} hover:opacity-80 font-medium flex items-center gap-1`}
                        >
                          <Play className="w-3 h-3" />
                          Replay
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
