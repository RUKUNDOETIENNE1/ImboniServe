'use client'

import type { IssueCard, EvidencePanel as EvidencePanelData } from '@/lib/service-intelligence/v2'
import { AlertTriangle, Eye, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  issues: IssueCard[]
  onShowEvidence: (evidence: EvidencePanelData) => void
}

export function IssuesSection({ issues, onShowEvidence }: Props) {
  const router = useRouter()

  const handleReplay = (replayLink?: string) => {
    if (replayLink) {
      router.push(replayLink)
    }
  }

  const handleShowEvidence = (issue: IssueCard) => {
    onShowEvidence({
      itemId: issue.id,
      itemType: 'issue',
      evidence: [],
      totalCount: issue.evidenceCount,
      confidence: issue.confidence,
      replayLinks: issue.replayLink ? [issue.replayLink] : [],
      affectedEntities: {},
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-600 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Operational Issues</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No issues detected</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-900">Operational Issues</h2>
        <span className="ml-auto text-sm text-gray-500">{issues.length} found</span>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`border-2 rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(issue.severity)}`}>
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
                {issue.affectedOrders && (
                  <p className="text-xs text-gray-600 mb-2">{issue.affectedOrders} orders affected</p>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-2">{issue.description}</p>

            <div className="bg-white bg-opacity-50 rounded p-2 mb-3 space-y-1">
              <div className="text-xs">
                <span className="font-medium text-gray-700">Impact:</span>
                <span className="text-gray-600 ml-1">{issue.impact}</span>
              </div>
              {issue.rootCause && (
                <div className="text-xs">
                  <span className="font-medium text-gray-700">Root Cause:</span>
                  <span className="text-gray-600 ml-1">{issue.rootCause}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Confidence: {(issue.confidence * 100).toFixed(0)}%</span>
                <span>Evidence: {issue.evidenceCount}</span>
                {issue.timestamp && (
                  <span>{new Date(issue.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShowEvidence(issue)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3" />
                  Evidence
                </button>
                {issue.replayLink && (
                  <button
                    onClick={() => handleReplay(issue.replayLink)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
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
