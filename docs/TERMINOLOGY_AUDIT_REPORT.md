# Terminology Audit Report — ImboniServe v1.0
Date: 2026-07-30
Scope: Public website + shared UI primitives + authentication pages + error pages (pass 2)
Owners: Localization

## Summary
- Applied the Localization Consistency & Terminology Standardization Sprint (LCTSS) across public pages and shared marketplace UI.
- Resolved RW inconsistencies for Reservations, Orders, Suppliers, Café.
- Verified FR terms align with the guide (Réservation, Serveur, Cuisine, etc.).
- Preserved brand and industry terms as required.
- Pass 2: Completed localization of all remaining hardcoded strings in public-facing TSX pages.
- Pass 2: Fixed remaining RW terminology violations (Commande, kafe/kafé, ibikoresho in supplier context).
- Pass 2: Flagged FR "Inventaire" vs "Stocks" discrepancy as a pending decision.

## Findings and Corrections
- RW: Reservation
  - Inconsistencies: “reservations”, “reservation” used in several places.
  - Action: Standardized to “Rezerivasiyo” for labels, titles, and descriptions.
- RW: Order
  - Inconsistencies: “Commande”, “ama commande”, mixed.
  - Action: Standardized to “Komande” everywhere; removed “ama commande”. Updated dashboard metrics, hero, analytics, RT sections, and unified orders.
- RW: Supplier
  - Inconsistencies: “Abatanga ibikoresho”, “Umutangabicuruzwa”.
  - Action: Standardized to “Utanga/Abatanga ibikorenerwa”. Updated marketplace and pricing features text.
- RW: Café
  - Inconsistencies: “kafe/kafé”.
  - Action: Standardized to “Kafeyi”. Updated discovery/search and pricing plan descriptions.
- RW: Kitchen Display System feature
  - Inconsistencies: “ama commande”.
  - Action: “komande”.
- RW: Supplier Portal feature
  - Inconsistencies: “abatanga ibikoresho”.
  - Action: “abatanga ibikorenerwa”.

## Pages/Areas Touched (initial)
- Features pages (Operations, AI, Analytics, Finance, Growth, Infrastructure) via new locale keys.
- Homepage hero slides, features sections, RT section.
- Marketplace common strings (cart/checkout, supplier locations, store copy).
- Pricing highlights keys to prevent fallback leaks.
- Dashboard labels and metrics (total orders, unified orders).

## Outstanding Items (to complete in next pass)
- Authentication: ensure OTP, reset-password, email verification use approved terms. ✅ Done in pass 2.
- Emails/Notifications templates: audit for RW "Commande/Order", "Reservation", supplier text.
- Reports module: verify all metric labels adopt "Komande".
- Content outside public pages (e.g., internal modals, toasts) to be scanned.
- FR "Inventaire" vs "Stocks": 20+ keys use "Inventaire" but guide says "Stocks". Decision pending.

## Pass 2 Findings and Corrections (2026-07-30)
- RW: Order (residual)
  - Inconsistencies: "Commande" remained in kitchen, qr_analytics, peak_hours, instruction_insights, payment_analytics, feedback_analytics, qr builder sections.
  - Action: All instances replaced with "Komande"/"komande".
- RW: Café (residual)
  - Inconsistencies: "kafe" and "kafé" in discovery, homepage, pricing, site builder, plan descriptions, category label.
  - Action: All instances replaced with "kafeyi".
- RW: Supplier (residual)
  - Inconsistencies: "ibikoresho" used in supplier/procurement context (store badge/title, procurement workflow, procurement market nav).
  - Action: Replaced with "ibikorenerwa" in supplier context only. General "ibikoresho" (tools/devices) left unchanged.
- Hardcoded strings: Found and localized in `forgot-password.tsx`, `reset-password.tsx`, `500.tsx`, `_error.tsx`, `welcome.tsx`, `PublicLayout.tsx`.
- FR: Inventory
  - Discrepancy: Guide specifies "Stocks" but locale uses "Inventaire" consistently (20+ keys).
  - Action: Flagged as pending decision. No changes made pending product input.

## Risk/Impact
- Low risk; string changes only. Improved clarity and consistency for RW users.

## Sign-off Checklist
- [x] No mixed-language variants remain in touched pages.
- [x] No fallback keys exposed.
- [x] Brand/product names unchanged.
- [x] Industry-standard terms preserved.

## Approvals
- Product: __________  Date: ______
- Localization: ______  Date: ______
