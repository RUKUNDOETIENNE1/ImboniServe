# DIE Plugin Platform v1 Architecture

## Overview
- **Goal:** provide a manifest-driven plugin layer for DIE services with strict tenant isolation and unified rendering flows.
- **Core Components:**
  - `PluginRegistry` maintains registered plugins and indexed route tables.
  - `PluginRunner` wires event execution, lifecycle hooks, and scoped service factories.
  - `plugin-platform` runtime resolves manifests, renders public/dashboard routes, and forwards API publish calls.
  - Built-in plugins (currently QR Menu) demonstrate the full lifecycle across trigger execution, rendering, and publishing.

## Plugin Lifecycle
1. **Registration** – Plugins export `DIEPlugin` definitions with lifecycle hooks and manifests. Core plugins are registered once during runner construction.
2. **Install** – Optional async hook for preparing storage or schema changes (e.g., QR Menu ensures backing table).
3. **Bootstrap** – Optional hook to prime caches or metadata.
4. **Execute** – Event-triggered workloads run with scoped services (`prisma`, `logger`, `storage`, `publish`).
5. **Render** – Public and dashboard renders share a unified context signature, returning `props`, `redirect`, or `notFound` outcomes.
6. **Publish** – API routes use the manifest-defined handler to return structured responses.

## Registry Model
- Plugins are frozen on registration to prevent mutation.
- Manifests provide route sets for `public`, `api`, and `dashboard` kinds.
- Each route is indexed by normalized path segments. Duplicate route registration rejects at load time.
- Lookup methods: `get`, `list`, `listByType`, `resolveRoute`, and `resolveByTrigger`.

## Route Model
- Public routes accept `pathSegments`, derive params from `[slug]` segments, and apply guard rules.
- Dashboard routes enforce guards (`business` vs `public`) in addition to plugin `businessScoped` flags.
- API routes match both the normalized path and HTTP method.

## Render Model
- `renderPluginPublicRoute` resolves the manifest entry, creates business-scoped services, and returns a unified render outcome.
- `renderPluginDashboardRoute` builds on the public flow with guard enforcement and rejects missing business context when required.
- Errors within plugin renderers are caught and surfaced as safe `notFound` responses.

## Dashboard Model
- `listDashboardPluginEntries` exposes manifest-defined dashboard routes with metadata for discovery UI consumption.
- Dashboard renders receive the same render context, enabling plugin-controlled props while the host page handles layout and chrome.

## QR Menu Integration
- Manifest defines public, API, and dashboard routes with metadata and icon hints.
- `execute` lifecycle ingests menu uploads, persists artefacts via scoped storage services, and logs metadata.
- Public render resolves menu payloads through the platform and returns SSR props.
- Dashboard render summarizes tenant menus, enforces business guard, and supplies management data.

## Future Plugin Onboarding Flow
1. Define manifest routes and metadata in the new plugin module.
2. Implement lifecycle hooks (`install`, `execute`, `render`, `publish`) using provided services.
3. Export the plugin and add it to `corePlugins` (or register dynamically in deployment code).
4. Provide dashboard/public pages that consume render outcomes instead of direct data access.
5. Add validation cases to the platform suite to assert registration, route resolution, and render correctness for the new plugin.
