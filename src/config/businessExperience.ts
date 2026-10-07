/**
 * Digital Business Experience — configurable scene + hotspot architecture.
 *
 * Separates:
 *   1. Visual layer      (poster image now; a real 3D scene later via position3d)
 *   2. Hotspot layer     (semantic interactive points, data-driven — never hard-coded in the component)
 *   3. Context panel     (rendered by <BusinessExperience />)
 *   4. Action layer      (ExperienceActionType → real Imboni Serve routes)
 *
 * A scene is associated with a business. Hotspot positions are expressed both
 * as 2D percentages (for the Phase-1 image layer) and optional 3D coordinates
 * (reserved for a Three.js / React Three Fiber scene). Scenes are data so they
 * can later be served per-business from the API without changing components.
 */

export type ExperienceActionType =
  | 'OPEN_MENU'
  | 'OPEN_MENU_CATEGORY'
  | 'OPEN_ORDER'
  | 'OPEN_RESERVATION'
  | 'OPEN_TABLE'
  | 'OPEN_ROOM'
  | 'OPEN_ROOM_SERVICE'
  | 'OPEN_EVENTS'
  | 'OPEN_DIRECTIONS'
  | 'OPEN_KDS'
  | 'OPEN_BUSINESS_INFO'
  | 'OPEN_PAYMENT'

export interface ExperienceAction {
  label: string
  type: ExperienceActionType
  /** Only render for authenticated staff (existing permissions still apply on the target route). */
  requiresStaff?: boolean
  /** Optional data for the resolver, e.g. { category: 'drinks' } or { href: '/custom' }. */
  payload?: Record<string, string>
}

export interface ExperienceHotspot {
  id: string
  label: string
  secondary: string
  description?: string
  /** Optional customer-facing note shown instead of staff actions for anonymous users. */
  customerNote?: string
  /** Position on the 2D visual layer, as % of viewport (x: left, y: top). */
  position: { x: number; y: number }
  /** Reserved for the real 3D scene (world-space coordinates). */
  position3d?: [number, number, number]
  /** Camera aim point when focused (defaults to position3d). Lets the marker stay visible while the camera frames the area. */
  focusTarget?: [number, number, number]
  /** Camera distance from focusTarget when focused. Defaults to a scene-level fallback. */
  focusDistance?: number
  /** Direction (unnormalized) from focusTarget to the camera when focused. Lets each area get an intentional cinematic angle. Defaults to the current camera azimuth. */
  cameraOffset?: [number, number, number]
  /** Small stat rows, e.g. { label: 'Capacity', value: '120' } — populate from business data when available. */
  stats?: Array<{ label: string; value: string }>
  actions: ExperienceAction[]
}

export type ExperienceBusinessType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'hotel'
  | 'resort'
  | 'conference_venue'

export interface ExperienceScene {
  id: string
  businessName: string
  businessType: ExperienceBusinessType
  /** Real business id when the scene represents a real business (absent in demo mode). */
  businessId?: string
  /** Static marketing/fallback visual. */
  posterImage: string
  /** Reserved: GLB/GLTF model URL for the future React Three Fiber scene. */
  modelUrl?: string
  hotspots: ExperienceHotspot[]
}

/**
 * Context handed to the action resolver. In real-business mode this carries
 * the actual business identifiers/location/capabilities so actions can
 * deep-link into real functionality. Never hard-code URLs in components.
 */
export interface ExperienceActionContext {
  businessSlug?: string
  businessId?: string
  latitude?: number | null
  longitude?: number | null
  /** Remote QR ordering enabled — allows direct /order deep links. */
  qrRemote?: boolean
  whatsappNumber?: string | null
  discoverUrl?: string
}

/**
 * Maps an abstract experience action to a real Imboni Serve destination.
 * Always reuse existing routes — never fake navigation.
 *
 * Real-business mode deep-links to the business's actual public page,
 * ordering flow, map location or contact channel. Demo mode (empty context)
 * falls back to generic public entry points.
 *
 * NOTE: public reservation creation does not exist yet — OPEN_RESERVATION
 * resolves to the business's WhatsApp (if published) or its public profile
 * page as the customer contact path. Replace with the real booking route
 * when it ships.
 */
