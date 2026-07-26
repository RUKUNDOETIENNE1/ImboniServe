/**
 * Service Replay™ - Main Dashboard Page
 * 
 * "Watching hospitality operations like replaying a football match."
 * 
 * Allows managers to replay any service period and understand exactly what happened.
 */

import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { useServiceReplay } from '@/hooks/useServiceReplay'
import { useTranslation } from '@/lib/i18n'
import {
  Play, Pause, RotateCcw, SkipBack, SkipForward,
  Search, Filter, X, ChevronRight, Clock, Calendar,
  ShoppingCart, Users, ChefHat, CreditCard, CalendarCheck,
  AlertTriangle, CheckCircle, XCircle, Loader2, Info,
  Zap, FastForward, Rewind
} from 'lucide-react'
import type {
  ReplayEvent,
  ReplayStatistics,
  PlaybackSpeed,
  PresetTimeRange,
  ReplayEventCategory,
} from '@/lib/service-replay/types'
import {
  EVENT_CATEGORY_COLORS,
  EVENT_TYPE_METADATA,
  formatEventDescription,
} from '@/lib/service-replay/types'
import {
  TIME_RANGE_PRESETS,
  formatReplayTime,
  formatDuration,
} from '@/lib/service-replay/time-utils'

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR'])

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  
  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  
  const roles: string[] = (session.user as any).roles || []
  if (!roles.some(r => ALLOWED_ROLES.has(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  
  return {
    props: {
      businessId: (session.user as any).businessId || '',
      timezone: (session.user as any).timezone || 'Africa/Kigali',
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceReplayPageProps {
  businessId: string
  timezone: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ServiceReplayPage({ businessId, timezone }: ServiceReplayPageProps) {
  const { t } = useTranslation()
  const [selectedPreset, setSelectedPreset] = useState<PresetTimeRange | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showEventDetail, setShowEventDetail] = useState(false)
  
  const {
    session,
    statistics,
    isLoading,
    error,
    play,
    pause,
    restart,
    setSpeed,
    seekToProgress,
    seekToEvent,
    jumpToStart,
    jumpToEnd,
    setTimeRange,
    setPreset,
    filters,
    setFilters,
    clearFilters,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedEvent,
    selectEvent,
    fetchEvents,
    progress,
    currentTime,
  } = useServiceReplay({ timezone })
  
  const playbackState = session?.playbackState || 'idle'
  const playbackSpeed = session?.playbackSpeed || 1
  const events = session?.events || []
  const currentEventIndex = session?.currentEventIndex || 0
  
  // Handle preset selection
  const handlePresetSelect = (preset: PresetTimeRange) => {
    setSelectedPreset(preset)
    setPreset(preset)
  }
  
  // Handle custom time range
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  
  const handleCustomRange = () => {
    if (customStart && customEnd) {
      setSelectedPreset('custom')
      setTimeRange(new Date(customStart).toISOString(), new Date(customEnd).toISOString())
    }
  }
  
  // Handle event click
  const handleEventClick = (event: ReplayEvent, index: number) => {
    selectEvent(event)
    seekToEvent(index)
    setShowEventDetail(true)
  }
  
  // Speed options
  const speedOptions: PlaybackSpeed[] = [1, 2, 4, 8]
  
  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (playbackState === 'playing') {
            pause()
          } else {
            play()
          }
          break
        case 'r':
        case 'R':
          restart()
          break
        case 'Home':
          jumpToStart()
          break
        case 'End':
          jumpToEnd()
          break
        case '1':
          setSpeed(1)
          break
        case '2':
          setSpeed(2)
          break
        case '4':
          setSpeed(4)
          break
        case '8':
          setSpeed(8)
          break
        case 'Escape':
          setShowEventDetail(false)
          setShowFilters(false)
          selectEvent(null)
          break
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const searchInput = document.querySelector('input[placeholder="Search events..."]') as HTMLInputElement
            searchInput?.focus()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playbackState, play, pause, restart, jumpToStart, jumpToEnd, setSpeed, selectEvent])
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Play className="w-6 h-6 text-imboni-blue" />
                Service Replay™
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Replay hospitality operations like watching a football match
              </p>
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-imboni-blue focus:border-transparent"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || Object.keys(filters).length > 0
                    ? 'bg-imboni-blue text-white border-imboni-blue'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <span className="bg-white text-imboni-blue text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {Object.keys(filters).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        
        <div className="flex">
          {/* Main Content */}
          <main className={`flex-1 p-6 transition-all ${showEventDetail ? 'mr-96' : ''}`}>
            {/* Time Range Selection */}
            {!session && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-imboni-blue" />
                  Select Service Period
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {TIME_RANGE_PRESETS.filter(p => p.key !== 'custom').map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => handlePresetSelect(preset.key)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedPreset === preset.key
                          ? 'border-imboni-blue bg-blue-50 dark:bg-blue-900/20 text-imboni-blue'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="font-medium">{preset.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Custom Range */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Range</h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="datetime-local"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleCustomRange}
                      disabled={!customStart || !customEnd}
                      className="px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                
                {/* Load Button */}
                {selectedPreset && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={fetchEvents}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-8 py-3 bg-imboni-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading Events...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Load Replay
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}
            
            {/* Replay Interface */}
            {session && (
              <>
                {/* Statistics Bar */}
                <StatisticsBar statistics={statistics} timezone={timezone} />
                
                {/* Playback Controls */}
                <PlaybackControls
                  playbackState={playbackState}
                  playbackSpeed={playbackSpeed}
                  progress={progress}
                  currentTime={currentTime}
                  startTime={session.startTime}
                  endTime={session.endTime}
                  totalEvents={session.totalEvents}
                  currentEventIndex={currentEventIndex}
                  timezone={timezone}
                  onPlay={play}
                  onPause={pause}
                  onRestart={restart}
                  onSpeedChange={setSpeed}
                  onSeek={seekToProgress}
                  onJumpToStart={jumpToStart}
                  onJumpToEnd={jumpToEnd}
                />
                
                {/* Timeline */}
                <Timeline
                  events={searchQuery ? searchResults : events}
                  currentEventIndex={searchQuery ? -1 : currentEventIndex}
                  selectedEvent={selectedEvent}
                  onEventClick={handleEventClick}
                  timezone={timezone}
                  isSearchResults={!!searchQuery}
                />
                
                {/* Empty State */}
                {events.length === 0 && !isLoading && (
                  <EmptyState
                    title="No Events Found"
                    description="No operational events were recorded during this time period."
                    icon={<Info className="w-12 h-12 text-gray-400" />}
                  />
                )}
              </>
            )}
          </main>
          
          {/* Event Detail Panel */}
          {showEventDetail && selectedEvent && (
            <EventDetailPanel
              event={selectedEvent}
              onClose={() => {
                setShowEventDetail(false)
                selectEvent(null)
              }}
              timezone={timezone}
            />
          )}
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClear={clearFilters}
            onClose={() => setShowFilters(false)}
            startTime={session?.startTime || ''}
            endTime={session?.endTime || ''}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Bar Component
// ─────────────────────────────────────────────────────────────────────────────

interface StatisticsBarProps {
  statistics: ReplayStatistics | null
  timezone: string
}

function StatisticsBar({ statistics, timezone }: StatisticsBarProps) {
  if (!statistics) return null
  
  const stats = [
    { label: 'Active Orders', value: statistics.ordersActive, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Tables Occupied', value: statistics.tablesOccupied, icon: Users, color: 'text-purple-600' },
    { label: 'Kitchen Queue', value: statistics.kitchenQueue, icon: ChefHat, color: 'text-orange-600' },
    { label: 'Completed', value: statistics.ordersCompleted, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Canceled', value: statistics.ordersCanceled, icon: XCircle, color: 'text-red-600' },
    { label: 'Payments', value: statistics.paymentsCompleted, icon: CreditCard, color: 'text-emerald-600' },
    { label: 'Reservations', value: statistics.reservationsActive, icon: CalendarCheck, color: 'text-violet-600' },
  ]
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Replay Time: {formatReplayTime(statistics.replayTime, timezone, { includeSeconds: true })}
          </span>
        </div>
        {statistics.currentEvent && (
          <span className="text-xs bg-imboni-blue/10 text-imboni-blue px-2 py-1 rounded-full">
            {EVENT_TYPE_METADATA[statistics.currentEvent.eventType]?.label || statistics.currentEvent.eventType}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-7 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`flex items-center justify-center mb-1 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playback Controls Component
// ─────────────────────────────────────────────────────────────────────────────

interface PlaybackControlsProps {
  playbackState: string
  playbackSpeed: PlaybackSpeed
  progress: number
  currentTime: string
  startTime: string
  endTime: string
  totalEvents: number
  currentEventIndex: number
  timezone: string
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
  onSeek: (progress: number) => void
  onJumpToStart: () => void
  onJumpToEnd: () => void
}

function PlaybackControls({
  playbackState,
  playbackSpeed,
  progress,
  currentTime,
  startTime,
  endTime,
  totalEvents,
  currentEventIndex,
  timezone,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
  onSeek,
  onJumpToStart,
  onJumpToEnd,
}: PlaybackControlsProps) {
  const speedOptions: PlaybackSpeed[] = [1, 2, 4, 8]
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value))
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Timeline Scrubber */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{formatReplayTime(startTime, timezone)}</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatReplayTime(currentTime, timezone, { includeSeconds: true })}
          </span>
          <span>{formatReplayTime(endTime, timezone)}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-imboni-blue"
          />
          <div
            className="absolute top-0 left-0 h-2 bg-imboni-blue rounded-lg pointer-events-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>Event {currentEventIndex + 1} of {totalEvents}</span>
          <span>Duration: {formatDuration(startTime, endTime)}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Jump to Start */}
        <button
          onClick={onJumpToStart}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to Start"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        {/* Restart */}
        <button
          onClick={onRestart}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        {/* Play/Pause */}
        <button
          onClick={playbackState === 'playing' ? onPause : onPlay}
          className="p-4 bg-imboni-blue text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
          title={playbackState === 'playing' ? 'Pause' : 'Play'}
        >
          {playbackState === 'playing' ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
        
        {/* Jump to End */}
        <button
          onClick={onJumpToEnd}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Jump to End"
        >
          <SkipForward className="w-5 h-5" />
        </button>
        
        {/* Speed Control */}
        <div className="flex items-center gap-1 ml-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                playbackSpeed === speed
                  ? 'bg-white dark:bg-gray-600 text-imboni-blue shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
      
      {/* Playback State Indicator */}
      {playbackState === 'completed' && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Replay Complete
          </span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Component
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineProps {
  events: ReplayEvent[]
  currentEventIndex: number
  selectedEvent: ReplayEvent | null
  onEventClick: (event: ReplayEvent, index: number) => void
  timezone: string
  isSearchResults?: boolean
}

function Timeline({
  events,
  currentEventIndex,
  selectedEvent,
  onEventClick,
  timezone,
  isSearchResults = false,
}: TimelineProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {isSearchResults ? 'Search Results' : 'Event Timeline'}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {events.length} events
        </span>
      </div>
      
      <div className="max-h-[500px] overflow-y-auto">
        {events.map((event, index) => {
          const isCurrent = !isSearchResults && index === currentEventIndex
          const isSelected = selectedEvent?.id === event.id
          const colors = EVENT_CATEGORY_COLORS[event.category]
          const metadata = EVENT_TYPE_METADATA[event.eventType]
          
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event, index)}
              className={`flex items-start gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-imboni-blue/10 border-l-4 border-l-imboni-blue'
                  : isSelected
                  ? 'bg-gray-50 dark:bg-gray-700/50'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
            >
              {/* Timeline Marker */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-imboni-blue animate-pulse' : colors.bg} ${colors.border} border-2`} />
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full min-h-[40px] bg-gray-200 dark:bg-gray-600 mt-1" />
                )}
              </div>
              
              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                    {metadata?.label || event.eventType}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatReplayTime(event.timestamp, timezone, { includeSeconds: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {event.description}
                </p>
                
                {/* Entity Tags */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {event.orderNumber && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                      #{event.orderNumber}
                    </span>
                  )}
                  {event.tableNumber && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded">
                      Table {event.tableNumber}
                    </span>
                  )}
                  {event.stationName && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded">
                      {event.stationName}
                    </span>
                  )}
                  {event.actorName && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      by {event.actorName}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Detail Panel Component
// ─────────────────────────────────────────────────────────────────────────────

interface EventDetailPanelProps {
  event: ReplayEvent
  onClose: () => void
  timezone: string
}

function EventDetailPanel({ event, onClose, timezone }: EventDetailPanelProps) {
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/service-replay/event/${event.id}`)
        if (response.ok) {
          const data = await response.json()
          setEventDetail(data)
        }
      } catch (err) {
        console.error('Failed to fetch event detail:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDetail()
  }, [event.id])
  
  const colors = EVENT_CATEGORY_COLORS[event.category]
  const metadata = EVENT_TYPE_METADATA[event.eventType]
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Event Details</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Event Type */}
        <div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
            {metadata?.label || event.eventType}
          </span>
        </div>
        
        {/* Timestamp */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Timestamp
          </label>
          <p className="text-sm text-gray-900 dark:text-white mt-1">
            {formatReplayTime(event.timestamp, timezone, { includeDate: true, includeSeconds: true })}
          </p>
        </div>
        
        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Description
          </label>
          <p className="text-sm text-gray-900 dark:text-white mt-1">
            {event.description}
          </p>
        </div>
        
        {/* State Transition */}
        {(event.previousState || event.newState) && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              State Transition
            </label>
            <div className="flex items-center gap-2 mt-1">
              {event.previousState && (
                <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                  {event.previousState}
                </span>
              )}
              {event.previousState && event.newState && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              {event.newState && (
                <span className="text-sm bg-imboni-blue/10 text-imboni-blue px-2 py-1 rounded">
                  {event.newState}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Related Entities */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Related Entities
          </label>
          <div className="mt-2 space-y-2">
            {event.orderNumber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Order</span>
                <span className="text-gray-900 dark:text-white font-medium">#{event.orderNumber}</span>
              </div>
            )}
            {event.tableNumber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Table</span>
                <span className="text-gray-900 dark:text-white font-medium">{event.tableNumber}</span>
              </div>
            )}
            {event.stationName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Station</span>
                <span className="text-gray-900 dark:text-white font-medium">{event.stationName}</span>
              </div>
            )}
            {event.waiterName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Waiter</span>
                <span className="text-gray-900 dark:text-white font-medium">{event.waiterName}</span>
              </div>
            )}
            {event.customerName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Customer</span>
                <span className="text-gray-900 dark:text-white font-medium">{event.customerName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actor */}
        {event.actorName && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Actor
            </label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-900 dark:text-white">{event.actorName}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                {event.actorSource}
              </span>
            </div>
          </div>
        )}
        
        {/* Correlation ID */}
        {event.correlationId && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Correlation ID
            </label>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 break-all">
              {event.correlationId}
            </p>
          </div>
        )}
        
        {/* Order Details */}
        {eventDetail?.orderDetails && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Order Details
            </label>
            <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-gray-900 dark:text-white">{eventDetail.orderDetails.kitchenStatus || eventDetail.orderDetails.status}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Payment</span>
                <span className="text-gray-900 dark:text-white">{eventDetail.orderDetails.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {(eventDetail.orderDetails.totalAmountCents / 100).toLocaleString()} RWF
                </span>
              </div>
              {eventDetail.orderDetails.items?.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Items:</span>
                  <ul className="mt-1 space-y-1">
                    {eventDetail.orderDetails.items.map((item: any) => (
                      <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">
                        {item.quantity}× {item.name}
                        {item.status && (
                          <span className="ml-2 text-xs text-gray-500">({item.status})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Related Events */}
        {eventDetail?.relatedEvents?.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Related Events ({eventDetail.relatedEvents.length})
            </label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {eventDetail.relatedEvents.map((relatedEvent: ReplayEvent) => {
                const relatedColors = EVENT_CATEGORY_COLORS[relatedEvent.category]
                return (
                  <div
                    key={relatedEvent.id}
                    className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded ${relatedColors.bg} ${relatedColors.text}`}>
                        {EVENT_TYPE_METADATA[relatedEvent.eventType]?.label || relatedEvent.eventType}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatReplayTime(relatedEvent.timestamp, timezone, { includeSeconds: true })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Raw Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Metadata
            </label>
            <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-400">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters Panel Component
// ─────────────────────────────────────────────────────────────────────────────

interface FiltersPanelProps {
  filters: any
  onFiltersChange: (filters: any) => void
  onClear: () => void
  onClose: () => void
  startTime: string
  endTime: string
}

function FiltersPanel({ filters, onFiltersChange, onClear, onClose, startTime, endTime }: FiltersPanelProps) {
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchFilters = async () => {
      if (!startTime || !endTime) return
      
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ startTime, endTime })
        const response = await fetch(`/api/service-replay/filters?${params}`)
        if (response.ok) {
          const data = await response.json()
          setFilterOptions(data)
        }
      } catch (err) {
        console.error('Failed to fetch filters:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFilters()
  }, [startTime, endTime])
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-80 h-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filterOptions ? (
          <div className="p-4 space-y-6">
            {/* Orders */}
            {filterOptions.orders?.length > 0 && (
              <FilterSection
                title="Orders"
                options={filterOptions.orders}
                selectedId={filters.orderId}
                onSelect={(id) => onFiltersChange({ ...filters, orderId: id === filters.orderId ? undefined : id })}
              />
            )}
            
            {/* Tables */}
            {filterOptions.tables?.length > 0 && (
              <FilterSection
                title="Tables"
                options={filterOptions.tables}
                selectedId={filters.tableId}
                onSelect={(id) => onFiltersChange({ ...filters, tableId: id === filters.tableId ? undefined : id })}
              />
            )}
            
            {/* Stations */}
            {filterOptions.stations?.length > 0 && (
              <FilterSection
                title="Stations"
                options={filterOptions.stations}
                selectedId={filters.stationId}
                onSelect={(id) => onFiltersChange({ ...filters, stationId: id === filters.stationId ? undefined : id })}
              />
            )}
            
            {/* Waiters */}
            {filterOptions.waiters?.length > 0 && (
              <FilterSection
                title="Staff"
                options={filterOptions.waiters}
                selectedId={filters.waiterId}
                onSelect={(id) => onFiltersChange({ ...filters, waiterId: id === filters.waiterId ? undefined : id })}
              />
            )}
            
            {/* Event Types */}
            {filterOptions.eventTypes?.length > 0 && (
              <FilterSection
                title="Event Types"
                options={filterOptions.eventTypes}
                selectedId={filters.eventTypes?.[0]}
                onSelect={(id) => onFiltersChange({ ...filters, eventTypes: id === filters.eventTypes?.[0] ? undefined : [id] })}
              />
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Select a time range to see filter options
          </div>
        )}
      </div>
    </div>
  )
}

interface FilterSectionProps {
  title: string
  options: Array<{ id: string; label: string; count?: number }>
  selectedId?: string
  onSelect: (id: string) => void
}

function FilterSection({ title, options, selectedId, onSelect }: FilterSectionProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {title}
      </h4>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedId === option.id
                ? 'bg-imboni-blue text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className={`text-xs ${selectedId === option.id ? 'text-white/70' : 'text-gray-400'}`}>
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string
  description: string
  icon: React.ReactNode
}

function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
}
