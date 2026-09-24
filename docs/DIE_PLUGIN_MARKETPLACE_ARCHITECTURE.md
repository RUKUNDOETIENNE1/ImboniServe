# DIE Plugin Marketplace Architecture v1

This document describes the lightweight marketplace layer built on top of the existing DIE plugin platform without breaking backward compatibility.

## Goals
- Standardize plugin lifecycle (DISCOVERED → REGISTERED → ENABLED → DISABLED)
- Provide discovery, simple install/enable/disable operations
- Prepare for monetization while keeping runtime unchanged
- No schema changes, no raw SQL, no plugin runtime refactor

## Components

- Marketplace Types (`src/lib/die/plugins/marketplace/types.ts`)
  - `PluginMarketplaceEntry`, `PricingModel`, `MarketplaceLifecycleState`
- Marketplace Registry Overlay (`src/lib/die/plugins/marketplace/registry.ts`)
  - In-memory metadata store overlaying the core `PluginRegistry`
  - Registers metadata for core plugins (QR Menu)
  - Tracks lifecycle state (in-memory)
- Marketplace Service (`src/lib/die/plugins/marketplace/plugin-marketplace.service.ts`)
  - Facade providing list/details/install/enable/disable
- API Endpoints
  - `GET /api/die/plugins/marketplace` → list plugins
  - `GET /api/die/plugins/marketplace/:id` → details
  - `POST /api/die/plugins/marketplace/:id/install|enable|disable` → lifecycle ops
- Dashboard UI (minimal): `pages/dashboard/die/marketplace`
  - Lists plugins and allows basic lifecycle actions

## Lifecycle Hooks (Optional)
- `onInstall?()`, `onEnable?()`, `onDisable?()` (optional hooks only)
- Never required; does not change the core plugin interface
- Invoked by marketplace service if present

## QR Menu Registration
- Registered in marketplace with:
  - `category: menu`, `pricingModel: FREE`, `tags: ['qr','restaurant','menu','ordering']`
- No internal changes to QR Menu logic

## Backward Compatibility & Isolation
- The new layer does not alter the `PluginRunner`, `PluginRegistry`, or runtime execution path
- All behavior remains the same for existing plugins
- Marketplace state is in-memory and business-agnostic with future-ready business scoping

## Future Considerations
- Persist marketplace state per business (enablement) without altering plugin contracts
- Integrate billing/entitlement checks when Finance module matures
- Add ratings, usage analytics, and search
- Extend marketplace UI with categories, filters, and plugin detail pages
