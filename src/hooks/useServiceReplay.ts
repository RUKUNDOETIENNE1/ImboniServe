/**
 * Service Replay™ - React Hook
 * 
 * Manages replay state, playback controls, and event fetching.
 * Provides a complete interface for the Service Replay UI.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  ReplayEvent,
  ReplaySession,
  ReplayStatistics,
  ReplayFilters,
  PlaybackSpeed,
  PlaybackState,
  PresetTimeRange,
} from '@/lib/service-replay/types'
import {
  getTimeRangeForPreset,
  calculateProgress,
  calculateTimeAtProgress,
  findEventIndexAtTime,
  calculateNextEventDelay,
} from '@/lib/service-replay/time-utils'
import { StatisticsTracker } from '@/lib/service-replay/statistics'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseServiceReplayOptions {
  timezone?: string
  autoFetch?: boolean
}

interface UseServiceReplayReturn {
  // Session state
  session: ReplaySession | null
  statistics: ReplayStatistics | null
  isLoading: boolean
  error: string | null
  
  // Playback controls
  play: () => void
  pause: () => void
  restart: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  seekToProgress: (progress: number) => void
  seekToEvent: (eventIndex: number) => void
  jumpToStart: () => void
  jumpToEnd: () => void
  
  // Time range
  setTimeRange: (start: string, end: string) => void
  setPreset: (preset: PresetTimeRange) => void
  
  // Filters
  filters: ReplayFilters
  setFilters: (filters: ReplayFilters) => void
  clearFilters: () => void
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: ReplayEvent[]
  isSearching: boolean
  
  // Event selection
  selectedEvent: ReplayEvent | null
  selectEvent: (event: ReplayEvent | null) => void
  
  // Data fetching
  fetchEvents: () => Promise<void>
  fetchMoreEvents: () => Promise<void>
  
  // Progress
  progress: number
  currentTime: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────────────────────

export function useServiceReplay(options: UseServiceReplayOptions = {}): UseServiceReplayReturn {
  const { timezone = 'Africa/Kigali', autoFetch = false } = options
  
  // Session state
  const [session, setSession] = useState<ReplaySession | null>(null)
  const [statistics, setStatistics] = useState<ReplayStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  
  // Time range
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  
  // Filters
  const [filters, setFilters] = useState<ReplayFilters>({})
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ReplayEvent[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Selected event
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null)
  
  // Refs for playback
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null)
  const statisticsTrackerRef = useRef<StatisticsTracker>(new StatisticsTracker())
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────────
  
  const fetchEvents = useCallback(async () => {
    if (!startTime || !endTime) {
      setError('Please select a time range')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startTime,
        endTime,
        limit: '500',
      })
      
      // Add filters to params
      if (filters.orderId) params.append('orderId', filters.orderId)
      if (filters.tableId) params.append('tableId', filters.tableId)
      if (filters.stationId) params.append('stationId', filters.stationId)
      if (filters.waiterId) params.append('waiterId', filters.waiterId)
      if (filters.eventTypes?.length) params.append('eventTypes', filters.eventTypes.join(','))
      if (filters.categories?.length) params.append('categories', filters.categories.join(','))
      
      const response = await fetch(`/api/service-replay/events?${params}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch events')
      }
      
      const data = await response.json()
      
      // Initialize session
      const newSession: ReplaySession = {
        startTime,
        endTime,
        playbackState: 'idle',
        playbackSpeed: 1,
        currentTime: startTime,
        currentEventIndex: 0,
        events: data.events,
        totalEvents: data.totalCount,
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
      }
      
      setSession(newSession)
      setStatistics(data.statistics)
      setCurrentEventIndex(0)
      setPlaybackState('idle')
      
      // Initialize statistics tracker
      statisticsTrackerRef.current.reset()
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch replay events')
    } finally {
      setIsLoading(false)
    }
  }, [startTime, endTime, filters])
  
  const fetchMoreEvents = useCallback(async () => {
    if (!session?.hasMore || !session.nextCursor || isLoading) return
    
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        startTime: session.startTime,
        endTime: session.endTime,
        cursor: session.nextCursor,
        limit: '500',
      })
      
      const response = await fetch(`/api/service-replay/events?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch more events')
      }
      
      const data = await response.json()
      
      setSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          events: [...prev.events, ...data.events],
          hasMore: data.hasMore,
          nextCursor: data.nextCursor,
        }
      })
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [session, isLoading])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────────────────────────
  
  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
  }, [])
  
  const advancePlayback = useCallback(() => {
    if (!session || playbackState !== 'playing') return
    
    const nextIndex = currentEventIndex + 1
    
    if (nextIndex >= session.events.length) {
      // Check if we need to fetch more events
      if (session.hasMore) {
        fetchMoreEvents()
      } else {
        // Replay complete
        setPlaybackState('completed')
        stopPlayback()
      }
      return
    }
    
    // Update current event
    setCurrentEventIndex(nextIndex)
    
    // Update statistics
    const newStats = statisticsTrackerRef.current.applyEvent(session.events[nextIndex])
    setStatistics(newStats)
    
    // Calculate delay to next event
    const currentEvent = session.events[nextIndex]
    const nextEvent = session.events[nextIndex + 1]
    
    if (nextEvent) {
      const delay = calculateNextEventDelay(
        currentEvent.timestamp,
        nextEvent.timestamp,
        playbackSpeed
      )
      
      playbackTimerRef.current = setTimeout(advancePlayback, delay)
    } else if (session.hasMore) {
      // Fetch more events
      fetchMoreEvents()
    } else {
      // Replay complete
      setPlaybackState('completed')
    }
  }, [session, playbackState, currentEventIndex, playbackSpeed, fetchMoreEvents, stopPlayback])
  
  const play = useCallback(() => {
    if (!session || session.events.length === 0) return
    
    if (playbackState === 'completed') {
      // Restart from beginning
      setCurrentEventIndex(0)
      statisticsTrackerRef.current.reset()
    }
    
    setPlaybackState('playing')
  }, [session, playbackState])
  
  const pause = useCallback(() => {
    setPlaybackState('paused')
    stopPlayback()
  }, [stopPlayback])
  
  const restart = useCallback(() => {
    stopPlayback()
    setCurrentEventIndex(0)
    statisticsTrackerRef.current.reset()
    setPlaybackState('idle')
    
    if (session?.events[0]) {
      setStatistics(statisticsTrackerRef.current.applyEvent(session.events[0]))
    }
  }, [session, stopPlayback])
  
  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed)
  }, [])
  
  const seekToProgress = useCallback((progress: number) => {
    if (!session) return
    
    const targetTime = calculateTimeAtProgress(progress, session.startTime, session.endTime)
    const targetIndex = findEventIndexAtTime(session.events, targetTime)
    
    if (targetIndex >= 0) {
      setCurrentEventIndex(targetIndex)
      
      // Recalculate statistics up to this point
      const stats = statisticsTrackerRef.current.initializeFromEvents(
        session.events.slice(0, targetIndex + 1)
      )
      setStatistics(stats)
    }
  }, [session])
  
  const seekToEvent = useCallback((eventIndex: number) => {
    if (!session || eventIndex < 0 || eventIndex >= session.events.length) return
    
    setCurrentEventIndex(eventIndex)
    
    // Recalculate statistics up to this point
    const stats = statisticsTrackerRef.current.initializeFromEvents(
      session.events.slice(0, eventIndex + 1)
    )
    setStatistics(stats)
  }, [session])
  
  const jumpToStart = useCallback(() => {
    seekToEvent(0)
  }, [seekToEvent])
  
  const jumpToEnd = useCallback(() => {
    if (!session) return
    seekToEvent(session.events.length - 1)
  }, [session, seekToEvent])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Time Range
  // ─────────────────────────────────────────────────────────────────────────────
  
  const setTimeRange = useCallback((start: string, end: string) => {
    setStartTime(start)
    setEndTime(end)
    setSession(null)
    setPlaybackState('idle')
    setCurrentEventIndex(0)
  }, [])
  
  const setPreset = useCallback((preset: PresetTimeRange) => {
    const range = getTimeRangeForPreset(preset, timezone)
    setTimeRange(range.start, range.end)
  }, [timezone, setTimeRange])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────────────────────────────────────
  
  const updateFilters = useCallback((newFilters: ReplayFilters) => {
    setFilters(newFilters)
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!searchQuery || !startTime || !endTime) {
      setSearchResults([])
      return
    }
    
    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          startTime,
          endTime,
          limit: '50',
        })
        
        const response = await fetch(`/api/service-replay/search?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.events)
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300) // Debounce
    
    return () => clearTimeout(searchTimeout)
  }, [searchQuery, startTime, endTime])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Playback Effect
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (playbackState === 'playing') {
      advancePlayback()
    }
    
    return () => {
      stopPlayback()
    }
  }, [playbackState, advancePlayback, stopPlayback])
  
  // Auto-fetch on time range change
  useEffect(() => {
    if (autoFetch && startTime && endTime) {
      fetchEvents()
    }
  }, [autoFetch, startTime, endTime, fetchEvents])
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────────
  
  const currentEvent = session?.events[currentEventIndex]
  const currentTime = currentEvent?.timestamp || startTime
  const progress = session
    ? calculateProgress(currentTime, session.startTime, session.endTime)
    : 0
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────────
  
  return {
    // Session state
    session,
    statistics,
    isLoading,
    error,
    
    // Playback controls
    play,
    pause,
    restart,
    setSpeed,
    seekToProgress,
    seekToEvent,
    jumpToStart,
    jumpToEnd,
    
    // Time range
    setTimeRange,
    setPreset,
    
    // Filters
    filters,
    setFilters: updateFilters,
    clearFilters,
    
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    
    // Event selection
    selectedEvent,
    selectEvent: setSelectedEvent,
    
    // Data fetching
    fetchEvents,
    fetchMoreEvents,
    
    // Progress
    progress,
    currentTime,
  }
}

export default useServiceReplay
