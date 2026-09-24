import { EventEmitter } from 'events'
import type { DIEPluginEvent } from '../core/plugin-context'

export type PluginEventHandler = (event: DIEPluginEvent) => Promise<void> | void

export class PluginEventBus {
  private readonly emitter = new EventEmitter()

  constructor() {
    this.emitter.setMaxListeners(100)
  }

  subscribe(eventType: string, handler: PluginEventHandler): () => void {
    const wrapped = async (event: DIEPluginEvent) => {
      try {
        await handler(event)
      } catch (error) {
        // Handlers must never throw back to the emitter
        console.error('[PluginEventBus] Handler error', { eventType, error })
      }
    }

    this.emitter.on(eventType, wrapped)

    return () => {
      this.emitter.off(eventType, wrapped)
    }
  }

  async publish(event: DIEPluginEvent): Promise<void> {
    const listeners = [
      ...this.emitter.listeners(event.type),
      ...this.emitter.listeners('*'),
    ]

    if (listeners.length === 0) return

    await Promise.allSettled(listeners.map((listener) => Promise.resolve((listener as any)(event))))
  }
}
