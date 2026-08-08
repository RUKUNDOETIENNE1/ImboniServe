import { useEffect } from 'react'
import { useRouter } from 'next/router'

export const PerformanceMonitor: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return

    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry: any = entries[entries.length - 1]
          console.log('[Performance] LCP:', lastEntry?.renderTime || lastEntry?.loadTime)
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            console.log('[Performance] FID:', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ type: 'first-input', buffered: true })

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              console.log('[Performance] CLS:', clsValue)
            }
          }
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        return () => {
          lcpObserver.disconnect()
          fidObserver.disconnect()
          clsObserver.disconnect()
        }
      } catch (e) {
        console.error('Performance monitoring error:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Track route changes
    const handleRouteChange = (url: string) => {
      if (process.env.NODE_ENV === 'production') {
        console.log('[Performance] Route changed to:', url)
        // Send to analytics
        // window.gtag?.('event', 'page_view', { page_path: url })
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return null
}

// Hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        console.log(`[Render Time] ${componentName}: ${(endTime - startTime).toFixed(2)}ms`)
      }
    }
  }, [componentName])
}
