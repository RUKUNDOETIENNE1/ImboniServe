/**
 * PWA Telemetry - Track install, offline, and sync events
 */

interface TelemetryEvent {
  event: string
  timestamp: number
  data?: Record<string, any>
}

class PWATelemetry {
  private events: TelemetryEvent[] = []
  private maxEvents = 100

  track(event: string, data?: Record<string, any>) {
    const telemetryEvent: TelemetryEvent = {
      event,
      timestamp: Date.now(),
      data,
    }

    this.events.push(telemetryEvent)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA Telemetry]', event, data)
    }

    // Send to analytics endpoint if available
    this.sendToAnalytics(telemetryEvent)
  }

  private async sendToAnalytics(event: TelemetryEvent) {
    try {
      if (typeof window === 'undefined') return
      const { hasConsent, ensureGlobalConsentCached } = await import('@/lib/consent')
      ensureGlobalConsentCached()
      if (!hasConsent('analytics')) return

      // Send to your analytics endpoint
      await fetch('/api/analytics/pwa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      })
    } catch {
      // Ignore errors
    }
  }

  getEvents() {
    return [...this.events]
  }

  clear() {
    this.events = []
  }
}

export const pwaTelemetry = new PWATelemetry()

// Track install events
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    pwaTelemetry.track('pwa_install_prompt_shown')
  })

  window.addEventListener('appinstalled', () => {
    pwaTelemetry.track('pwa_installed')
  })

  // Track offline/online
  window.addEventListener('offline', () => {
    pwaTelemetry.track('app_offline')
  })

  window.addEventListener('online', () => {
    pwaTelemetry.track('app_online')
  })

  // Track standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    pwaTelemetry.track('app_launched_standalone')
  }
}
