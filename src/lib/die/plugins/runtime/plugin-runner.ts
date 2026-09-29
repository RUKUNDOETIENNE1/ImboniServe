import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage.service'
import type { DIEPlugin, DIEPluginResult } from '../core/plugin-types'
import type { DIEPluginContext, DIEPluginEvent } from '../core/plugin-context'
import { PluginRegistry } from '../core/plugin-registry'
import { PluginExecutor } from '../core/plugin-executor'
import { defaultPluginHooks } from '../core/plugin-hooks'
import { PluginEventBus } from './event-bus'
import { TriggerResolver } from './trigger-resolver'
import { registerCorePlugins } from '../built-in/die-core.plugins'

class PluginRunner {
  private readonly registry = new PluginRegistry()
  private readonly eventBus = new PluginEventBus()
  private readonly executor = new PluginExecutor(defaultPluginHooks)
  private readonly triggerResolver = new TriggerResolver(() => this.registry.list())

  constructor() {
    registerCorePlugins(this.registry)
  }

  register(plugin: DIEPlugin): void {
    this.registry.register(plugin)
    const services = this.createServices()
    // v2 lifecycle normalization — safe no-op wrappers
    const doInstall = async () => {
      try {
        if (plugin.install) {
          await plugin.install({ services })
        }
        if (plugin.onInstall) {
          await plugin.onInstall({ services })
        }
        console.info(`[PluginRunner] install completed for ${plugin.id}`)
      } catch (err) {
        console.error(`[PluginRunner] install failed for ${plugin.id}`, err)
      }
    }
    void doInstall()
    if (plugin.bootstrap) {
      plugin.bootstrap({ services }).catch((err) => {
        console.error(`[PluginRunner] Plugin ${plugin.id} bootstrap failed`, err)
      })
    }
  }

  list(): DIEPlugin[] {
    return this.registry.list()
  }

  getRegistry(): PluginRegistry {
    return this.registry
  }

  getServices(businessId?: string) {
    return this.createServices(businessId)
  }

  subscribe(eventType: string, handler: (event: DIEPluginEvent) => Promise<void> | void): () => void {
    return this.eventBus.subscribe(eventType, handler)
  }

  async emit(event: DIEPluginEvent): Promise<void> {
    await this.eventBus.publish(event)
    await this.runPlugins(event)
  }

  private createServices(businessId?: string) {
    const businessContext = businessId ?? 'shared'

    return {
      prisma,
      logger: console,
      storage: {
        saveJson: async (key: string, data: unknown) => {
          const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
          const filename = key.endsWith('.json') ? key : `${key}.json`
          const { storageKey } = await StorageService.uploadPrivateDocument(
            buffer,
            filename,
            'application/json',
            businessContext
          )
          return { storageKey }
        },
        saveBuffer: async (key: string, buffer: Buffer, contentType: string) => {
          if (contentType?.startsWith('image/')) {
            const { storageKey } = await StorageService.uploadImage(buffer, key, contentType, businessContext)
            return { storageKey }
          }

          if (contentType === 'application/json') {
            const filename = key.endsWith('.json') ? key : `${key}.json`
            const { storageKey } = await StorageService.uploadPrivateDocument(
              buffer,
              filename,
              contentType,
              businessContext
            )
            return { storageKey }
          }

          const { storageKey } = await StorageService.uploadFileGeneric(
            buffer,
            key,
            contentType ?? 'application/octet-stream',
            businessContext
          )
          return { storageKey }
        },
        getPublicUrl: (storageKey: string) => StorageService.getPublicUrl?.(storageKey) ?? null,
        readBuffer: async (storageKey: string) => StorageService.downloadPrivate(storageKey),
      },
      publish: async (forwardEvent: DIEPluginEvent) => {
        await this.emit(forwardEvent)
      },
    }
  }

  private async runPlugins(event: DIEPluginEvent): Promise<void> {
    const plugins = this.triggerResolver.resolve(event.type)
    if (plugins.length === 0) return

    await Promise.allSettled(
      plugins.map(async (plugin) => {
        const eventPayload = event.payload as any
        const businessId = eventPayload?.businessId ?? null
        if (plugin.businessScoped && !businessId) {
          console.warn(`[PluginRunner] Plugin ${plugin.id} requires business scope but event missing businessId`)
          return
        }

        const context: DIEPluginContext = {
          businessId: businessId ?? '',
          documentId: (event.payload as any)?.documentId ?? null,
          userId: (event.payload as any)?.userId ?? null,
          event: event,
          services: this.createServices(plugin.businessScoped ? businessId ?? undefined : undefined),
        }

        const result: DIEPluginResult = await this.executor.execute(plugin, context)

        if (!result.success) {
          console.warn(`[PluginRunner] Plugin ${plugin.id} reported failure`, result.errors)
        }
      })
    )
  }

  // v2 lifecycle wrappers for external enable/disable triggers (no-op by default)
  async enable(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) return
    const services = this.createServices()
    try {
      if (plugin.onEnable) {
        await plugin.onEnable({ services })
      }
      console.info(`[PluginRunner] enable completed for ${plugin.id}`)
    } catch (err) {
      console.error(`[PluginRunner] enable failed for ${plugin.id}`, err)
    }
  }

  async disable(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) return
    const services = this.createServices()
    try {
      if (plugin.onDisable) {
        await plugin.onDisable({ services })
      }
      console.info(`[PluginRunner] disable completed for ${plugin.id}`)
    } catch (err) {
      console.error(`[PluginRunner] disable failed for ${plugin.id}`, err)
    }
  }
}

export const pluginRunner = new PluginRunner()