export function resolveExperienceAction(
  action: ExperienceAction,
  context: ExperienceActionContext = {},
): string {
  const { businessSlug, businessId, latitude, longitude, qrRemote, whatsappNumber } = context
  const discover = context.discoverUrl || '/discover'
  const business = businessSlug ? `/discover/${businessSlug}` : discover
  const orderUrl = qrRemote && businessId ? `/order?branchId=${businessId}` : business
  const waDigits = whatsappNumber?.replace(/\D/g, '')
  const contactUrl = waDigits ? `https://wa.me/${waDigits}` : business

  switch (action.type) {
    case 'OPEN_MENU':
    case 'OPEN_MENU_CATEGORY':
    case 'OPEN_BUSINESS_INFO':
      return business
    case 'OPEN_ORDER':
    case 'OPEN_TABLE':
      return orderUrl
    case 'OPEN_RESERVATION':
      return contactUrl
    case 'OPEN_EVENTS':
    case 'OPEN_ROOM':
    case 'OPEN_ROOM_SERVICE':
      return business
    case 'OPEN_DIRECTIONS':
      return latitude != null && longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        : '/discover/map'
    case 'OPEN_KDS':
      return '/dashboard/kds'
    case 'OPEN_PAYMENT':
      return orderUrl
    default:
      return action.payload?.href || discover
  }
}

/**
 * Demo scene: a generic premium restaurant used by the public "Explore 3D Demo".
 * Demo stat values live here in config — clearly separated from real business
 * data, which will eventually populate hotspots from the business configuration.
 */
/**
 * Structural shape of the real business context supplied by the
 * ExperienceService (/api/experience/[slug]). Declared here so this config
 * stays free of server imports.
 */
export interface ExperienceBusinessShape {
  businessId: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  businessType: string | null
  cuisineTypes: string[]
  priceRange: string | null
  rating: number | null
  phone: string | null
  whatsappNumber: string | null
  hasMenu: boolean
  menuCategories: string[]
  hasDrinks: boolean
  qrInVenue: boolean
  qrRemote: boolean
  tableCount: number
  hasPublicReservations: boolean
  /**
   * Owner-configured per-area overrides from the dashboard
   * ({ enabled, label, description } keyed by hotspot id). Server-parsed
   * and sanitized; missing/unknown keys are ignored.
   */
  areaOverrides?: Record<string, { enabled?: boolean; label?: string; description?: string }>
}

export const DEMO_RESTAURANT_SCENE: ExperienceScene = {
  id: 'demo-restaurant',
  businessName: 'Imboni Demo Restaurant',
  businessType: 'restaurant',
  posterImage: '/imgs/02-restaurant-3d-reference.png',
  hotspots: [
    {
      id: 'entrance',
      label: 'Entrance',
      secondary: 'Welcome',
      description: 'Start here — explore the business, find it on the map, or walk straight in.',
      position: { x: 82, y: 62 },
      position3d: [-4, 1.9, 4.6],
      focusTarget: [-4, 1.1, 4.4],
      focusDistance: 10,
      cameraOffset: [0.45, 0.42, 0.79], // camera stays outside the front, looks in
      actions: [
        { label: 'Explore Business', type: 'OPEN_BUSINESS_INFO' },
        { label: 'Get Directions', type: 'OPEN_DIRECTIONS' },
      ],
    },
    {
      id: 'dining-area',
      label: 'Dining Area',
      secondary: 'Explore & Order',
      description: 'Browse the digital menu, pick a table, order from your phone, or reserve ahead.',
      customerNote: 'Ask your server for the table QR code to order instantly.',
      position: { x: 42, y: 55 },
      position3d: [-0.5, 1.9, 1.6],
      focusTarget: [-0.9, 0.8, 2.0],
      focusDistance: 9.5,
      cameraOffset: [0.62, 0.5, 0.62],
      stats: [{ label: 'Seating', value: 'Indoor dining' }],
      actions: [
        { label: 'Browse Menu', type: 'OPEN_MENU' },
        { label: 'Reserve Table', type: 'OPEN_RESERVATION' },
      ],
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      secondary: 'Live Orders',
      description: 'Orders placed from any table flow straight to the kitchen display.',
      customerNote: 'Your order is prepared fresh — track progress from your phone.',
      position: { x: 18, y: 30 },
      position3d: [-4.5, 2.7, -3.5],
      focusTarget: [-4.5, 1.5, -2.7], // the pass/counter face, not the back wall
      focusDistance: 9,
      cameraOffset: [0.68, 0.42, 0.6],
      actions: [{ label: 'View Kitchen Dashboard', type: 'OPEN_KDS', requiresStaff: true }],
    },
    {
      id: 'bar',
      label: 'Bar',
      secondary: 'Drinks & Cocktails',
      description: 'Browse the drinks menu and order without waiting for a server.',
      position: { x: 58, y: 28 },
      position3d: [3, 2.3, -3.4],
      focusTarget: [3, 0.9, -3.3],
      focusDistance: 10.5,
      cameraOffset: [0.42, 0.52, 0.74], // higher angle: counter top + stools readable
      actions: [
        { label: 'View Drinks', type: 'OPEN_MENU_CATEGORY', payload: { category: 'drinks' } },
        { label: 'Order Now', type: 'OPEN_ORDER' },
      ],
    },
    {
      id: 'terrace',
      label: 'Terrace',
      secondary: 'Outdoor Seating',
      description: 'Outdoor seating with the same scan-order-pay experience.',
      position: { x: 68, y: 74 },
      position3d: [4.5, 1.7, 3.6],
      focusTarget: [4.3, 0.8, 3.7],
      focusDistance: 9,
      cameraOffset: [-0.68, 0.38, 0.63], // from the dining side, low enough to keep floor context
      actions: [
        { label: 'Explore Tables', type: 'OPEN_MENU' },
        { label: 'Reserve Table', type: 'OPEN_RESERVATION' },
      ],
    },
  ],
}

