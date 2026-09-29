import type { PrismaClient } from '@prisma/client'

export interface DIEPluginEvent<TPayload = Record<string, unknown>> {
  type: string
  trigger: string
  timestamp: Date
  payload: TPayload
  correlationId?: string
  tags?: string[]
}

export interface DIEPluginLogger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export interface DIEPluginStorageAdapter {
  saveJson: (key: string, data: unknown) => Promise<{ storageKey: string }>
  saveBuffer: (key: string, buffer: Buffer, contentType: string) => Promise<{ storageKey: string }>
  getPublicUrl?: (storageKey: string) => string | null
  readBuffer: (storageKey: string) => Promise<Buffer>
}

export interface DIEPluginServices {
  prisma: PrismaClient
  logger: DIEPluginLogger
  storage: DIEPluginStorageAdapter
  publish: (event: DIEPluginEvent) => Promise<void>
}

export interface DIEPluginContext<TPayload = Record<string, unknown>> {
  businessId: string
  documentId?: string | null
  userId?: string | null
  event: DIEPluginEvent<TPayload>
  metadata?: Record<string, unknown>
  services: DIEPluginServices
}

export interface DIEPluginLifecycleContext {
  services: DIEPluginServices
}
