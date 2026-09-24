# Translation Decisions — ImboniServe v1.0

A running log of accepted terminology choices and rationale.

Updated: 2026-07-30

## Core Decisions
- Dashboard (RW): Keep “Dashboard”. Reason: Common professional usage; users already familiar.
- AI (RW): Keep “AI”. Reason: Industry standard; avoids confusion.
- POS (RW): Keep “POS”. Reason: Industry standard.
- QR Code (RW): Keep “QR Code”. Reason: Global standard; ubiquitous.
- Service Replay™ / Smart Dining Slips™: Never translate. Reason: Product identity and trademark consistency.
- AI Menu Builder: Keep product name in RW. Optional descriptive subtitle allowed when needed for clarity.
- CFO/CEO Dashboard: Keep “CFO/CEO” acronyms in RW. Reason: Role acronyms are widely recognized.

## Kinyarwanda Specific
- Order → “Komande”. Replace all instances of “Commande/ama commande”.
- Reservation → “Rezerivasiyo”. Replace all instances of “reservations/reservation/Guteganya (when meaning booking)”.
- Supplier → “Utanga/Abatanga ibikorenerwa”. Prefer “ibikorenerwa” over “ibikoresho” for supply context.
- Café → “Kafeyi”. Replace “kafe/kafé”.
- Waiter/Server → “Umukozi utanga serivisi”.
- Kitchen → “Igikoni”.
- Inventory → “Ububiko”.

## French Specific
- Inventory → “Stocks”.
- Reservation → “Réservation”.
- Kitchen → “Cuisine”.
- Waiter → “Serveur”.

## Implementation Notes
- Use stable i18n keys; never hardcode UI strings.
- Prefer existing pricing.feature_* and features_* keys for cross-surface consistency.
- When a product/brand is kept in RW, you may add a short descriptive sentence nearby if clarity warrants it (not part of the title).

## Changes Applied (2026-07-29)
- RW normalization in marketplace/cart/checkout: Commande→Komande; suppliers text.
- RW discovery, homepage hero, RT sections: “kafe”→“kafeyi”; Commande→Komande.
- RW dashboard metrics, unified orders: standardized to Komande.
- RW pricing features: supplier portal and KDS strings aligned.
- Features pages localized with consistent badges/headings and CTA ARIA.

## Changes Applied (2026-07-30 — Pass 2)
- Localized all remaining hardcoded strings in public-facing TSX pages:
  - `forgot-password.tsx`: All UI text wrapped in `t()` calls.
  - `reset-password.tsx`: Added `useTranslation` import; all UI text wrapped in `t()` calls.
  - `500.tsx`: Added `useTranslation`; localized error title, description, and CTA.
  - `_error.tsx`: Added `getTranslation` for SSR; localized error messages.
  - `welcome.tsx`: Localized "Powered by ICTHubs" footer.
  - `PublicLayout.tsx`: Localized SocialShare text in footer.
- RW terminology fixes in `rw.json`:
  - All remaining "Commande"/"commande" → "Komande"/"komande" (kitchen, qr_analytics, peak_hours, instruction_insights, payment_analytics, feedback_analytics, qr builder).
  - All "kafe"/"kafé" → "kafeyi" (discovery, homepage, pricing, site builder, plan descriptions, category label).
  - "ibikoresho" → "ibikorenerwa" in supplier/procurement context (store badge/title, procurement workflow feature, procurement market nav).
- Added 30+ new auth keys (password reset flow) and 6 error keys to all 3 locale files.
- Added `public.footer.share_text` key to all 3 locale files.

## Pending Decisions
- "Recipe": Keep as "Recipe" or use "Uburyo bwo guteka" per context. Will standardize after testing with pilot users.
- FR "Inventaire" vs "Stocks": Translation guide specifies "Stocks" but locale consistently uses "Inventaire" across 20+ keys. Decision needed: update guide to accept "Inventaire" (more common in Rwandan French usage) or migrate all FR inventory labels to "Stocks".
- Any domain-specific terms introduced by new modules will be added here upon first usage.
