import QRCode from 'qrcode'
import { nanoid } from 'nanoid'
import { Prisma, PrismaClient } from '@prisma/client'
import { buildProviderChain } from '@/lib/die/provider/index'
import { DIE_PLUGIN_EVENTS } from '../core/plugin-events'
import type { DIEPlugin, DIEPluginPublishResult } from '../core/plugin-types'
import type { DIEPluginManifest } from '../core/plugin-manifest'
import { getCachedValue, setCachedValue, deleteCachedValue } from '@/lib/die/plugins/runtime/cache'

const BUSINESS_CACHE_NAMESPACE = 'qr-menu:business-summary'
const BUSINESS_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const MENU_PAYLOAD_CACHE_NAMESPACE = 'qr-menu:menu-payload'
const MENU_PAYLOAD_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MENU_PAYLOAD_NEGATIVE_TTL_MS = 60 * 1000
const DASHBOARD_METRICS_CACHE_NAMESPACE = 'qr-menu:dashboard-metrics'
const DASHBOARD_METRICS_CACHE_TTL_MS = 60 * 1000

type BusinessSummary = {
  id: string
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  whatsapp?: string | null
}

type DashboardMetricsCache = {
  totalMenus: number
  totalItems: number
  publishedMenus: number
  lastUpdatedAt: string | null
}

async function getBusinessSummary(prisma: PrismaClient, businessId: string): Promise<BusinessSummary | null> {
  const cached = getCachedValue<BusinessSummary | null>(BUSINESS_CACHE_NAMESPACE, businessId)
  if (typeof cached !== 'undefined') {
    return cached
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      country: true,
      phone: true,
      whatsappNumber: true,
    },
  })

  if (!business) {
    setCachedValue(BUSINESS_CACHE_NAMESPACE, businessId, null, BUSINESS_CACHE_TTL_MS)
    return null
  }

  const summary: BusinessSummary = {
    id: business.id,
    name: business.name,
    address: business.address,
    city: business.city,
    country: business.country,
    phone: business.phone,
    whatsapp: business.whatsappNumber,
  }

  setCachedValue(BUSINESS_CACHE_NAMESPACE, businessId, summary, BUSINESS_CACHE_TTL_MS)
  return summary
}

function invalidateMenuCaches(businessId: string, menuId: string) {
  deleteCachedValue(MENU_PAYLOAD_CACHE_NAMESPACE, menuId)
  deleteCachedValue(DASHBOARD_METRICS_CACHE_NAMESPACE, businessId)
}

const providerChain = buildProviderChain()

interface MenuItem {
  name: string
  price: number
  category: string
}

export type QRMenuItem = MenuItem

interface MenuEnhancementResult {
  menuItems: MenuItem[]
  translations?: Record<string, MenuItem[]>
  pricingInsights?: {
    missingPrices?: string[]
    inconsistentPrices?: Array<{ name: string; observed: number[] }>
  }
  branding?: {
    suggestedTitle?: string
    accentColor?: string
  }
}

interface MenuRecordWithBusiness {
  record: {
    id: string
    businessId: string
    menuItems: MenuItem[]
    qrCodeStorageKey: string
    jsonStorageKey: string
    publicUrl: string
    sourceFileKey: string
    status: string
    createdAt: Date
    updatedAt: Date
  }
  business: BusinessSummary | null
}

let ensureTablePromise: Promise<void> | null = null

type PrismaQrMenuEntity = {
  id: string
  businessId: string
  menuItems: Prisma.JsonValue
  qrCodeStorageKey: string
  jsonStorageKey: string
  publicUrl: string
  sourceDocumentId: string | null
  sourceScanJobId: string | null
  sourceFileKey: string
  status: string
  createdAt: Date
  updatedAt: Date
}

interface MenuRecordWithBusiness {
  record: {
    id: string
    businessId: string
    menuItems: MenuItem[]
    qrCodeStorageKey: string
    jsonStorageKey: string
    publicUrl: string
    sourceFileKey: string
    status: string
    createdAt: Date
    updatedAt: Date
  }
  business: BusinessSummary | null
}

