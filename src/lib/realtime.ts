import { useEffect, useRef, useState } from 'react'

type RealtimeCallback = (data: any) => void

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'
const usePusher = Boolean(PUSHER_KEY)

class RealtimeService {
  private pusherClient: any = null
  private subscribers: Map<string, Set<RealtimeCallback>> = new Map()
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private pusherChannels: Map<string, any> = new Map()

  private async getPusherClient() {
    if (this.pusherClient) return this.pusherClient
    if (typeof window === 'undefined') return null
    if (!usePusher) return null
    const PusherJs = (await import('pusher-js')).default
    this.pusherClient = new PusherJs(PUSHER_KEY!, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: '/api/realtime/auth',
    })
    return this.pusherClient
  }

  async subscribe(channel: string, event: string, callback: RealtimeCallback) {
    const key = `${channel}:${event}`
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set())
    this.subscribers.get(key)!.add(callback)

    if (usePusher) {
      const pusher = await this.getPusherClient()
      if (pusher && !this.pusherChannels.has(channel)) {
        const ch = pusher.subscribe(channel)
        // If subscription fails (e.g., auth 404/503), fall back to polling
        ch.bind('pusher:subscription_error', () => {
          this.startPolling(channel)
        })
        this.pusherChannels.set(channel, ch)
      }
      const ch = this.pusherChannels.get(channel)
      if (ch) {
        ch.bind(event, callback)
      } else {
        // Could not create channel; start polling
        this.startPolling(channel)
      }
    } else {
      if (!this.pollingIntervals.has(channel)) this.startPolling(channel)
    }

    return () => {
      this.subscribers.get(key)?.delete(callback)
      if (usePusher) {
        const ch = this.pusherChannels.get(channel)
        if (ch) ch.unbind(event, callback)
      }
    }
  }

  private startPolling(channel: string) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/realtime/${channel}`)
        if (response.ok) {
          const data = await response.json()
          this.broadcast(channel, 'update', data)
        }
      } catch { }
    }, 3000)
    this.pollingIntervals.set(channel, interval)
  }

  broadcast(channel: string, event: string, data: any) {
    const key = `${channel}:${event}`
    this.subscribers.get(key)?.forEach(cb => cb(data))
  }

  emit(channel: string, event: string, data: any) {
    fetch('/api/realtime/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, event, data }),
    }).catch(() => { })
  }
}

export const realtimeService = new RealtimeService()

export function useRealtime(channel: string, event: string) {
  const [data, setData] = useState<any>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let active = true
    realtimeService.subscribe(channel, event, (newData) => {
      if (active) setData(newData)
    }).then(unsub => {
      unsubRef.current = unsub
    })
    return () => {
      active = false
      unsubRef.current?.()
    }
  }, [channel, event])

  return data
}

export function useRealtimeMulti(subscriptions: { channel: string; event: string; onData: (d: any) => void }[]) {
  useEffect(() => {
    const unsubs: Array<() => void> = []
    subscriptions.forEach(({ channel, event, onData }) => {
      realtimeService.subscribe(channel, event, onData).then(unsub => unsubs.push(unsub))
    })
    return () => unsubs.forEach(u => u())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// Server-side broadcast helper
export function broadcast(channel: string, event: string, data: any) {
  realtimeService.broadcast(channel, event, data)
}
