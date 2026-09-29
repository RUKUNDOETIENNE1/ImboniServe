/**
 * Daily Briefings™ - Utility Components
 * Includes: Period Selector, Search/Filter, Evidence Panel, States, Export Button
 */

'use client'

import { useState } from 'react'
import { Calendar, Search, Filter, Download, Loader2, AlertCircle, X, FileText, Play } from 'lucide-react'
import type { BriefingSelection } from '@/lib/daily-briefings/types'

// ═════════════════════════════════════════════════════════════════════════════
// Period Selector
// ═════════════════════════════════════════════════════════════════════════════

interface PeriodSelectorProps {
  selection: BriefingSelection
  onSelectionChange: (selection: BriefingSelection) => void
  loading: boolean
}

export function BriefingPeriodSelector({ selection, onSelectionChange, loading }: PeriodSelectorProps) {
  const periods = [
    { period: 'today' as const, label: 'Today' },
    { period: 'yesterday' as const, label: 'Yesterday' },
    { period: 'last_7_days' as const, label: 'Last 7 Days' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <Calendar className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.period}
              onClick={() => onSelectionChange(p)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selection.period === p.period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Search and Filters
// ═════════════════════════════════════════════════════════════════════════════

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: any
  onFiltersChange: (filters: any) => void
}

export function SearchAndFilters({ searchQuery, onSearchChange, filters, onFiltersChange }: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex-1 flex items-center gap-3">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search highlights, issues, moments..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>

      {/* Filter Panel (simplified) */}
      {showFilters && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <p className="text-sm text-gray-600">Filter options coming soon</p>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Export Button
// ═════════════════════════════════════════════════════════════════════════════

interface ExportButtonProps {
  briefingId: string
}

export function ExportButton({ briefingId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    setLoading(true)
    try {
      const response = await fetch('/api/daily-briefings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefingId, format }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily-briefing-${briefingId}.${format}`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group">
      <button
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export
      </button>
      
      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
        <button
          onClick={() => handleExport('json')}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        >
          Export as JSON
        </button>
        <button
          onClick={() => handleExport('markdown')}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        >
          Export as Markdown
        </button>
        <button
          onClick={() => handleExport('csv')}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        >
          Export as CSV
        </button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Evidence Panel
// ═════════════════════════════════════════════════════════════════════════════

interface EvidencePanelProps {
  open: boolean
  onClose: () => void
  item: any
}

export function EvidencePanel({ open, onClose, item }: EvidencePanelProps) {
  if (!open || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Evidence</h3>
            <p className="text-sm text-gray-600 mt-1">{item.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <p className="text-sm text-gray-600">{item.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-500">
                  Confidence: {(item.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-gray-500">
                  Evidence Items: {item.evidenceCount}
                </span>
              </div>
            </div>

            {/* Evidence Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Evidence Items</h4>
              <div className="space-y-2">
                {[...Array(item.evidenceCount)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">Evidence item {i + 1}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Related to operational event at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Replay Link */}
            {item.replayLink && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Replay</h4>
                <a
                  href={item.replayLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <Play className="w-4 h-4" />
                  Open Service Replay™
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Loading State
// ═════════════════════════════════════════════════════════════════════════════

export function LoadingState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600 mt-4">Generating your daily briefing...</p>
        <p className="text-sm text-gray-500 mt-2">This should only take a moment</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Error State
// ═════════════════════════════════════════════════════════════════════════════

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12">
      <div className="flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="text-gray-900 font-semibold mt-4">Failed to generate briefing</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
