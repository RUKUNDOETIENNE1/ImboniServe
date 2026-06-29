# QR Menu AI Platform v2 — Domain Audit

This audit documents the current QR Menu plugin implementation and render flows to inform the AI v2 architecture. No code changes were made for this phase.

## Sources
- src/lib/die/plugins/built-in/qr-menu.plugin.ts (857 LOC)

## Current Data Structures

- MenuItem (runtime interface)
  - name: string
  - price: number
  - category: string

- BusinessSummary (derived via Prisma Business)
  - id: string
  - name: string
  - address?: string | null
  - city?: string | null
  - country?: string | null
  - phone?: string | null
  - whatsapp?: string | null

- QRMenuPublicPayload (rendered to public/dashboard and API)
  - menuId: string
  - business: { id, name, address?, phone?, whatsapp? } | null
  - menuItems: MenuItem[]
  - publicUrl: string
  - qrCodeUrl: string | null
  - qrCodeStorageKey: string
  - jsonStorageKey: string
  - status: string
  - updatedAt: string (ISO)
  - createdAt: string (ISO)

- QRMenuDashboardPayload
  - business: QRMenuPublicPayload['business']
  - summary: { totalMenus: number, totalItems: number, publishedMenus: number, lastUpdatedAt: string | null }
  - menus: Array<QRMenuPublicPayload & { itemCount: number }>

- Prisma entity (plugin_data_qr_menu via Prisma any):
  - id, businessId, menuItems (jsonb), qrCodeStorageKey, jsonStorageKey, publicUrl, sourceDocumentId?, sourceScanJobId?, sourceFileKey, status, createdAt, updatedAt

## Current Menu Structure
- Items are parsed from OCR/text lines using `parseMenuLines(text)`.
- Headings (all-caps lines without digits) set the current category via `normalizeCategory`.
- Items are detected from lines ending with a numeric price (supports RWF/FRW labels, commas/dots).
- Deduplication: last occurrence wins unless prior price is higher; capped to 200 items.
- Coercion from stored JSON uses `coerceMenuItems` for type safety and defaults.

## Category Structure
- Category is a normalized string label attached to each item.
- Default category is `General` until a heading is encountered.
- No hierarchical categories; flat grouping by label.

## Item Structure
- Minimal schema: `name`, `price`, `category`.
- No explicit `id` per item; identity inferred by `{category::name}` composite key in parsing.
- No descriptions today; no images per item.
- Price is numeric; parsing rounds to 2 decimals.

## Image Structure
- QR code image is generated per menu (`qr.png`) and persisted via storage adapter.
- No per-item images; no gallery/cover image for the menu.

## Pricing Structure
- Price extracted from trailing numeric tokens; supports RWF suffix and variants.
- No currency normalization or multi-currency today; price is a number without currency code.
- `pricingInsights` placeholder exists in `MenuEnhancementResult` but unused.

## Public Render Flow
- Route: `/plugins/qr-menu/[menuId]` (`qr-menu.public.detail`).
- Steps:
  1. Resolve `menuId` from params.
  2. Resolve/calc payload via `resolveMenuPayload` with in-memory cache (TTL 10 min).
  3. Validate business guard if present (plugin is businessScoped but public route permits view).
  4. Return `{ type: 'props', props: { data: QRMenuPublicPayload }, headers: Cache-Control }`.
- Caching:
  - Menu payload cache keyed by `menuId` (includes business summary within payload object).
  - Business summary cache (TTL 30 min) reused across contexts.

## Dashboard Render Flow
- Route: `/dashboard/die/plugins/qr-menu` (`qr-menu.dashboard.overview`).
- Steps:
  1. Enforce `businessId` (guard: business).
  2. Parallel fetch: recent menus (findMany), business summary (cached), then build each card payload using cached/normalized payloads.
  3. Metrics assembled: totalMenus (cached/approx), totalItems, publishedMenus, lastUpdatedAt.
  4. Exact total count updated in the background and cached for 60s.
  5. Return `{ type: 'props', props: { data: QRMenuDashboardPayload } }`.
- Caching & invalidation:
  - Dashboard metrics cache 60s; invalidated on menu mutation.
  - Menu payload cache 10 min; invalidated on menu mutation.
  - Business summary 30 min; shared.

## Extensibility Hooks Present
- `applyAiEnhancements` placeholder for enrichment (translations, pricing insights, branding).
- Storage abstraction used for reading/writing JSON and QR image; supports future asset types.
- Route manifest supports adding dashboard widgets under plugin dashboard path.

## Constraints To Preserve
- Business isolation via `businessScoped: true` and runtime context.
- Existing URLs for public, API, and dashboard routes.
- Current performance certification (public <500ms warm, dashboard <1000ms warm p95).
- No raw SQL or schema rewrites.

## Observed Gaps For AI v2
- No multi-language fields (items/categories/descriptions) persisted yet.
- No per-item metadata (ids, images, descriptions, allergens, availability, tags).
- No analytics (views, scans, trends) stored or surfaced; to be added in business scope.
- No pricing intelligence or health scoring computed yet; placeholders exist.
- Branding data partially available from Business, not normalized for scoring.

## Recommendations For Phase 2 Architecture
- Introduce service layer under `src/lib/die/plugins/built-in/qr-menu-ai/` to host intelligence modules (no DB schema changes initially):
  - `MenuIntelligenceService`
  - `MenuHealthService`
  - `MenuAnalyticsService`
  - `PricingIntelligenceService`
  - `BrandingIntelligenceService`
  - `LanguageIntelligenceService`
- Services should consume existing payloads and produce derived insights cached via the existing in-memory cache or dedicated namespaces.
- Add dashboard widgets rendering through existing plugin dashboard path; lazy-load heavier analytics with short TTLs.
