/**
 * Menu Intelligence™ - All Dashboard Sections & Components
 * Comprehensive component file with all 16+ sections
 */

'use client'

import { useState } from 'react'
import { 
  CheckCircle, ThumbsUp, AlertCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, Minus,
  Play, FileText, ChefHat, Clock, Utensils, Zap, Award, Star, Download, Search, Filter, X, Loader2, Edit
} from 'lucide-react'
import type {
  OverviewDisplay, PerformanceDisplay, TopPerformingDisplay, LowestPerformingDisplay,
  PreparationDisplay, ProfitabilityDisplay, PopularityDisplay, CancellationDisplay,
  ModificationDisplay, ConsistencyDisplay, CrossSellingDisplay, TrendsDisplay,
  SeasonalDisplay, HighlightCard, IssueCard, MenuReportingPeriod, DishCard, DishIssueCard
} from '@/lib/menu-intelligence/types'

// ═════════════════════════════════════════════════════════════════════════════
// Overview Section
// ═════════════════════════════════════════════════════════════════════════════

export function OverviewSection({ overview }: { overview: OverviewDisplay }) {
  const Icon = overview.statusIcon === 'CheckCircle' ? CheckCircle : 
               overview.statusIcon === 'ThumbsUp' ? ThumbsUp :
               overview.statusIcon === 'AlertCircle' ? AlertCircle :
               overview.statusIcon === 'AlertTriangle' ? AlertTriangle : XCircle

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className={`w-6 h-6 ${overview.statusColor}`} />
          </div>
          <div className="text-4xl font-bold text-gray-900">{overview.score}</div>
          <div className="text-lg font-semibold text-gray-600">{overview.grade}</div>
          <div className={`text-sm font-medium ${overview.statusColor} mt-1`}>{overview.status}</div>
        </div>

        {overview.metrics.slice(0, 3).map((metric, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-gray-500 mb-2">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color || 'text-gray-900'}`}>{metric.value}</p>
            {metric.trend && (
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {metric.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
                {metric.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
                <span className="text-sm text-gray-600 capitalize">{metric.trend}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Popular Items</p>
          <div className="flex flex-wrap gap-2">
            {overview.popularItems.map((item, i) => (
              <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
        {overview.slowItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Slow Items</p>
            <div className="flex flex-wrap gap-2">
              {overview.slowItems.map((item, i) => (
                <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Performance Section
// ═════════════════════════════════════════════════════════════════════════════

export function PerformanceSection({ performance }: { performance: PerformanceDisplay }) {
  const Icon = performance.trendIcon === 'TrendingUp' ? TrendingUp : 
               performance.trendIcon === 'TrendingDown' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Performance Score</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">{performance.overall}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Icon className={`w-5 h-5 ${performance.trendColor}`} />
            <span className={`text-sm font-medium ${performance.trendColor} capitalize`}>{performance.trend}</span>
          </div>
          {performance.comparison && (
            <div className="mt-3 text-sm text-gray-600">
              Previous: {performance.comparison.previous} ({performance.comparison.change})
            </div>
          )}
        </div>

        <div className="space-y-3">
          {performance.dimensions.map((dim, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{dim.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${dim.color.replace('text-', 'bg-')}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${dim.color} w-8 text-right`}>{dim.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Top Performing Dishes
// ═════════════════════════════════════════════════════════════════════════════

export function TopPerformingSection({ topPerforming, onViewEvidence }: { 
  topPerforming: TopPerformingDisplay
  onViewEvidence: (item: any) => void 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Dishes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Ordered</h4>
          <div className="space-y-2">
            {topPerforming.mostOrdered.slice(0, 5).map((dish, i) => (
              <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-semibold">{dish.value}</span>
                  {dish.replayLink && (
                    <a href={dish.replayLink} className="text-blue-600 hover:text-blue-700">
                      <Play className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Fastest Preparation</h4>
          <div className="space-y-2">
            {topPerforming.fastestPrep.slice(0, 5).map((dish, i) => (
              <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
                <span className="text-sm text-green-600 font-semibold">{dish.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Highest Completion</h4>
          <div className="space-y-2">
            {topPerforming.highestCompletion.slice(0, 5).map((dish, i) => (
              <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
                <span className="text-sm text-green-600 font-semibold">{dish.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Efficient</h4>
          <div className="space-y-2">
            {topPerforming.mostEfficient.slice(0, 5).map((dish, i) => (
              <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
                <span className="text-sm text-green-600 font-semibold">{dish.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Lowest Performing Dishes
// ═════════════════════════════════════════════════════════════════════════════

export function LowestPerformingSection({ lowestPerforming, onViewEvidence }: {
  lowestPerforming: LowestPerformingDisplay
  onViewEvidence: (item: any) => void
}) {
  if (lowestPerforming.cancelled.length === 0 && lowestPerforming.delays.length === 0 && lowestPerforming.modifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Lowest Performing Dishes</h3>
        <p className="text-gray-500 text-center py-8">No performance issues detected - excellent menu performance!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Lowest Performing Dishes</h3>
      
      <div className="space-y-4">
        {lowestPerforming.cancelled.map((dish, i) => (
          <div key={i} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{dish.dish}</h4>
                <p className="text-sm text-gray-600 mt-1">{dish.issue}</p>
                <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Impact:</span> {dish.impact}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${dish.severityColor} bg-white border`}>
                {dish.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onViewEvidence(dish)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Evidence ({dish.evidenceCount})
              </button>
              {dish.replayLink && (
                <a href={dish.replayLink} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Replay
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Remaining Sections (Simplified)
// ═════════════════════════════════════════════════════════════════════════════

export function PreparationSection({ preparation }: { preparation: PreparationDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Preparation Impact</h3>
      <div className="space-y-3">
        {preparation.averageByDish.slice(0, 10).map((dish, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{dish.time}</span>
              <span className={`text-xs px-2 py-1 rounded ${dish.consistency === 'High' ? 'bg-green-100 text-green-700' : dish.consistency === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {dish.consistency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PopularitySection({ popularity }: { popularity: PopularityDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Popularity Trends</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Popular</h4>
          <div className="space-y-2">
            {popularity.mostPopular.map((dish, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{dish.dish}</span>
                <span className="text-gray-600">{dish.orders} {dish.trend}</span>
              </div>
            ))}
          </div>
        </div>
        {popularity.growing.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-3">Growing</h4>
            <div className="space-y-2">
              {popularity.growing.map((dish, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-900">{dish.dish}</span>
                  <span className="text-green-600 font-medium">{dish.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {popularity.declining.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-3">Declining</h4>
            <div className="space-y-2">
              {popularity.declining.map((dish, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-900">{dish.dish}</span>
                  <span className="text-red-600 font-medium">{dish.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CancellationSection({ cancellation }: { cancellation: CancellationDisplay }) {
  if (cancellation.topCancelled.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Analysis</h3>
        <p className="text-gray-500 text-center py-8">No significant cancellations - excellent completion rate!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Cancelled</h4>
          <div className="space-y-2">
            {cancellation.topCancelled.map((dish, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{dish.dish}</span>
                <span className="text-red-600 font-medium">{dish.count} ({dish.rate})</span>
              </div>
            ))}
          </div>
        </div>
        {cancellation.reasons.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Reasons</h4>
            <div className="space-y-2">
              {cancellation.reasons.map((reason, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-900">{reason.reason}</span>
                  <span className="text-gray-600">{reason.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ModificationSection({ modification }: { modification: ModificationDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Modification Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Most Modified</h4>
          <div className="space-y-2">
            {modification.mostModified.map((dish, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{dish.dish}</span>
                <span className="text-blue-600 font-medium">{dish.count} ({dish.rate})</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Common Modifications</h4>
          <div className="space-y-2">
            {modification.commonMods.map((mod, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{mod.modification}</span>
                <span className="text-gray-600">{mod.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConsistencySection({ consistency }: { consistency: ConsistencyDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Consistency</h3>
      <div className="space-y-3">
        {consistency.scores.slice(0, 10).map((dish, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{dish.dish}</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${dish.score}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-8 text-right">{dish.score}</span>
            </div>
          </div>
        ))}
      </div>
      {consistency.trend && (
        <div className="mt-4 text-sm text-gray-600">
          Trend: <span className={consistency.trend.direction === 'improving' ? 'text-green-600' : 'text-red-600'}>
            {consistency.trend.direction} ({consistency.trend.change})
          </span>
        </div>
      )}
    </div>
  )
}

export function CrossSellingSection({ crossSelling }: { crossSelling: CrossSellingDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Cross-Selling Opportunities</h3>
      <div className="space-y-4">
        {crossSelling.combinations.map((combo, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">{combo.dishes.join(' + ')}</span>
              <span className="text-sm text-gray-600">{combo.frequency} times</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendsSection({ trends }: { trends: TrendsDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Historical Menu Trends</h3>
      <div className="space-y-4">
        {trends.longTerm.slice(0, 10).map((trend, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">{trend.dish}</span>
            <span className={`text-sm font-medium ${trend.trend === 'increasing' ? 'text-green-600' : trend.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
              {trend.trend === 'increasing' ? '↑' : trend.trend === 'decreasing' ? '↓' : '→'} {trend.trend}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Highlights & Issues
// ═════════════════════════════════════════════════════════════════════════════

export function HighlightsSection({ highlights, onViewEvidence }: {
  highlights: HighlightCard[]
  onViewEvidence: (item: any) => void
}) {
  if (highlights.length === 0) return null

  const icons = { TrendingUp, Zap, ChefHat, CheckCircle, Star }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Highlights</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map((highlight) => {
          const Icon = icons[highlight.categoryIcon as keyof typeof icons] || Star

          return (
            <div key={highlight.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${highlight.categoryColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">{highlight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                  {highlight.improvement && (
                    <p className="text-sm font-medium text-green-600 mt-2">{highlight.improvement} improvement</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onViewEvidence(highlight)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Evidence ({highlight.evidenceCount})
                    </button>
                    {highlight.replayLink && (
                      <a href={highlight.replayLink} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
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
    </div>
  )
}

export function IssuesSection({ issues, onViewEvidence }: {
  issues: IssueCard[]
  onViewEvidence: (item: any) => void
}) {
  if (issues.length === 0) return null

  const icons = { Clock, XCircle, Edit, AlertTriangle }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Menu Issues</h3>
      
      <div className="space-y-4">
        {issues.map((issue) => {
          const Icon = icons[issue.categoryIcon as keyof typeof icons] || AlertTriangle

          return (
            <div key={issue.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${issue.severityColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{issue.title}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${issue.severityColor} bg-white border`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-medium">Impact:</span> {issue.impact}
                  </p>
                  {issue.recommendation && (
                    <p className="text-sm text-blue-600 mt-2">
                      <span className="font-medium">Recommendation:</span> {issue.recommendation}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onViewEvidence(issue)}
                      className={`text-xs ${issue.severityColor} hover:opacity-80 font-medium flex items-center gap-1`}
                    >
                      <FileText className="w-3 h-3" />
                      Evidence ({issue.evidenceCount})
                    </button>
                    {issue.replayLink && (
                      <a href={issue.replayLink} className={`text-xs ${issue.severityColor} hover:opacity-80 font-medium flex items-center gap-1`}>
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
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Utility Components
// ═════════════════════════════════════════════════════════════════════════════

export function PeriodSelector({ period, onPeriodChange, loading }: {
  period: MenuReportingPeriod
  onPeriodChange: (period: MenuReportingPeriod) => void
  loading: boolean
}) {
  const periods = [
    { type: 'today' as const, label: 'Today' },
    { type: 'this_week' as const, label: 'This Week' },
    { type: 'this_month' as const, label: 'This Month' },
    { type: 'last_month' as const, label: 'Last Month' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <Utensils className="w-5 h-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.type}
              onClick={() => onPeriodChange({ ...period, type: p.type, label: p.label })}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period.type === p.type
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

export function SearchAndFilters({ searchQuery, onSearchChange, filters, onFiltersChange }: {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: any
  onFiltersChange: (filters: any) => void
}) {
  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu items, highlights, issues..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
        <Filter className="w-4 h-4" />
        Filters
      </button>
    </div>
  )
}

export function ExportButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    setLoading(true)
    try {
      const response = await fetch('/api/menu-intelligence/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, format }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `menu-intelligence-${reportId}.${format}`
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
        <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as JSON</button>
        <button onClick={() => handleExport('markdown')} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as Markdown</button>
        <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
      </div>
    </div>
  )
}

export function EvidencePanel({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  if (!open || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Evidence</h3>
            <p className="text-sm text-gray-600 mt-1">{item.title || item.dish}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 mb-4">{item.description}</p>
          <div className="space-y-2">
            {[...Array(item.evidenceCount || 3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">Evidence item {i + 1}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Related to menu item operation</p>
              </div>
            ))}
          </div>
          {item.replayLink && (
            <div className="mt-4">
              <a href={item.replayLink} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Play className="w-4 h-4" />
                Open Service Replay™
              </a>
            </div>
          )}
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
        <p className="text-gray-600 mt-4">Generating menu intelligence report...</p>
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
