'use client'

/**
 * Service Intelligence™ - Simple UI Components
 * Grouped together for efficiency
 */

import type {
  ServiceSelection,
  HistoricalContextDisplay,
  TimelineEvent,
  StaffInsightsDisplay,
  KitchenInsightsDisplay,
  CustomerJourneyDisplay,
  PatternCard,
  ComparisonDisplay,
  DashboardDiagnostics,
  EvidencePanel as EvidencePanelData,
} from '@/lib/service-intelligence/v2'
import { Search, Download, History, Clock, Users, ChefHat, TrendingUp, Repeat, Activity, Eye, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// Period Selector
// ─────────────────────────────────────────────────────────────────────────────

interface PeriodSelectorProps {
  selectedPeriod: ServiceSelection
  onSelectPeriod: (selection: ServiceSelection) => void
  loading: boolean
}

export function ServicePeriodSelector({ selectedPeriod, onSelectPeriod, loading }: PeriodSelectorProps) {
  const periods: ServiceSelection[] = [
    { period: 'today_lunch', label: 'Today Lunch' },
    { period: 'today_dinner', label: 'Today Dinner' },
    { period: 'yesterday', label: 'Yesterday' },
    { period: 'last_7_days', label: 'Last 7 Days' },
    { period: 'last_30_days', label: 'Last 30 Days' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <button
          key={period.period}
          onClick={() => onSelectPeriod(period)}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod.period === period.period
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Bar
// ─────────────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search intelligence..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Button
// ─────────────────────────────────────────────────────────────────────────────

interface ExportButtonProps {
  reportId: string
}

export function ExportButton({ reportId }: ExportButtonProps) {
  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    const response = await fetch(`/api/service-intelligence/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, format }),
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `service-intelligence-${reportId}.${format}`
      a.click()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('json')}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">JSON</span>
      </button>
      <button
        onClick={() => handleExport('markdown')}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Markdown</span>
      </button>
      <button
        onClick={() => handleExport('csv')}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">CSV</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────────────────────────────────────

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Generating intelligence...</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-800 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Context
// ─────────────────────────────────────────────────────────────────────────────

interface HistoricalContextProps {
  context: HistoricalContextDisplay
}

export function HistoricalContext({ context }: HistoricalContextProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Historical Context</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {context.insights.map((insight, index) => (
          <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{insight.type}</h3>
              <span className={`text-xs font-medium ${
                insight.trend === 'improving' ? 'text-green-600' :
                insight.trend === 'declining' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {insight.trend}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div>Has happened before: {insight.hasHappenedBefore ? 'Yes' : 'No'}</div>
              <div>Frequency: {insight.frequency} times</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineProps {
  events: TimelineEvent[]
}

export function Timeline({ events }: TimelineProps) {
  const router = useRouter()

  if (events.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Critical Timeline</h2>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex-shrink-0 w-20 text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                {event.replayLink && (
                  <button
                    onClick={() => router.push(event.replayLink!)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    <Play className="w-3 h-3" />
                    Replay
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Insights
// ─────────────────────────────────────────────────────────────────────────────

interface StaffInsightsProps {
  insights: StaffInsightsDisplay
}

export function StaffInsights({ insights }: StaffInsightsProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Staff Insights</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{insights.totalStaff}</div>
            <div className="text-xs text-gray-500">Total Staff</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{insights.avgWorkload.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Avg Workload</div>
          </div>
        </div>

        {insights.topPerformer && (
          <div className="bg-blue-50 rounded p-3">
            <div className="text-xs text-gray-600 mb-1">Top Performer</div>
            <div className="font-medium text-gray-900">{insights.topPerformer.name}</div>
            <div className="text-sm text-gray-700">{insights.topPerformer.efficiency.toFixed(0)}% efficiency</div>
          </div>
        )}

        <div className="space-y-2">
          {insights.insights.map((insight, index) => (
            <p key={index} className="text-sm text-gray-700">{insight}</p>
          ))}
        </div>

        {insights.replayLink && (
          <button
            onClick={() => router.push(insights.replayLink!)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <Play className="w-4 h-4" />
            View Replay
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Insights
// ─────────────────────────────────────────────────────────────────────────────

interface KitchenInsightsProps {
  insights: KitchenInsightsDisplay
}

export function KitchenInsights({ insights }: KitchenInsightsProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <ChefHat className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-gray-900">Kitchen Insights</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{insights.overallUtilization}%</div>
            <div className="text-xs text-gray-500">Utilization</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{insights.peakUtilization}%</div>
            <div className="text-xs text-gray-500">Peak</div>
          </div>
        </div>

        {insights.bottlenecks.length > 0 && (
          <div className="bg-orange-50 rounded p-3">
            <div className="text-xs text-gray-600 mb-2">Bottlenecks</div>
            <div className="space-y-1">
              {insights.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="text-sm text-gray-900">{bottleneck}</div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {insights.insights.map((insight, index) => (
            <p key={index} className="text-sm text-gray-700">{insight}</p>
          ))}
        </div>

        {insights.replayLink && (
          <button
            onClick={() => router.push(insights.replayLink!)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded hover:bg-orange-700"
          >
            <Play className="w-4 h-4" />
            View Replay
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Journey
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerJourneyProps {
  journey: CustomerJourneyDisplay
}

export function CustomerJourney({ journey }: CustomerJourneyProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Customer Journey</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{journey.avgDuration}</div>
          <div className="text-xs text-gray-500">Average Duration</div>
        </div>

        <div className="space-y-2">
          {journey.stages.map((stage) => (
            <div key={stage.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{stage.name}</span>
                <span className="text-gray-900 font-medium">{stage.avgDuration}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {journey.bottlenecks.length > 0 && (
          <div className="bg-yellow-50 rounded p-3">
            <div className="text-xs text-gray-600 mb-2">Bottlenecks</div>
            <div className="space-y-1">
              {journey.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="text-sm text-gray-900">{bottleneck}</div>
              ))}
            </div>
          </div>
        )}

        {journey.replayLink && (
          <button
            onClick={() => router.push(journey.replayLink!)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            View Replay
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Patterns Section
// ─────────────────────────────────────────────────────────────────────────────

interface PatternsSectionProps {
  patterns: PatternCard[]
  onShowEvidence: (evidence: EvidencePanelData) => void
}

export function PatternsSection({ patterns, onShowEvidence }: PatternsSectionProps) {
  const router = useRouter()

  if (patterns.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Repeat className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Patterns</h2>
        <span className="ml-auto text-sm text-gray-500">{patterns.length} detected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-2">{pattern.title}</h3>
            <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
              <div>Frequency: {pattern.frequency}</div>
              <div>Occurrences: {pattern.occurrences}</div>
              <div>Confidence: {(pattern.confidence * 100).toFixed(0)}%</div>
              <div>Predictability: {(pattern.predictability * 100).toFixed(0)}%</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onShowEvidence({
                  itemId: pattern.id,
                  itemType: 'pattern',
                  evidence: [],
                  totalCount: pattern.evidenceCount,
                  confidence: pattern.confidence,
                  replayLinks: pattern.replayLink ? [pattern.replayLink] : [],
                  affectedEntities: {},
                })}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                <Eye className="w-3 h-3" />
                Evidence
              </button>
              {pattern.replayLink && (
                <button
                  onClick={() => router.push(pattern.replayLink!)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <Play className="w-3 h-3" />
                  Replay
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparisons Section
// ─────────────────────────────────────────────────────────────────────────────

interface ComparisonsSectionProps {
  comparison: ComparisonDisplay
}

export function ComparisonsSection({ comparison }: ComparisonsSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Comparison: {comparison.period}</h2>
      </div>

      <p className="text-gray-700 mb-6">{comparison.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {comparison.metrics.map((metric) => (
          <div key={metric.name} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{metric.name}</span>
              <span className={`text-sm font-medium ${
                metric.trend === 'improved' ? 'text-green-600' :
                metric.trend === 'declined' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Current: {metric.current}</span>
              <span>Previous: {metric.previous}</span>
            </div>
          </div>
        ))}
      </div>

      {comparison.improvements.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-green-700 mb-2">Improvements</h3>
          <ul className="space-y-1">
            {comparison.improvements.map((improvement, index) => (
              <li key={index} className="text-sm text-gray-700">• {improvement}</li>
            ))}
          </ul>
        </div>
      )}

      {comparison.regressions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-red-700 mb-2">Regressions</h3>
          <ul className="space-y-1">
            {comparison.regressions.map((regression, index) => (
              <li key={index} className="text-sm text-gray-700">• {regression}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DiagnosticsPanelProps {
  diagnostics: DashboardDiagnostics
}

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Diagnostics</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div>
          <div className="text-gray-500">Generation Time</div>
          <div className="font-semibold text-gray-900">{diagnostics.generationTime}ms</div>
        </div>
        <div>
          <div className="text-gray-500">Data Quality</div>
          <div className="font-semibold text-gray-900">{(diagnostics.dataQuality * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Confidence</div>
          <div className="font-semibold text-gray-900">{(diagnostics.confidence * 100).toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-gray-500">Event Count</div>
          <div className="font-semibold text-gray-900">{diagnostics.eventCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Analysis Depth</div>
          <div className="font-semibold text-gray-900">{(diagnostics.analysisDepth * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  )
}
