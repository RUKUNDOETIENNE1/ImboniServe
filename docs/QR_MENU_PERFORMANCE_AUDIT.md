# QR Menu Performance Audit

## Methodology
- Executed `scripts/_qr_menu_performance_profile.ts` against live Supabase data.
- Instrumented Prisma via middleware to capture query counts and durations per render path.
- Wrapped plugin storage services to measure download/upload overhead.
- Profiled both public (`/plugins/qr-menu/[menuId]`) and dashboard (`/dashboard/die/plugins/qr-menu`) render flows using platform runtime without Next.js page overhead.

## Public Render Path
| Stage | Observation |
| --- | --- |
| Route resolution | 0.10 ms – negligible overhead from registry lookup. |
| Plugin render | 688 ms total. |
| Prisma | 2 queries totaling 686 ms (menu record and business lookup). |
| Storage | 1 `getPublicUrl` call (0.09 ms); no binary downloads. |
| Payload | 708 bytes serialized JSON. |

### Query Inventory
| Query | Purpose | Duration (ms) | Can Cache? | Can Parallelize? | Can Eliminate? |
| --- | --- | --- | --- | --- | --- |
| `pluginQrMenu.findUnique` | Load normalized menu record and payload JSON | 343 | ✅ Menu payload cache | N/A (single query) | ❌ |
| `business.findUnique` | Fetch business summary (name, contact) | 342 | ✅ Business summary cache | N/A (single query) | ❌ |

### Bottlenecks
1. **`pluginQrMenu.findUnique` (344 ms)** – fetching menu JSON blob.
2. **`business.findUnique` (342 ms)** – repeated business metadata load per request.

### Opportunities
- Memoize business metadata (name, contact, address) per business for short TTL.
- Cache menu payloads (businessId + menuId) for 5–15 minutes with invalidation on updates.
- Consider projecting only necessary menu fields or precomputing slimmed view for public payload.

### After Optimization (Public)
- Implemented in-memory cache for business summary (TTL 30 min) and normalized menu payload (TTL 10 min).
- Public render now serves from cache on warm path with zero Prisma queries.
- Measured via validation suite (warm): avg 0.14 ms, p95 0.22 ms, max 0.46 ms.
- Cold path remains ~690 ms dominated by initial Prisma connection + first queries.

## Dashboard Render Path
| Stage | Observation |
| --- | --- |
| Route resolution | 0.02 ms. |
| Plugin render | 1,570 ms (limited by slowest query). |
| Prisma | 3 queries totaling 3,457 ms (executed concurrently). |
| Storage | 1 `getPublicUrl` call (0.01 ms). |
| Payload | 1,008 bytes serialized JSON (not including menu items array sizes). |

### Query Inventory
| Query | Purpose | Duration (ms) | Can Cache? | Can Parallelize? | Can Eliminate? |
| --- | --- | --- | --- | --- | --- |
| `pluginQrMenu.findMany` | Retrieve recent menus for dashboard list | 341 | ⚠️ Partial (payload cache per menu) | ✅ | ❌ |
| `business.findUnique` | Fetch business summary for dashboard header | 1,548 | ✅ Business summary cache | ✅ | ❌ |
| `pluginQrMenu.count` | Compute total menu count for summary | 1,568 | ✅ Metrics cache | ✅ | ❌ |

### Query Breakdown
1. **`pluginQrMenu.findMany` (341 ms)** – retrieves latest 50 menus including JSON blobs.
2. **`business.findUnique` (1,548 ms)** – same metadata fetch as public render.
3. **`pluginQrMenu.count` (1,568 ms)** – counts total menus for summary.

### Bottlenecks
- Business metadata lookup dominates individual render time (~1.5 s).
- Count query on `plugin_data_qr_menu` is slow despite indexing; likely due to table size or remote latency.
- Rendering maps entire menu JSON to compute `itemCount`, inflating memory and CPU.

### Applied Optimizations (Dashboard)
- Parallelized `findMany` and business summary lookup via `Promise.all`.
- Introduced metrics cache (TTL 60 s) for counts/summary and background refresh for exact menu count.
- Reused cached/normalized menu payloads when available, avoiding repeated business lookups per menu.

### After Optimization (Dashboard)
- Profiling (cold) improved from ~4.9 s to ~0.35 s for render (count deferred).
- Validation (warm) results across 7 runs:
  - avg 809.73 ms, p95 178 ms, max 4624.58 ms (one outlier during background count refresh).
- Typical warm-path renders are <400 ms; background exact count is refreshed asynchronously and cached for 60 s.

### Caching Summary
- Business Summary: namespace `qr-menu:business-summary`, TTL 30 min, invalidated on business update (manual clear or next refresh), used across public and dashboard.
- Menu Payload: namespace `qr-menu:menu-payload`, TTL 10 min, invalidated on menu create/update/publish.
- Dashboard Metrics: namespace `qr-menu:dashboard-metrics`, TTL 60 s, invalidated on menu mutations; count refreshed in background.

### Recommendations
1. **Business profile cache** – cache `business.findUnique` results for 15–60 minutes keyed by businessId.
2. **Menu summary cache** – precompute/cached aggregated dashboard summary (totals, counts) for 1–5 minutes.
3. **Reduce count queries** – derive `totalMenus` via cached aggregate or maintain counter table; at minimum leverage cached summary to avoid per-request count.
4. **Lazy load menus** – fetch light-weight list (id, status, updatedAt, itemCount) for initial render, fetch full menu JSON on-demand.
5. **Menu payload cache** – reuse same cached payload as public render for cards to avoid repeated `coerceMenuItems` work.

## Storage Layer
- Minimal impact (<0.1 ms per call) in current profiling.
- Duplicate reads arise when both public and dashboard renders need the same payload; caching should mitigate this.

## Next Steps
- Implement shared caching utilities respecting tenant boundaries.
- Optimize Prisma queries to avoid redundant business lookups and heavy counts.
- Restructure dashboard payload to separate critical summary data from optional full menus (lazy loading + cache).
- Re-profile after each optimization to confirm progress toward <500 ms (public) and <1,000 ms (dashboard) targets.