const KNOWN_BUSINESS_TYPES: ExperienceBusinessType[] = [
  'restaurant', 'cafe', 'bar', 'hotel', 'resort', 'conference_venue',
]

function toBusinessType(raw: string | null | undefined): ExperienceBusinessType {
  const normalized = (raw || '').toLowerCase().replace(/[\s-]+/g, '_')
  return (KNOWN_BUSINESS_TYPES as string[]).includes(normalized)
    ? (normalized as ExperienceBusinessType)
    : 'restaurant'
}

/**
 * Builds a real-business scene from the business context.
 *
 * The visual layer (poster, hotspot anchors, camera framing) reuses the demo
 * scene's proven layout — per-business scenes become configurable later.
 * What changes is the DATA: name, stats, and action availability all come
 * from the real business, and actions only appear when the business actually
 * supports them.
 */
export function buildSceneForBusiness(biz: ExperienceBusinessShape): ExperienceScene {
  const demo = Object.fromEntries(DEMO_RESTAURANT_SCENE.hotspots.map((h) => [h.id, h]))
  const canOrder = biz.qrInVenue || biz.qrRemote
  const menuAction: ExperienceAction = { label: 'Browse Menu', type: 'OPEN_MENU' }
  const exploreAction: ExperienceAction = { label: 'Explore Business', type: 'OPEN_BUSINESS_INFO' }
  const reserveAction: ExperienceAction = { label: 'Reserve Table', type: 'OPEN_RESERVATION' }
  const overrides = biz.areaOverrides || {}

  const hotspots: ExperienceHotspot[] = [
    {
      ...demo.entrance,
      actions: [exploreAction, { label: 'Get Directions', type: 'OPEN_DIRECTIONS' }],
    },
    {
      ...demo['dining-area'],
      stats: biz.tableCount > 0
        ? [{ label: 'Tables', value: String(biz.tableCount) }]
        : [{ label: 'Seating', value: 'Indoor dining' }],
      actions: biz.hasMenu ? [menuAction, reserveAction] : [exploreAction],
    },
    { ...demo.kitchen }, // staff/customer split is enforced by requiresStaff + server auth
    {
      ...demo.bar,
      actions: [
        biz.hasDrinks
          ? { label: 'View Drinks', type: 'OPEN_MENU_CATEGORY', payload: { category: 'drinks' } }
          : biz.hasMenu
            ? menuAction
            : exploreAction,
        ...(canOrder ? [{ label: 'Order Now', type: 'OPEN_ORDER' } as ExperienceAction] : []),
      ],
    },
    {
      ...demo.terrace,
      actions: [
        biz.hasMenu
          ? { label: 'Explore Tables', type: 'OPEN_MENU' }
          : exploreAction,
        reserveAction,
      ],
    },
  ]

  return {
    id: `business-${biz.businessId}`,
    businessId: biz.businessId,
    businessName: biz.name,
    businessType: toBusinessType(biz.businessType),
    posterImage: biz.coverImageUrl || DEMO_RESTAURANT_SCENE.posterImage,
    hotspots: hotspots
      .filter((h) => overrides[h.id]?.enabled !== false)
      .map((h) => {
        const o = overrides[h.id]
        if (!o) return h
        return {
          ...h,
          label: o.label ?? h.label,
          description: o.description ?? h.description,
        }
      }),
  }
}
