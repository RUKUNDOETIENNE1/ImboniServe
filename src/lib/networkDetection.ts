/**
 * Network Quality Detection
 * Detects connection quality for lite mode switching
 */

export type NetworkQuality = 'offline' | 'slow' | 'good' | 'excellent'

export interface NetworkInfo {
  quality: NetworkQuality
  effectiveType?: string
  downlink?: number // Mbps
  rtt?: number // Round trip time in ms
  saveData?: boolean
}

/**
 * Detect current network quality
 */
export function detectNetworkQuality(): NetworkQuality {
  if (typeof navigator === 'undefined') return 'good'
  if (!navigator.onLine) return 'offline'
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (!connection) return 'good' // Assume good if API not available
  
  const effectiveType = connection.effectiveType
  const downlink = connection.downlink || 0 // Mbps
  const rtt = connection.rtt || 0 // ms
  
  // Offline
  if (!navigator.onLine) return 'offline'
  
  // Slow connections
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow'
  if (effectiveType === '3g' && downlink < 1) return 'slow'
  if (rtt > 500) return 'slow' // High latency
  
  // Excellent connections
  if (effectiveType === '4g' && downlink > 10) return 'excellent'
  if (downlink > 15) return 'excellent'
  
  // Default to good
  return 'good'
}

/**
 * Get detailed network information
 */
export function getNetworkInfo(): NetworkInfo {
  const quality = detectNetworkQuality()
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) {
    return { quality }
  }
  
  return {
    quality,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  }
}

/**
 * Check if connection is suitable for heavy operations (images, videos)
 */
export function canLoadHeavyContent(): boolean {
  const quality = detectNetworkQuality()
  return quality === 'good' || quality === 'excellent'
}

/**
 * Check if lite mode should be enabled
 */
export function shouldUseLiteMode(): boolean {
  const quality = detectNetworkQuality()
  const connection = (navigator as any).connection
  
  // Enable lite mode for slow connections
  if (quality === 'offline' || quality === 'slow') return true
  
  // Enable lite mode if user has data saver on
  if (connection?.saveData) return true
  
  return false
}

/**
 * React hook for network quality monitoring
 */
export function useNetworkQuality(callback?: (quality: NetworkQuality) => void) {
  if (typeof window === 'undefined') return 'good' as NetworkQuality
  
  const [quality, setQuality] = React.useState<NetworkQuality>(detectNetworkQuality())
  
  React.useEffect(() => {
    const updateQuality = () => {
      const newQuality = detectNetworkQuality()
      setQuality(newQuality)
      callback?.(newQuality)
    }
    
    // Listen for online/offline events
    window.addEventListener('online', updateQuality)
    window.addEventListener('offline', updateQuality)
    
    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateQuality)
    }
    
    // Poll periodically as fallback (every 30 seconds)
    const interval = setInterval(updateQuality, 30000)
    
    return () => {
      window.removeEventListener('online', updateQuality)
      window.removeEventListener('offline', updateQuality)
      if (connection) {
        connection.removeEventListener('change', updateQuality)
      }
      clearInterval(interval)
    }
  }, [callback])
  
  return quality
}

// For non-React usage
import * as React from 'react'
