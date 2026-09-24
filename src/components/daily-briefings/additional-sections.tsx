/**
 * Daily Briefings™ - Additional Section Components
 * Includes: Historical, Trends, Staff, Kitchen, Menu, Replay Moments
 */

'use client'

import { History, Sparkles, TrendingUp, TrendingDown, Minus, Users, Utensils, BookOpen, Play, Zap, ShoppingCart, AlertTriangle, Rocket, CreditCard, Star } from 'lucide-react'
import type {
  HistoricalCard,
  TrendCard,
  StaffSummaryDisplay,
  KitchenSummaryDisplay,
  MenuSummaryDisplay,
  MomentCard,
} from '@/lib/daily-briefings/types'

// ═════════════════════════════════════════════════════════════════════════════
// Historical Changes
// ═════════════════════════════════════════════════════════════════════════════

interface HistoricalProps {
  historical: HistoricalCard[]
}

export function HistoricalChangesSection({ historical }: HistoricalProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Historical Changes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {historical.map((change) => {
          const Icon = change.hasHappenedBefore ? History : Sparkles
          
          return (
            <div key={change.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{change.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p>
                      <span className="font-medium">Frequency:</span> {change.frequency}
                    </p>
                    <p>
                      <span className="font-medium">Trend:</span> {change.trend}
                    </p>
                    {change.previousOccurrences > 0 && (
                      <p>
                        <span className="font-medium">Previous occurrences:</span> {change.previousOccurrences}
                      </p>
                    )}
                    {change.lastOccurrence && (
                      <p>
                        <span className="font-medium">Last seen:</span> {new Date(change.lastOccurrence).toLocaleDateString()}
                      </p>
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
// Performance Trends
// ═════════════════════════════════════════════════════════════════════════════

interface TrendsProps {
  trends: TrendCard[]
}

export function PerformanceTrendsSection({ trends }: TrendsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend, i) => {
          const Icon = trend.icon === 'TrendingUp' ? TrendingUp : trend.icon === 'TrendingDown' ? TrendingDown : Minus
          
          return (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{trend.metric}</p>
                <Icon className={`w-4 h-4 ${trend.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{trend.currentValue}</p>
              <p className={`text-sm font-medium mt-1 ${trend.color}`}>
                {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
              </p>
              {trend.historicalAverage && (
                <p className="text-xs text-gray-500 mt-2">
                  Avg: {trend.historicalAverage}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Staff Summary
// ═════════════════════════════════════════════════════════════════════════════

interface StaffProps {
  staff: StaffSummaryDisplay
  onViewEvidence: (item: any) => void
}

export function StaffSummarySection({ staff, onViewEvidence }: StaffProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Staff Summary</h3>
        <Users className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Top Improvements */}
        {staff.improvements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Improvements</h4>
            <div className="space-y-2">
              {staff.improvements.map((imp, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{imp.name}</span>
                  <span className="text-green-600 font-medium">{imp.improvement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workload Balance */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Workload Balance</h4>
          <p className={`text-sm ${staff.workload.balanced ? 'text-green-600' : 'text-yellow-600'}`}>
            {staff.workload.message}
          </p>
        </div>

        {/* Potential Overload */}
        {staff.overload.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Potential Overload</h4>
            <div className="space-y-2">
              {staff.overload.map((ol, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{ol.name}</span>
                  <span className="text-orange-600 font-medium">
                    {ol.orderCount} orders (+{ol.overloadPercent.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Kitchen Summary
// ═════════════════════════════════════════════════════════════════════════════

interface KitchenProps {
  kitchen: KitchenSummaryDisplay
  onViewEvidence: (item: any) => void
}

export function KitchenSummarySection({ kitchen, onViewEvidence }: KitchenProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Kitchen Summary</h3>
        <Utensils className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Station Performance */}
        {kitchen.stations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Station Performance</h4>
            <div className="space-y-2">
              {kitchen.stations.map((station, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{station.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{station.avgPrepTime}</span>
                    <span className={`font-medium ${
                      station.performance === 'excellent' ? 'text-green-600' :
                      station.performance === 'good' ? 'text-blue-600' :
                      station.performance === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {station.performance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Changes */}
        {kitchen.queues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Queue Changes</h4>
            <div className="space-y-2">
              {kitchen.queues.map((queue, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{queue.name}</span>
                  <span className={`font-medium ${
                    queue.change === 'decreased' ? 'text-green-600' :
                    queue.change === 'increased' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {queue.change} ({queue.changePercent > 0 ? '+' : ''}{queue.changePercent.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Status */}
        {kitchen.recovery && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recovery Status</h4>
            <p className={`text-sm ${kitchen.recovery.hasRecovered ? 'text-green-600' : 'text-yellow-600'}`}>
              {kitchen.recovery.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Menu Summary
// ═════════════════════════════════════════════════════════════════════════════

interface MenuProps {
  menu: MenuSummaryDisplay
  onViewEvidence: (item: any) => void
}

export function MenuSummarySection({ menu, onViewEvidence }: MenuProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Menu Summary</h3>
        <BookOpen className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Popular Dishes */}
        {menu.popular.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Popular Dishes</h4>
            <div className="space-y-2">
              {menu.popular.slice(0, 5).map((dish, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{dish.name}</span>
                  <span className="text-gray-600">{dish.orderCount} orders</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preparation Changes */}
        {menu.preparation.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Preparation Changes</h4>
            <div className="space-y-2">
              {menu.preparation.slice(0, 5).map((change, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">{change.name}</span>
                  <span className={`font-medium ${
                    change.change === 'faster' ? 'text-green-600' :
                    change.change === 'slower' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Replay Moments
// ═════════════════════════════════════════════════════════════════════════════

interface MomentsProps {
  moments: MomentCard[]
}

export function ReplayMomentsSection({ moments }: MomentsProps) {
  const icons = { Zap, ShoppingCart, AlertTriangle, Rocket, CreditCard, Star }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Moments Worth Watching</h3>
      
      {moments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No notable moments recorded</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moments.map((moment) => {
            const Icon = icons[moment.icon as keyof typeof icons] || Star
            
            return (
              <div key={moment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${moment.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{moment.title}</h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{moment.timeDisplay}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{moment.reason}</p>
                    <a
                      href={moment.replayLink}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-3"
                    >
                      <Play className="w-4 h-4" />
                      Watch Replay
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
