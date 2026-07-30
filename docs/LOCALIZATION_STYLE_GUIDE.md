# ImboniServe Localization Style Guide (v1.0)

Last updated: 2026-07-29
Owners: Product, Design, Localization
Applies to: Public website, Authentication, Dashboard, Core Operations, AI, Notifications, Emails, Docs, Marketing, Help, Future dev

## Purpose
Establish a single source of truth for terminology and writing style in English (EN), French (FR), and Kinyarwanda (RW). Consistency, clarity, and natural language for hospitality operators come first.

## Core Principles
- Consistency over literal translation.
- Use industry-standard terms (AI, CRM, POS, QR Code, Dashboard) without translation unless an accepted equivalent exists.
- Never translate product/brand names (ImboniServe, Service Replay™, Smart Dining Slips™).
- RW should read naturally to hospitality professionals; avoid awkward calques.
- Prefer short, clear sentences; front-load meaning.
- Keep tone professional, modern, and trustworthy.

## Approved Terminology (Authoritative)
| English | French | Kinyarwanda | Decision |
| --- | --- | --- | --- |
| Hospitality Business | Entreprise d'hôtellerie | Ubucuruzi bwo kwakira abantu | Translate |
| Hotel | Hôtel | Hoteli | Translate |
| Restaurant | Restaurant | Resitora | Translate |
| Café | Café | Kafeyi | Translate |
| Guest / Customer | Client | Umukiriya | Translate |
| Table | Table | Ameza | Translate |
| Waiter / Server | Serveur | Umukozi utanga serivisi | Translate |
| Kitchen | Cuisine | Igikoni | Translate |
| Reservation | Réservation | Rezerivasiyo | Translate |
| Order | Commande | Komande | Translate |
| Menu | Menu | Menu | Keep (industry standard) |
| Inventory | Stocks | Ububiko | Translate |
| Recipe | Recette | Recipe / Uburyo bwo guteka | Keep (industry/common) |
| Supplier | Fournisseur | Utanga/Abatanga ibikorenerwa | Translate |
| Invoice | Facture | Inyemezabuguzi | Translate |
| Payment | Paiement | Ubwishyu | Translate |
| Dashboard | Tableau de bord | Dashboard | Keep (pro usage) |
| CRM | CRM | CRM | Keep (industry) |
| QR Code | QR Code | QR Code | Keep (global) |
| AI | IA | AI | Keep (industry) |
| POS | POS | POS | Keep (industry) |
| Service Replay™ | Service Replay™ | Service Replay™ | Keep (product) |
| Smart Dining Slips™ | Smart Dining Slips™ | Smart Dining Slips™ | Keep (product) |
| AI Menu Builder | Générateur de menus IA | AI Menu Builder | Keep (product; optional subtitle) |
| CFO Dashboard | Tableau de bord CFO | CFO Dashboard | Keep role acronym |
| CEO Dashboard | Tableau de bord CEO | CEO Dashboard | Keep role acronym |
| Auto-Reorder AI | Réapprovisionnement IA automatique | Auto-Reorder AI | Keep product (add descriptive text if needed) |
| QR Ordering | Commande par QR Code | Komande ukoresheje QR Code | Translate, preserve "QR Code" |
| WhatsApp Campaigns | Campagnes WhatsApp | Ubukangurambaga bwa WhatsApp | Translate, preserve "WhatsApp" |

Notes
- RW Supplier: singular “Utanga ibikorenerwa”, plural “Abatanga ibikorenerwa”.
- RW Order: always “Komande”; avoid “Commande”.
- RW Reservation: always “Rezerivasiyo”; avoid mixed English/RW.
- RW Café: always “Kafeyi”; avoid “kafe/kafé”.

## Writing Style
- Be direct and actionable. Prefer verbs: “Track, Plan, Reconcile” over nominalizations.
- Avoid slang and idioms.
- Keep sentence length ~8–18 words.
- Use present tense for UI labels. Use imperative for CTAs.
- Capitalization:
  - EN: Sentence case for body; Title case for headings when already used.
  - FR: Sentence case; accents preserved.
  - RW: Sentence case; product names capitalized; acronyms uppercase.
- Numerals and units: Use locale formatting and spacing. Keep currency and date formats per locale.
- Placeholders: Use double curly braces {{var}} and provide translated surrounding text. Do not translate variable names.

## Brand & Product Names
- Never localize or modify brand/product names.
- Trademark symbols (™) retained as authored.

## Accessibility & Metadata
- Localize ARIA labels, alt text, titles, meta descriptions, and OpenGraph.
- Avoid exposing translation keys or fallback keys.

## Implementation Guardrails
- No hardcoded customer-facing strings in code. Use i18n keys.
- Prefer stable, explicit keys (e.g., features_*, pricing.feature_*).
- Use `t(key, explicitFallback?, params?)` consistently.
- When adding terms covered here, reuse terminology exactly.

## Examples (RW)
- Correct: “Fungura komande”, Incorrect: “Fungura ama commande”
- Correct: “Gucunga rezerivasiyo”, Incorrect: “Gucunga reservations”
- Correct: “Kafeyi”, Incorrect: “Kafe”
- Correct: “Abatanga ibikorenerwa”, Incorrect: “Abatanga ibikoresho”

## Change Management
- All changes to this guide require Product + Localization approval.
- Update locale files and run terminology audit checks before merging.
