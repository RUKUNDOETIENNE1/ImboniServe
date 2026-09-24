'use client'

import type { HighlightCard, EvidencePanel as EvidencePanelData } from '@/lib/service-intelligence/v2'
import { Sparkles, Eye, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  highlights: HighlightCard[]
  onShowEvidence: (evidence: EvidencePanelData) => void
}

export function HighlightsSection({ highlights, onShowEvidence }: Props) {
  const router = useRouter()

  const handleReplay = (replayLink?: string) => {
    if (replayLink) {
      router.push(replayLink)
    }
  }

  const handleShowEvidence = (highlight: HighlightCard) => {
    onShowEvidence({
      itemId: highlight.id,
      itemType: 'highlight',
      evidence: [], // Would be fetched from API
      totalCount: highlight.evidenceCount,
      confidence: highlight.confidence,
      replayLinks: highlight.replayLink ? [highlight.replayLink] : [],
      affectedEntities: {},
    })
  }

  if (highlights.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Highlights</h2>
        <span className="ml-auto text-sm text-gray-500">{highlights.length} found</span>
      </div>

      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className="border border-green-200 rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{highlight.title}</h3>
              {highlight.value && (
                <span className="text-lg font-bold text-green-600">{highlight.value}</span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-3">{highlight.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>Confidence: {(highlight.confidence * 100).toFixed(0)}%</span>
                <span>Evidence: {highlight.evidenceCount}</span>
                {highlight.timestamp && (
                  <span>{new Date(highlight.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShowEvidence(highlight)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3" />
                  Evidence
                </button>
                {highlight.replayLink && (
                  <button
                    onClick={() => handleReplay(highlight.replayLink)}
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
