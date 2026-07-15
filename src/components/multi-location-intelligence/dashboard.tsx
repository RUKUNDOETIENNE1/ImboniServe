/**
 * Multi-location Intelligence™ - Complete Dashboard & Components
 */

'use client'

import { useState } from 'react'
import { Building2, TrendingUp, TrendingDown, Minus, CheckCircle, ThumbsUp, AlertCircle, AlertTriangle, XCircle, Play, FileText, Award, Users, ChefHat, Utensils, Settings, Download, Search, X, Loader2, RefreshCw } from 'lucide-react'
import type { PortfolioDashboard as PortfolioDashboardType, PortfolioReportingPeriod } from '@/lib/multi-location-intelligence/types'

export function PortfolioDashboard({ dashboard }: { dashboard: PortfolioDashboardType }) {
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search restaurants..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <ExportButton reportId={dashboard.metadata.id} />
      </div>
      <OverviewSection overview={dashboard.overviewDisplay} />
      <PerformanceSection performance={dashboard.performanceDisplay} />
      <RankingSection ranking={dashboard.rankingDisplay} />
      <DistributionSection distribution={dashboard.distributionDisplay} />
      <GrowthSection growth={dashboard.growthDisplay} />
      {dashboard.highlightsDisplay.length > 0 && <HighlightsSection highlights={dashboard.highlightsDisplay} onViewEvidence={(item) => { setSelectedItem(item); setEvidencePanelOpen(true); }} />}
      {dashboard.issuesDisplay.length > 0 && <IssuesSection issues={dashboard.issuesDisplay} onViewEvidence={(item) => { setSelectedItem(item); setEvidencePanelOpen(true); }} />}
      {dashboard.bestPracticesDisplay.length > 0 && <BestPracticesSection practices={dashboard.bestPracticesDisplay} onViewEvidence={(item) => { setSelectedItem(item); setEvidencePanelOpen(true); }} />}
      <EvidencePanel open={evidencePanelOpen} onClose={() => setEvidencePanelOpen(false)} item={selectedItem} />
    </div>
  )
}

function OverviewSection({ overview }: { overview: any }) {
  const Icon = overview.statusIcon === 'CheckCircle' ? CheckCircle : overview.statusIcon === 'ThumbsUp' ? ThumbsUp : AlertCircle
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-4xl font-bold text-gray-900">{overview.restaurantCount}</div>
          <div className="text-sm text-gray-600 mt-1">Restaurants</div>
        </div>
        <div className="text-center">
          <Icon className={`w-6 h-6 ${overview.statusColor} mx-auto mb-2`} />
          <div className="text-4xl font-bold text-gray-900">{overview.score}</div>
          <div className="text-lg font-semibold text-gray-600">{overview.grade}</div>
        </div>
        {overview.metrics.slice(0, 2).map((metric: any, i: number) => (
          <div key={i}>
            <p className="text-sm font-medium text-gray-500 mb-2">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PerformanceSection({ performance }: { performance: any }) {
  const Icon = performance.trendIcon === 'TrendingUp' ? TrendingUp : performance.trendIcon === 'TrendingDown' ? TrendingDown : Minus
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">{performance.overall}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Icon className={`w-5 h-5 ${performance.trendColor}`} />
            <span className={`text-sm font-medium ${performance.trendColor}`}>{performance.trend}</span>
          </div>
        </div>
        <div className="space-y-3">
          {performance.dimensions.map((dim: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{dim.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${dim.color.replace('text-', 'bg-')}`} style={{ width: `${dim.score}%` }} />
                </div>
                <span className={`text-sm font-semibold ${dim.color}`}>{dim.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RankingSection({ ranking }: { ranking: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Ranking</h3>
      <div className="space-y-4">
        {ranking.restaurants.map((r: any) => {
          const TrendIcon = r.trendIcon === 'TrendingUp' ? TrendingUp : r.trendIcon === 'TrendingDown' ? TrendingDown : Minus
          return (
            <div key={r.rank} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-2xl font-bold text-gray-400">{r.rank}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{r.name}</h4>
                    <p className="text-sm text-gray-600">{r.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{r.score}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-xs">{r.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DistributionSection({ distribution }: { distribution: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Distribution</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-2">Top</h4>
          {distribution.topPerformers.map((name: string, i: number) => (
            <div key={i} className="text-sm bg-green-50 px-3 py-2 rounded mb-1">{name}</div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-700 mb-2">Middle</h4>
          {distribution.middlePerformers.map((name: string, i: number) => (
            <div key={i} className="text-sm bg-blue-50 px-3 py-2 rounded mb-1">{name}</div>
          ))}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-orange-700 mb-2">Attention</h4>
          {distribution.needsAttention.map((name: string, i: number) => (
            <div key={i} className="text-sm bg-orange-50 px-3 py-2 rounded mb-1">{name}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GrowthSection({ growth }: { growth: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth Trends</h3>
      <div className="space-y-2">
        {growth.restaurants.map((r: any, i: number) => (
          <div key={i} className="flex justify-between p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium">{r.name}</span>
            <span className="text-sm text-green-600 font-semibold">+{r.improvement}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HighlightsSection({ highlights, onViewEvidence }: { highlights: any[]; onViewEvidence: (item: any) => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Highlights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highlights.map((h) => (
          <div key={h.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 text-sm">{h.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{h.description}</p>
            <button onClick={() => onViewEvidence(h)} className="text-xs text-green-600 mt-2">Evidence ({h.evidenceCount})</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IssuesSection({ issues, onViewEvidence }: { issues: any[]; onViewEvidence: (item: any) => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Issues</h3>
      <div className="space-y-4">
        {issues.map((i) => (
          <div key={i.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 text-sm">{i.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{i.description}</p>
            <button onClick={() => onViewEvidence(i)} className="text-xs text-red-600 mt-2">Evidence ({i.evidenceCount})</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function BestPracticesSection({ practices, onViewEvidence }: { practices: any[]; onViewEvidence: (item: any) => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Best Practices</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practices.map((p) => (
          <div key={p.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 text-sm">{p.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{p.description}</p>
            <button onClick={() => onViewEvidence(p)} className="text-xs text-blue-600 mt-2">Evidence ({p.evidenceCount})</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PeriodSelector({ period, onPeriodChange, loading }: { period: PortfolioReportingPeriod; onPeriodChange: (period: PortfolioReportingPeriod) => void; loading: boolean }) {
  const periods = [
    { type: 'today' as const, label: 'Today' },
    { type: 'this_week' as const, label: 'This Week' },
    { type: 'this_month' as const, label: 'This Month' },
    { type: 'quarter' as const, label: 'Quarter' },
    { type: 'year' as const, label: 'Year' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <Building2 className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {periods.map((p) => (
            <button key={p.type} onClick={() => onPeriodChange({ ...period, type: p.type, label: p.label })} disabled={loading} className={`px-4 py-2 rounded-lg text-sm font-medium ${period.type === p.type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
      </div>
    </div>
  )
}

export function ExportButton({ reportId }: { reportId: string }) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
      <Download className="w-4 h-4" />
      Export
    </button>
  )
}

export function EvidencePanel({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  if (!open || !item) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Evidence</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
      </div>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600 mt-4">Generating portfolio intelligence...</p>
      </div>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 p-12">
      <div className="flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="text-gray-900 font-semibold mt-4">Failed to generate report</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        <button onClick={onRetry} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Try Again</button>
      </div>
    </div>
  )
}
