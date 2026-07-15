/**
 * Kitchen Intelligence™ - All Dashboard Sections
 * Comprehensive component file with all 20+ sections
 */

'use client'

import { useState } from 'react'
import { 
  CheckCircle, ThumbsUp, AlertCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, Minus,
  Play, FileText, ChefHat, Clock, Utensils, Zap, Award, Star, Download, Search, Filter, X, Loader2
} from 'lucide-react'
import type {
  OverviewDisplay, PerformanceDisplay, StationDisplay, QueueDisplay, PreparationDisplay,
  BottleneckCard, RecoveryDisplay, WorkloadDisplay, RecipeDisplay, IngredientDisplay,
  TrendsDisplay, PeakLoadDisplay, HighlightCard, IssueCard, KitchenReportingPeriod
} from '@/lib/kitchen-intelligence/types'

// ═════════════════════════════════════════════════════════════════════════════
// Overview Section
// ═════════════════════════════════════════════════════════════════════════════

interface OverviewProps {
  overview: OverviewDisplay
}

export function OverviewSection({ overview }: OverviewProps) {
  const Icon = overview.statusIcon === 'CheckCircle' ? CheckCircle : 
               overview.statusIcon === 'ThumbsUp' ? ThumbsUp :
               overview.statusIcon === 'AlertCircle' ? AlertCircle :
               overview.statusIcon === 'AlertTriangle' ? AlertTriangle : XCircle

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon className={`w-6 h-6 ${overview.statusColor}`} />
          </div>
          <div className="text-4xl font-bold text-gray-900">{overview.score}</div>
          <div className="text-lg font-semibold text-gray-600">{overview.grade}</div>
          <div className={`text-sm font-medium ${overview.statusColor} mt-1`}>{overview.status}</div>
        </div>

        {/* Metrics */}
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
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Performance Section
// ═════════════════════════════════════════════════════════════════════════════

interface PerformanceProps {
  performance: PerformanceDisplay
}

export function PerformanceSection({ performance }: PerformanceProps) {
  const Icon = performance.trendIcon === 'TrendingUp' ? TrendingUp : 
               performance.trendIcon === 'TrendingDown' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Performance Score</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Score */}
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

        {/* Dimensions */}
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
// Stations Section
// ═════════════════════════════════════════════════════════════════════════════

interface StationsProps {
  stations: StationDisplay[]
  onViewEvidence: (item: any) => void
}

export function StationsSection({ stations, onViewEvidence }: StationsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Station Health</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station, i) => {
          const Icon = station.statusIcon === 'CheckCircle' ? CheckCircle : 
                       station.statusIcon === 'ThumbsUp' ? ThumbsUp :
                       station.statusIcon === 'AlertCircle' ? AlertCircle :
                       station.statusIcon === 'AlertTriangle' ? AlertTriangle : XCircle

          return (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{station.name}</h4>
                <Icon className={`w-5 h-5 ${station.statusColor}`} />
              </div>
              
              <div className="space-y-2 mb-3">
                {station.metrics.map((metric, j) => (
                  <div key={j} className="flex justify-between text-sm">
                    <span className="text-gray-600">{metric.label}</span>
                    <span className="font-medium text-gray-900">{metric.value}</span>
                  </div>
                ))}
              </div>

              {station.highlights.length > 0 && (
                <div className="text-xs text-green-600 mb-2">
                  ✓ {station.highlights[0]}
                </div>
              )}

              {station.issues.length > 0 && (
                <div className="text-xs text-orange-600 mb-2">
                  ⚠ {station.issues[0]}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onViewEvidence(station)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Evidence ({station.evidenceCount})
                </button>
                {station.replayLink && (
                  <a href={station.replayLink} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Replay
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Queue Section
// ═════════════════════════════════════════════════════════════════════════════

interface QueueProps {
  queue: QueueDisplay
}

export function QueueSection({ queue }: QueueProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Queue Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Average Queue</p>
          <p className="text-3xl font-bold text-gray-900">{queue.averageQueue.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Peak Queue</p>
          <p className="text-3xl font-bold text-gray-900">{queue.peakQueue}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Longest Queue</p>
          <p className="text-xl font-bold text-gray-900">{queue.longestQueue.station}</p>
          <p className="text-sm text-gray-600">{queue.longestQueue.length} orders • {queue.longestQueue.time}</p>
        </div>
      </div>

      {queue.trend && (
        <div className="mt-4 text-sm text-gray-600">
          Trend: <span className={queue.trend.direction === 'improving' ? 'text-green-600' : 'text-red-600'}>
            {queue.trend.direction} ({queue.trend.change})
          </span>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Preparation Section
// ═════════════════════════════════════════════════════════════════════════════

interface PreparationProps {
  preparation: PreparationDisplay
}

export function PreparationSection({ preparation }: PreparationProps) {
  const Icon = preparation.trendIcon === 'TrendingUp' ? TrendingUp : 
               preparation.trendIcon === 'TrendingDown' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Preparation Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Average Preparation</p>
          <p className="text-2xl font-bold text-gray-900">{preparation.average}</p>
          <div className="flex items-center gap-1 mt-1">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 capitalize">{preparation.trend}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Fastest</p>
          <p className="text-lg font-bold text-green-600">{preparation.fastest.recipe}</p>
          <p className="text-sm text-gray-600">{preparation.fastest.time} • {preparation.fastest.station}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Slowest</p>
          <p className="text-lg font-bold text-orange-600">{preparation.slowest.recipe}</p>
          <p className="text-sm text-gray-600">{preparation.slowest.time} • {preparation.slowest.station}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Distribution</p>
        <div className="space-y-2">
          {preparation.distribution.map((dist, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20">{dist.range}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-12 text-right">{dist.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Bottlenecks Section
// ═════════════════════════════════════════════════════════════════════════════

interface BottlenecksProps {
  bottlenecks: BottleneckCard[]
  onViewEvidence: (item: any) => void
}

export function BottlenecksSection({ bottlenecks, onViewEvidence }: BottlenecksProps) {
  if (bottlenecks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Bottlenecks</h3>
        <p className="text-gray-500 text-center py-8">No bottlenecks detected - excellent performance!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Bottlenecks</h3>
      
      <div className="space-y-4">
        {bottlenecks.map((bottleneck) => (
          <div key={bottleneck.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{bottleneck.station}</h4>
                <p className="text-sm text-gray-600 mt-1">{bottleneck.impact}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${bottleneck.severityColor} bg-white border`}>
                {bottleneck.severity.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-2 font-medium text-gray-900">{bottleneck.duration}</span>
              </div>
              <div>
                <span className="text-gray-500">Frequency:</span>
                <span className="ml-2 font-medium text-gray-900">{bottleneck.frequency}</span>
              </div>
            </div>

            {bottleneck.rootCause && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Root cause:</span> {bottleneck.rootCause}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onViewEvidence(bottleneck)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Evidence ({bottleneck.evidenceCount})
              </button>
              {bottleneck.replayLink && (
                <a href={bottleneck.replayLink} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
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
// Recovery, Workload, Recipe, Ingredient, Trends, Peak Load Sections
// (Simplified for brevity - following same pattern)
// ═════════════════════════════════════════════════════════════════════════════

export function RecoverySection({ recovery }: { recovery: RecoveryDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Recovery Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Average Recovery</p>
          <p className="text-2xl font-bold text-gray-900">{recovery.averageTime}</p>
          <p className="text-sm text-gray-600 mt-1">Score: {recovery.score}/100</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Fastest</p>
          <p className="text-lg font-bold text-green-600">{recovery.fastest.time}</p>
          <p className="text-sm text-gray-600">{recovery.fastest.event}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Slowest</p>
          <p className="text-lg font-bold text-orange-600">{recovery.slowest.time}</p>
          <p className="text-sm text-gray-600">{recovery.slowest.event}</p>
        </div>
      </div>
    </div>
  )
}

export function WorkloadSection({ workload }: { workload: WorkloadDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Workload</h3>
      <p className={`text-sm mb-4 ${workload.balanced ? 'text-green-600' : 'text-orange-600'}`}>
        {workload.balanceMessage}
      </p>
      <div className="space-y-3">
        {workload.stations.map((station, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{station.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{station.orders} orders</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${station.statusColor.replace('text-', 'bg-')}`}
                  style={{ width: `${station.utilization}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-12 text-right">{station.utilization}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecipeSection({ recipe }: { recipe: RecipeDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Recipe Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Fastest Recipes</h4>
          <div className="space-y-2">
            {recipe.fastest.slice(0, 5).map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{r.name}</span>
                <span className="text-green-600 font-medium">{r.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Slowest Recipes</h4>
          <div className="space-y-2">
            {recipe.slowest.slice(0, 5).map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-900">{r.name}</span>
                <span className="text-orange-600 font-medium">{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function IngredientSection({ ingredient }: { ingredient: IngredientDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredient Consumption</h3>
      <div className="space-y-3">
        {ingredient.highest.map((ing, i) => (
          <div key={i} className="border-b border-gray-200 pb-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">{ing.name}</span>
              <span className="text-gray-600">{ing.quantity}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Used in: {ing.recipes.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendsSection({ trends }: { trends: TrendsDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Historical Kitchen Trends</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trends.improving.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-600 mb-2">Improving</h4>
            <div className="space-y-2">
              {trends.improving.map((t, i) => (
                <div key={i} className="text-sm">
                  <span className="text-gray-900">{t.metric}:</span>
                  <span className="ml-2 text-green-600 font-medium">{t.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {trends.declining.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-600 mb-2">Declining</h4>
            <div className="space-y-2">
              {trends.declining.map((t, i) => (
                <div key={i} className="text-sm">
                  <span className="text-gray-900">{t.metric}:</span>
                  <span className="ml-2 text-red-600 font-medium">{t.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PeakLoadSection({ peakLoad }: { peakLoad: PeakLoadDisplay }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Peak Load Analysis</h3>
      <div className="space-y-4">
        {peakLoad.rushPeriods.map((rush, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Rush Period</span>
              <span className="text-sm text-gray-600">{rush.time}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-2 font-medium">{rush.duration}</span>
              </div>
              <div>
                <span className="text-gray-500">Utilization:</span>
                <span className="ml-2 font-medium">{rush.utilization}%</span>
              </div>
              <div>
                <span className="text-gray-500">Orders:</span>
                <span className="ml-2 font-medium">{rush.orders}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Highlights Section
// ═════════════════════════════════════════════════════════════════════════════

interface HighlightsProps {
  highlights: HighlightCard[]
  onViewEvidence: (item: any) => void
}

export function HighlightsSection({ highlights, onViewEvidence }: HighlightsProps) {
  if (highlights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Highlights</h3>
        <p className="text-gray-500 text-center py-8">No highlights for this period</p>
      </div>
    )
  }

  const icons = { Zap, ChefHat, TrendingUp, Award, Star }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Highlights</h3>
      
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
                  {highlight.value && (
                    <p className="text-sm font-medium text-green-600 mt-2">{highlight.value}</p>
                  )}
                  {highlight.improvement && (
                    <p className="text-sm font-medium text-green-600 mt-1">{highlight.improvement} improvement</p>
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

// ═════════════════════════════════════════════════════════════════════════════
// Issues Section
// ═════════════════════════════════════════════════════════════════════════════

interface IssuesProps {
  issues: IssueCard[]
  onViewEvidence: (item: any) => void
}

export function IssuesSection({ issues, onViewEvidence }: IssuesProps) {
  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Issues</h3>
        <p className="text-gray-500 text-center py-8">No issues detected - excellent work!</p>
      </div>
    )
  }

  const icons = { Clock, AlertTriangle, AlertCircle, ChefHat, XCircle }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Kitchen Issues</h3>
      
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
  period: KitchenReportingPeriod
  onPeriodChange: (period: KitchenReportingPeriod) => void
  loading: boolean
}) {
  const periods = [
    { type: 'today' as const, label: 'Today' },
    { type: 'lunch' as const, label: 'Lunch' },
    { type: 'dinner' as const, label: 'Dinner' },
    { type: 'yesterday' as const, label: 'Yesterday' },
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
          placeholder="Search stations, recipes, issues..."
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
      const response = await fetch('/api/kitchen-intelligence/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, format }),
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kitchen-intelligence-${reportId}.${format}`
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
            <p className="text-sm text-gray-600 mt-1">{item.title || item.name}</p>
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
                <p className="text-xs text-gray-500 mt-1">Related to kitchen event</p>
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
        <p className="text-gray-600 mt-4">Generating kitchen intelligence report...</p>
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
