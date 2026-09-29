'use client'

import type { EvidencePanel as EvidencePanelData } from '@/lib/service-intelligence/v2'
import { X, Play, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  evidence: EvidencePanelData
  onClose: () => void
}

export function EvidencePanel({ evidence, onClose }: Props) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evidence</h2>
            <p className="text-sm text-gray-500 mt-1">
              {evidence.totalCount} evidence items • {(evidence.confidence * 100).toFixed(0)}% confidence
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Replay Links */}
          {evidence.replayLinks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Replay Links</h3>
              <div className="space-y-2">
                {evidence.replayLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(link)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Play className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      View in Service Replay™
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Affected Entities */}
          {(evidence.affectedEntities.orders?.length || 
            evidence.affectedEntities.staff?.length ||
            evidence.affectedEntities.stations?.length) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Affected Entities</h3>
              <div className="grid grid-cols-3 gap-4">
                {evidence.affectedEntities.orders && evidence.affectedEntities.orders.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Orders</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {evidence.affectedEntities.orders.length}
                    </div>
                  </div>
                )}
                {evidence.affectedEntities.staff && evidence.affectedEntities.staff.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Staff</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {evidence.affectedEntities.staff.length}
                    </div>
                  </div>
                )}
                {evidence.affectedEntities.stations && evidence.affectedEntities.stations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Stations</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {evidence.affectedEntities.stations.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Evidence Items</h3>
            {evidence.evidence.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Evidence details will be loaded from the API</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidence.evidence.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                          {item.type}
                        </span>
                        {item.timestamp && (
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{item.description}</p>
                    {item.data && Object.keys(item.data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                          {JSON.stringify(item.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
