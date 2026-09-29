/**
 * Phase 1.2D Power Layer Components
 * 
 * Reusable intelligence components for CFO Dashboard
 */

import { useState } from 'react'

import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  XCircle,
  CheckCircle,
  Activity,
  TrendingUp,
  Shield,
  Lightbulb
} from 'lucide-react'

interface CfoMetricInsight {
  metricName: string
  insight: string
  rootCause: string
  action: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE'
}

interface SignalCorrelation {
  pattern: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  signals: string[]
  hypothesis: string
  action: string
  priority: number
}

interface CfoNarrative {
  section: string
  narrative: string
  tone: 'CRITICAL' | 'WARNING' | 'NEUTRAL' | 'POSITIVE'
}

/**
 * Insight Layer Component
 * Expandable intelligence panel for each metric
 */
export function InsightLayer({ insight }: { insight: CfoMetricInsight }) {
  const [expanded, setExpanded] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-200 bg-red-50'
      case 'WARNING': return 'border-yellow-200 bg-yellow-50'
      case 'POSITIVE': return 'border-green-200 bg-green-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-600" />
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'POSITIVE': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-900'
      case 'WARNING': return 'text-yellow-900'
      case 'POSITIVE': return 'text-green-900'
      default: return 'text-blue-900'
    }
  }

  return (
    <div className={`border-2 rounded-lg ${getSeverityColor(insight.severity)}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center space-x-3">
          {getSeverityIcon(insight.severity)}
          <div className="text-left">
            <p className={`text-sm font-semibold ${getSeverityTextColor(insight.severity)}`}>
              {insight.insight}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className={`h-4 w-4 ${getSeverityTextColor(insight.severity)}`} />
        ) : (
          <ChevronDown className={`h-4 w-4 ${getSeverityTextColor(insight.severity)}`} />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-current border-opacity-20">
          <div className="pt-3">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${getSeverityTextColor(insight.severity)}`}>
              Root Cause
            </p>
            <p className={`text-sm ${getSeverityTextColor(insight.severity)}`}>
              {insight.rootCause}
            </p>
          </div>

          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${getSeverityTextColor(insight.severity)}`}>
              Recommended Action
            </p>
            <p className={`text-sm font-medium ${getSeverityTextColor(insight.severity)}`}>
              {insight.action}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Cross-Signal Alert Panel Component
 * Shows correlations across multiple systems
 */
export function CrossSignalAlertPanel({ correlations }: { correlations: SignalCorrelation[] }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-300 bg-red-50'
      case 'WARNING': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-blue-300 bg-blue-50'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white'
      case 'WARNING': return 'bg-yellow-600 text-white'
      default: return 'bg-blue-600 text-white'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-5 w-5 text-red-600" />
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default: return <Activity className="h-5 w-5 text-blue-600" />
    }
  }

  // Sort by priority
  const sortedCorrelations = [...correlations].sort((a, b) => b.priority - a.priority)

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200">
      <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-purple-900">Cross-Signal Intelligence</h2>
        </div>
        <p className="text-sm text-purple-700 mt-1">
          What is happening across the system?
        </p>
      </div>

      <div className="p-6 space-y-4">
        {sortedCorrelations.map((correlation, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getSeverityColor(correlation.severity)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(correlation.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${getSeverityBadgeColor(correlation.severity)}`}>
                    {correlation.severity}
                  </span>
                  <span className="text-xs text-gray-500">Pattern: {correlation.pattern}</span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{correlation.title}</h3>
                <p className="text-sm text-gray-700 mb-3">{correlation.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Correlated Signals:</p>
                  <ul className="space-y-1">
                    {correlation.signals.map((signal, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Hypothesis:</p>
                  <p className="text-sm text-gray-800">{correlation.hypothesis}</p>
                </div>

                <div className="bg-white rounded-lg p-3 border-2 border-current border-opacity-30">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Recommended Action:</p>
                  <p className="text-sm font-medium text-gray-900">{correlation.action}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * CFO Interpretation Box Component
 * Plain-English narrative for each section
 */
export default function CfoPowerComponentsPage() {
  return null
}

export function CfoInterpretationBox({ narrative }: { narrative: CfoNarrative }) {
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'CRITICAL': return 'border-red-300 bg-red-50 text-red-900'
      case 'WARNING': return 'border-yellow-300 bg-yellow-50 text-yellow-900'
      case 'POSITIVE': return 'border-green-300 bg-green-50 text-green-900'
      default: return 'border-blue-300 bg-blue-50 text-blue-900'
    }
  }

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'CRITICAL': return <XCircle className="h-5 w-5 text-red-600" />
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'POSITIVE': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Lightbulb className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${getToneColor(narrative.tone)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getToneIcon(narrative.tone)}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-75">
            CFO Interpretation
          </p>
          <p className="text-sm leading-relaxed font-medium">
            {narrative.narrative}
          </p>
        </div>
      </div>
    </div>
  )
}
