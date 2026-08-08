'use client'

import type { RecommendationCard, EvidencePanel as EvidencePanelData } from '@/lib/service-intelligence/v2'
import { Lightbulb, Eye, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  recommendations: RecommendationCard[]
  onShowEvidence: (evidence: EvidencePanelData) => void
}

export function RecommendationsSection({ recommendations, onShowEvidence }: Props) {
  const router = useRouter()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
        <span className="ml-auto text-sm text-gray-500">{recommendations.length} actions</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border-l-4 rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 flex-1">{rec.action}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(rec.priority)}`}>
                {rec.priority.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 mb-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Impact:</span>
                <span className="text-gray-600 ml-1">{rec.expectedImpact}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Timeframe:</span>
                <span className="text-gray-600 ml-1">{rec.timeframe}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Effort:</span>
                <span className="text-gray-600 ml-1 capitalize">{rec.effort}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-600">Evidence: {rec.evidenceCount}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onShowEvidence({
                    itemId: rec.id,
                    itemType: 'recommendation',
                    evidence: [],
                    totalCount: rec.evidenceCount,
                    confidence: 0.8,
                    replayLinks: rec.replayLink ? [rec.replayLink] : [],
                    affectedEntities: {},
                  })}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3" />
                  Evidence
                </button>
                {rec.replayLink && (
                  <button
                    onClick={() => router.push(rec.replayLink!)}
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