async function ensureQrMenuTable(prisma: PrismaClient): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      const sql = `CREATE TABLE IF NOT EXISTS "plugin_data_qr_menu" (
        "id" text PRIMARY KEY,
        "businessId" text NOT NULL,
        "menuItems" jsonb NOT NULL,
        "qrCodeStorageKey" text NOT NULL,
        "jsonStorageKey" text NOT NULL,
        "publicUrl" text NOT NULL,
        "sourceDocumentId" text NULL,
        "sourceScanJobId" text NULL,
        "sourceFileKey" text NOT NULL,
        "status" text NOT NULL DEFAULT 'GENERATED',
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      );`

      const indexBusiness =
        'CREATE INDEX IF NOT EXISTS plugin_data_qr_menu_business_idx ON "plugin_data_qr_menu" ("businessId");'
      const indexStatus =
        'CREATE INDEX IF NOT EXISTS plugin_data_qr_menu_status_idx ON "plugin_data_qr_menu" ("status");'

      await prisma.$executeRawUnsafe(sql)
      await prisma.$executeRawUnsafe(indexBusiness)
      await prisma.$executeRawUnsafe(indexStatus)
    })().catch((err) => {
      ensureTablePromise = null
      throw err
    })
  }

  await ensureTablePromise
}

function normalizeCategory(raw: string | undefined, fallback = 'General'): string {
  if (!raw) return fallback
  const lower = raw.trim().toLowerCase()
  if (!lower) return fallback
  return lower
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseMenuLines(textContent: string): MenuItem[] {
  const lines = textContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const items: MenuItem[] = []
  let currentCategory = 'General'

  for (const line of lines) {
    const hasDigits = /\d/.test(line)
    const isHeading = !hasDigits && line === line.toUpperCase() && line.length > 2

    if (isHeading) {
      currentCategory = normalizeCategory(line)
      continue
    }

    const priceMatch = line.match(/(\d+[\d.,]*)\s*(?:RWF|FRW|FR\.?w|Frw|Rwf)?$/i)
    if (!priceMatch) {
      continue
    }

    const pricePart = priceMatch[1]
    const numeric = parseFloat(pricePart.replace(/[\,\s]/g, ''))
    if (Number.isNaN(numeric)) continue

    const label = line.slice(0, priceMatch.index).trim().replace(/[-–·,:]+$/g, '').trim()
    if (!label) continue

    const item: MenuItem = {
      name: normalizeCategory(label, label),
      price: Math.round(numeric * 100) / 100,
      category: currentCategory,
    }

    items.push(item)
  }

  const deduped = new Map<string, MenuItem>()
  for (const item of items) {
    const key = `${item.category.toLowerCase()}::${item.name.toLowerCase()}`
    if (!deduped.has(key) || (deduped.get(key)?.price ?? 0) > item.price) {
      deduped.set(key, item)
    }
  }

  return Array.from(deduped.values()).slice(0, 200)
}

function coerceMenuItems(raw: Prisma.JsonValue): MenuItem[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return (raw as Prisma.JsonValue[])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const candidate = entry as Record<string, unknown>
      const name = typeof candidate.name === 'string' ? candidate.name : ''
      const category = typeof candidate.category === 'string' ? candidate.category : 'Menu'
      const priceRaw = typeof candidate.price === 'number' ? candidate.price : Number(candidate.price ?? 0)
      if (!name) return null

      return {
        name,
        category,
        price: Number.isFinite(priceRaw) ? priceRaw : 0,
      } satisfies MenuItem
    })
    .filter((item): item is MenuItem => Boolean(item))
}

async function runExtraction(buffer: Buffer, mimeType: string): Promise<string> {
  for (const provider of providerChain) {
    try {
      if (!provider.supportsMime(mimeType)) continue
      const result = await provider.extract({ buffer, mime: mimeType, documentType: 'MENU' as any })

      if (Array.isArray(result?.lines) && result.lines.length > 0) {
        return result.lines
          .map((line: any) => {
            if (!line) return ''
            if (typeof line === 'string') return line
            if (typeof line.text === 'string') return line.text
            if (typeof line.content === 'string') return line.content
            if (Array.isArray(line.fields)) {
              return line.fields.map((f: any) => f?.value ?? '').join(' ')
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')
      }

      const fullText: string | undefined =
        (result?.rawPayload as any)?.fullText ??
        (result?.rawPayload as any)?.content ??
        (result as any)?.text

      if (fullText && typeof fullText === 'string') {
        return fullText
      }
    } catch (err) {
      console.warn('[QRMenuPlugin] Provider failure:', err)
    }
  }

  throw new Error('No extraction provider produced a result')
}

function buildPublicUrl(menuId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  const path = `/plugins/qr-menu/${menuId}`
  return base ? `${base}${path}` : path
}

async function ensureQrMenuRecord(
  prisma: PrismaClient,
  data: {
    menuId: string
    businessId: string
    menuItems: MenuItem[]
    qrCodeStorageKey: string
    menuJsonStorageKey: string
    publicUrl: string
    sourceFileKey: string
    sourceDocumentId?: string | null
    scanJobId?: string | null
  }
) {
  await ensureQrMenuTable(prisma)

  const prismaWithQr = prisma as any

  const result = await prismaWithQr.pluginQrMenu.upsert({
    where: { id: data.menuId },
    update: {
      businessId: data.businessId,
      menuItems: data.menuItems,
      qrCodeStorageKey: data.qrCodeStorageKey,
      jsonStorageKey: data.menuJsonStorageKey,
      publicUrl: data.publicUrl,
      sourceDocumentId: data.sourceDocumentId ?? null,
      sourceScanJobId: data.scanJobId ?? null,
      sourceFileKey: data.sourceFileKey,
      status: 'GENERATED',
      updatedAt: new Date(),
    },
    create: {
      id: data.menuId,
      businessId: data.businessId,
      menuItems: data.menuItems,
      qrCodeStorageKey: data.qrCodeStorageKey,
      jsonStorageKey: data.menuJsonStorageKey,
      publicUrl: data.publicUrl,
      sourceDocumentId: data.sourceDocumentId ?? null,
      sourceScanJobId: data.scanJobId ?? null,
      sourceFileKey: data.sourceFileKey,
      status: 'GENERATED',
    },
  })

  invalidateMenuCaches(data.businessId, data.menuId)
  return result
}

async function applyAiEnhancements(
  input: {
    menuItems: MenuItem[]
    businessId: string
    locale?: string
  }
): Promise<MenuEnhancementResult> {
  // Placeholder for future AI enrichment pipeline (multi-language, pricing, branding)
  return {
    menuItems: input.menuItems,
  }
}

async function loadMenuRecord(prisma: PrismaClient, menuId: string): Promise<MenuRecordWithBusiness | null> {
  const prismaWithQr = prisma as any

  const record = (await prismaWithQr.pluginQrMenu.findUnique({
    where: { id: menuId },
  })) as PrismaQrMenuEntity | null

  if (!record) {
    return null
  }

  const business = await getBusinessSummary(prisma, record.businessId)

  return {
    record: {
      id: record.id,
      businessId: record.businessId,
      menuItems: coerceMenuItems(record.menuItems),
      qrCodeStorageKey: record.qrCodeStorageKey,
      jsonStorageKey: record.jsonStorageKey,
      publicUrl: record.publicUrl,
      sourceFileKey: record.sourceFileKey,
      status: record.status ?? 'GENERATED',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    business,
  }
}

type CachedMenuPayload = {
  businessId: string
  payload: QRMenuPublicPayload
}

async function resolveMenuPayload(
  prisma: PrismaClient,
  menuId: string,
  getPublicUrl?: (storageKey: string) => string | null,
  preloadedRecord?: MenuRecordWithBusiness
): Promise<CachedMenuPayload | null> {
  const cached = getCachedValue<CachedMenuPayload | null>(MENU_PAYLOAD_CACHE_NAMESPACE, menuId)
  if (typeof cached !== 'undefined') {
    return cached
  }

  const record = preloadedRecord ?? (await loadMenuRecord(prisma, menuId))
  if (!record) {
    setCachedValue(MENU_PAYLOAD_CACHE_NAMESPACE, menuId, null, MENU_PAYLOAD_NEGATIVE_TTL_MS)
    return null
  }

  const payload = toApiPayload(record, getPublicUrl)
  const cacheValue: CachedMenuPayload = {
    businessId: record.record.businessId,
    payload,
  }

  setCachedValue(MENU_PAYLOAD_CACHE_NAMESPACE, menuId, cacheValue, MENU_PAYLOAD_CACHE_TTL_MS)
  return cacheValue
}

export interface QRMenuPublicPayload {
  menuId: string
  business: {
    id: string
    name: string
    address?: string
    phone?: string | null
    whatsapp?: string | null
  } | null
  menuItems: MenuItem[]
  publicUrl: string
  qrCodeUrl: string | null
  qrCodeStorageKey: string
  jsonStorageKey: string
  status: string
  updatedAt: string
  createdAt: string
}

export interface QRMenuDashboardPayload {
  business: QRMenuPublicPayload['business']
  summary: {
    totalMenus: number
    totalItems: number
    publishedMenus: number
    lastUpdatedAt: string | null
  }
  menus: Array<QRMenuPublicPayload & { itemCount: number }>
}

function formatBusinessInfo(business: BusinessSummary | null) {
  if (!business) return null

  return {
    id: business.id,
    name: business.name,
    address: [business.address, business.city, business.country].filter(Boolean).join(', '),
    phone: business.phone ?? undefined,
    whatsapp: business.whatsapp ?? undefined,
  }
}

function toApiPayload(
  data: MenuRecordWithBusiness,
  getPublicUrl?: (storageKey: string) => string | null
): QRMenuPublicPayload {
  const qrCodeUrl = data.record.qrCodeStorageKey ? getPublicUrl?.(data.record.qrCodeStorageKey) ?? null : null

  const business = formatBusinessInfo(data.business)

  return {
    menuId: data.record.id,
    business,
    menuItems: data.record.menuItems,
    publicUrl: data.record.publicUrl,
    qrCodeUrl,
    qrCodeStorageKey: data.record.qrCodeStorageKey,
    jsonStorageKey: data.record.jsonStorageKey,
    status: data.record.status,
    updatedAt: data.record.updatedAt.toISOString(),
    createdAt: data.record.createdAt.toISOString(),
  }
}

const manifest: DIEPluginManifest & { version: string; author?: string; category: string; tags?: string[] } = {
  version: '1.1.0',
  author: 'DIE Core',
  category: 'menu',
  tags: ['qr', 'restaurant', 'menu', 'ordering'],
  routes: {
    public: [
      {
        id: 'qr-menu.public.detail',
        path: '/plugins/qr-menu/[menuId]',
        description: 'Public QR menu view',
        guard: 'public',
      },
    ],
    api: [
      {
        id: 'qr-menu.api.detail',
        path: '/api/plugins/qr-menu/[menuId]',
        method: 'GET',
        description: 'Fetch QR menu payload',
        guard: 'public',
      },
    ],
    dashboard: [
      {
        id: 'qr-menu.dashboard.overview',
        path: '/dashboard/die/plugins/qr-menu',
        description: 'Manage QR menu plugin',
        guard: 'business',
        icon: 'qr-code',
        order: 10,
      },
    ],
  },
  metadata: {
    category: 'menu',
  },
}

export const QRMenuPlugin: DIEPlugin = {
  id: 'qr-menu',
  name: 'QR Menu Generator',
  version: '1.1.0',
  type: 'PUBLIC',
  description: 'Generate shareable QR menus from scanned documents and images.',
  businessScoped: true,
  manifest,
  // v2: structural-only marketplace fields
  capabilities: ['qr', 'public-menu', 'dashboard'],
  pricingModel: 'free',
  visibility: 'public',
  triggers: [
    DIE_PLUGIN_EVENTS.MENU_UPLOADED,
    DIE_PLUGIN_EVENTS.DOCUMENT_UPLOADED,
    DIE_PLUGIN_EVENTS.IMAGE_DETECTED,
  ],
  async install({ services }) {
    await ensureQrMenuTable(services.prisma)
  },
  async execute(context) {
    const { services, businessId, event } = context
    const payload = event.payload as any

    let fileKey: string | undefined = payload.fileKey
    let mimeType: string | undefined = payload.mimeType
    const scanJobId: string | undefined = payload.scanJobId

    if (!fileKey && scanJobId) {
      const scanJob = await services.prisma.scanJob.findUnique({
        where: { id: scanJobId },
        select: { sourceFileKey: true, sourceMime: true },
      })
      fileKey = scanJob?.sourceFileKey ?? undefined
      mimeType = scanJob?.sourceMime ?? mimeType
    }

    if (!fileKey) {
      services.logger.warn('[QRMenuPlugin] Skipping execution — no file key available')
      return { success: false, errors: ['Missing source file for QR menu generation'] }
    }

    mimeType = mimeType || 'image/jpeg'

    let textContent: string
    try {
      const fileBuffer = await services.storage.readBuffer(fileKey)
      textContent = await runExtraction(fileBuffer, mimeType)
    } catch (err) {
      return {
        success: false,
        errors: ['Failed to process menu image', err instanceof Error ? err.message : String(err)],
      }
    }

    const parsedMenuItems = parseMenuLines(textContent)
    if (parsedMenuItems.length === 0) {
      return {
        success: false,
        warnings: ['No menu items detected in uploaded content'],
        errors: ['Menu parsing returned no items'],
      }
    }

    let finalMenuItems = parsedMenuItems
    try {
      const enhancements = await applyAiEnhancements({
        menuItems: parsedMenuItems,
        businessId,
        locale: payload?.locale,
      })
      finalMenuItems = enhancements.menuItems
    } catch (error) {
      services.logger.warn('[QRMenuPlugin] AI enhancement pipeline failed, continuing with base menu', error)
    }

    const menuId = nanoid(12)
    const publicUrl = buildPublicUrl(menuId)
    const storagePrefix = `plugin_data/qr-menu/${businessId}/${menuId}`

    const menuPayload = {
      menuId,
      businessId,
      source: {
        trigger: event.type,
        documentId: context.documentId ?? null,
        scanJobId: scanJobId ?? null,
        fileKey,
      },
      menuItems: finalMenuItems,
      generatedAt: new Date().toISOString(),
      publicUrl,
    }

    const [menuJson, qrCodeBuffer] = await Promise.all([
      services.storage.saveJson(`${storagePrefix}/menu`, menuPayload),
      QRCode.toBuffer(publicUrl, { type: 'png', margin: 1, width: 512 }),
    ])

    const qrCodeUpload = await services.storage.saveBuffer(
      `${storagePrefix}/qr.png`,
      qrCodeBuffer,
      'image/png'
    )

    const record = await ensureQrMenuRecord(services.prisma, {
      menuId,
      businessId,
      menuItems: finalMenuItems,
      qrCodeStorageKey: qrCodeUpload.storageKey,
      menuJsonStorageKey: menuJson.storageKey,
      publicUrl,
      sourceFileKey: fileKey,
      sourceDocumentId: context.documentId ?? null,
      scanJobId: scanJobId ?? null,
    })

    return {
      success: true,
      data: {
        menuId: record.id,
        publicUrl: record.publicUrl,
        qrCodeStorageKey: record.qrCodeStorageKey,
        qrCodeUrl: services.storage.getPublicUrl?.(record.qrCodeStorageKey ?? '') ?? null,
        menuItems: finalMenuItems,
      },
    }
  },
  async render(context) {
    if (context.route.id === 'qr-menu.dashboard.overview') {
      const businessId = context.businessId
      if (!businessId) {
        return { type: 'notFound' }
      }

      const prismaWithQr = context.services.prisma as any
      const cachedMetrics = getCachedValue<DashboardMetricsCache>(
        DASHBOARD_METRICS_CACHE_NAMESPACE,
        businessId
      )

      const [records, businessSummary] = await Promise.all([
        prismaWithQr.pluginQrMenu.findMany({
          where: { businessId },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }) as Promise<PrismaQrMenuEntity[]>,
        getBusinessSummary(context.services.prisma, businessId),
      ])

      const menusWithPayload = await Promise.all(
        records.map(async (record: PrismaQrMenuEntity) => {
          const menuItems = coerceMenuItems(record.menuItems)
          const preloaded: MenuRecordWithBusiness = {
            record: {
              id: record.id,
              businessId: record.businessId,
              menuItems,
              qrCodeStorageKey: record.qrCodeStorageKey,
              jsonStorageKey: record.jsonStorageKey,
              publicUrl: record.publicUrl,
              sourceFileKey: record.sourceFileKey,
              status: record.status ?? 'GENERATED',
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            },
            business: businessSummary,
          }

          const cachedPayload = await resolveMenuPayload(
            context.services.prisma,
            record.id,
            context.services.storage.getPublicUrl,
            preloaded
          )

          const payload = cachedPayload?.payload ?? toApiPayload(preloaded, context.services.storage.getPublicUrl)

          return {
            payload,
            itemCount: menuItems.length,
          }
        })
      )

      const menus: Array<QRMenuPublicPayload & { itemCount: number }> = menusWithPayload.map(({ payload, itemCount }) => ({
        ...payload,
        itemCount,
      }))

      const totalItems = menusWithPayload.reduce<number>((acc, entry) => acc + entry.itemCount, 0)
      const publishedMenus = menusWithPayload.reduce<number>(
        (acc, entry) => (entry.payload.publicUrl ? acc + 1 : acc),
        0
      )
      const lastUpdatedAt = menusWithPayload[0]?.payload.updatedAt ?? null
      const approxTotalMenus = menus.length
      const totalMenus = cachedMetrics?.totalMenus ?? approxTotalMenus

      const metrics: DashboardMetricsCache = {
        totalMenus,
        totalItems,
        publishedMenus,
        lastUpdatedAt,
      }

      if (!cachedMetrics) {
        setCachedValue(DASHBOARD_METRICS_CACHE_NAMESPACE, businessId, metrics, DASHBOARD_METRICS_CACHE_TTL_MS)
        ;(async () => {
          try {
            const exact = await prismaWithQr.pluginQrMenu.count({ where: { businessId } })
            setCachedValue(
              DASHBOARD_METRICS_CACHE_NAMESPACE,
              businessId,
              { ...metrics, totalMenus: exact },
              DASHBOARD_METRICS_CACHE_TTL_MS
            )
          } catch (err) {
            // swallow errors; cache will refresh on next request
          }
        })()
      }

      const businessDetails = businessSummary
        ? {
            id: businessSummary.id,
            name: businessSummary.name,
            address: businessSummary.address,
            city: businessSummary.city,
            country: businessSummary.country,
            phone: businessSummary.phone ?? undefined,
            whatsapp: businessSummary.whatsapp ?? undefined,
          }
        : null

      const dashboardPayload: QRMenuDashboardPayload = {
        business: menus[0]?.business ?? formatBusinessInfo(businessDetails),
        summary: metrics,
        menus,
      }

      return {
        type: 'props',
        props: {
          pluginId: 'qr-menu',
          routeId: context.route.id,
          data: dashboardPayload,
        },
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    }

    if (context.route.id !== 'qr-menu.public.detail') {
      return { type: 'notFound' }
    }

    const menuId = context.params.menuId
    if (!menuId) {
      return { type: 'notFound' }
    }

    const cached = await resolveMenuPayload(context.services.prisma, menuId, context.services.storage.getPublicUrl)
    if (!cached) {
      return { type: 'notFound' }
    }

    const requiresBusinessMatch = context.route.guard === 'business'
    if (requiresBusinessMatch && context.businessId && context.businessId !== cached.businessId) {
      return { type: 'notFound' }
    }

    const payload = cached.payload
    if (!payload.menuItems?.length) {
      return { type: 'notFound' }
    }

    return {
      type: 'props',
      props: {
        pluginId: 'qr-menu',
        routeId: context.route.id,
        data: payload,
      },
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
      },
    }
  },
  async publish(context) {
    if (context.route.id !== 'qr-menu.api.detail') {
      return {
        status: 404,
        body: { error: 'Route not handled' },
      }
    }

    const menuId = context.params.menuId
    if (!menuId) {
      return {
        status: 400,
        body: { error: 'Invalid menuId' },
      }
    }

    const cached = await resolveMenuPayload(context.services.prisma, menuId, context.services.storage.getPublicUrl)
    if (!cached) {
      return {
        status: 404,
        body: { error: 'Menu not found' },
      }
    }

    const payload = cached.payload

    return {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
      },
      body: payload,
    } satisfies DIEPluginPublishResult
  },
}
