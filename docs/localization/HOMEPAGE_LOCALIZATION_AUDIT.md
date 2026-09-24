# Homepage Localization Audit Report

**Date:** 2026-07-31  
**Source File:** `src/pages/index.tsx`  
**Layout File:** `src/components/PublicLayout.tsx`  
**Locale Files:** `src/locales/en.json`, `src/locales/fr.json`, `src/locales/rw.json`, `src/locales/VERIFIED_KINYARWANDA_TERMBASE.json`

---

## Summary

| Metric | Count |
|---|---|
| Total unique `t()` keys used in `index.tsx` | 195 |
| Total visible text strings (homepage) | 195 |
| Hardcoded JSX text (after refactor) | **0** |
| Hardcoded const-array fallback defaults | 40 (dead code + fallback pattern — not rendered directly) |
| Keys in `en.json` homepage section | 293 |
| Keys in `fr.json` homepage section | 243 |
| Keys in `rw.json` homepage section | 243 |
| Keys in `VERIFIED_KINYARWANDA_TERMBASE.json` homepage section | 75 |
| **Missing from `en.json` (after refactor)** | **0** |
| **Missing from `fr.json`** | **51** |
| **Missing from `rw.json`** | **51** |
| **Missing from termbase** | **166** |
| `en.json` homepage keys not used in `index.tsx` | 99 (legacy/unused keys) |

---

## Localization Status

### Fully Localized (en + fr + rw)
- 243 keys exist in all three runtime locale files (en, fr, rw)
- All visible homepage text is wrapped in `t()` calls with fallback strings

### Missing from fr.json and rw.json (51 keys)
These keys were added to `en.json` during this audit but are absent from `fr.json` and `rw.json`. They require manual translation:

| Section | Keys Missing |
|---|---|
| `homepage.growth` | `replay_title`, `replay_desc`, `replay_cta` |
| `homepage.advanced` | `service_replay`, `service_replay_desc`, `inventory_alerts`, `inventory_alerts_desc`, `smart_slips`, `smart_slips_desc` |
| `homepage.why_switch` | `replay_cta`, `crm_cta`, `ab_cta` |
| `homepage.video` | `alt` |
| `homepage.stats` | `plans` |
| `homepage.pricing_preview` | `heading`, `subtitle`, `starting_at`, `per_month`, `starter_desc`, `annual_savings`, `scale`, `all_plans_include`, `feature_1`, `feature_2`, `feature_3`, `feature_4`, `enterprise_note`, `founding_note`, `founding_link`, `view_full_pricing`, `help`, `chat` |
| `homepage.founding_program` | `badge`, `title`, `subtitle`, `benefit_1_title`, `benefit_1_desc`, `benefit_2_title`, `benefit_2_desc`, `benefit_3_title`, `benefit_3_desc`, `benefit_4_title`, `benefit_4_desc`, `limited`, `cta`, `learn_more` |
| `homepage.discovery` | `feature_posts`, `feature_media`, `feature_promos`, `feature_attribution` |
| `home.title_page` | `title_page` |

### Missing from VERIFIED_KINYARWANDA_TERMBASE.json (166 keys)
The termbase is a curated translation database, not a full mirror of `en.json`. It contains 75 homepage keys out of 293. The 166 missing keys include all 51 keys missing from `fr.json`/`rw.json` plus 115 keys that exist in `fr.json`/`rw.json` but were never added to the termbase. The termbase is updated via the sync script (`scripts/sync_rw_with_termbase.js`).

---

## Refactored Components

### `src/pages/index.tsx`
1. **`advancedFeatures` const** — Moved from module-level (hardcoded strings) into the component body. All 6 items now use `t()` calls:
   - 3 items mapped to existing keys: `homepage.advanced.ai_menu`, `homepage.advanced.marketplace`, `homepage.advanced.referral`
   - 3 items use new keys: `homepage.advanced.service_replay`, `homepage.advanced.inventory_alerts`, `homepage.advanced.smart_slips`
2. **Video thumbnail `alt` text** — Replaced hardcoded `"Imboni Serve Demo Video"` with `t('homepage.video.alt', 'Imboni Serve Demo Video')`
3. **`<PublicLayout>` title** — Already used `t('home.title_page', ...)` — key added to `en.json` under `home.title_page`

### `src/components/PublicLayout.tsx`
- **No changes needed** — All visible text already uses `t()` calls with fallback strings

---

## Dead Code (Not Rendered)

The `features` const array (lines 54–115 in `index.tsx`) contains 20 hardcoded string entries but is **never rendered** — the features section is rendered with inline `t()` calls instead. This is dead code and could be removed in a future cleanup.

The `heroSlides` const array contains 20 hardcoded string entries used as **fallback defaults** in `t()` template literal calls like `t(\`homepage.hero.slides.${s.key}.title\`, s.title)`. This is the correct localization pattern — the hardcoded values serve as fallbacks only.

---

## Deduplication Verification

- All 51 new keys were verified against `en.json`, `fr.json`, `rw.json`, and `VERIFIED_KINYARWANDA_TERMBASE.json` before addition
- **Zero duplicate keys** were introduced
- Keys were only added to `en.json` — `fr.json`, `rw.json`, and the termbase were **not modified**

---

## en.json Additions (51 keys)

### `home` namespace (1 key)
- `home.title_page` = "Imboni Serve — Hospitality Operating System"

### `homepage` namespace (50 keys)
- `homepage.discovery.feature_posts`, `feature_media`, `feature_promos`, `feature_attribution`
- `homepage.founding_program.*` (14 keys: badge, title, subtitle, 4×benefit_title/desc, limited, cta, learn_more)
- `homepage.growth.replay_title`, `replay_desc`, `replay_cta`
- `homepage.pricing_preview.*` (18 keys: heading, subtitle, starting_at, per_month, starter_desc, annual_savings, scale, all_plans_include, 4×feature, enterprise_note, founding_note, founding_link, view_full_pricing, help, chat)
- `homepage.stats.plans`
- `homepage.why_switch.ab_cta`, `crm_cta`, `replay_cta`
- `homepage.advanced.service_replay`, `service_replay_desc`, `inventory_alerts`, `inventory_alerts_desc`, `smart_slips`, `smart_slips_desc`
- `homepage.video.alt`

---

## Unused en.json Homepage Keys (99 keys)

These keys exist in `en.json` under `homepage` but are not referenced by any `t()` call in `index.tsx`. They may be used by other pages or are legacy:

- `homepage.advanced.*` (12 keys: business_intelligence, hotel_mode, marketplace, multi_branch, procurement, site_builder, staff — each with _desc)
- `homepage.cta.create_account`, `cta.ready`
- `homepage.discovery.feature_customers`, `feature_growth`, `feature_orders`, `feature_visibility`
- `homepage.features.loyalty`, `loyalty_desc`, `multi_branch`, `multi_branch_desc`
- `homepage.footer.*` (12 keys)
- `homepage.growth.badge`, `title`, `voice_cta`, `voice_desc`, `voice_title`
- `homepage.hero.cta_explore`, `launch_badge`, `slides.0–3.*` (16 keys), `slides.analytics/os/platform/qr/replay.*` (20 keys), `subtitle`, `title`, `title_highlight`
- `homepage.nav_tagline`
- `homepage.payments.cards`, `cash`, `digital_wallets`, `mobile_money`
- `homepage.pricing.*` (8 keys)
- `homepage.stats.businesses`
- `homepage.store.*` (5 keys)

---

## Deliverables

| File | Description |
|---|---|
| `docs/localization/HOMEPAGE_LOCALIZATION_GAPS.json` | 51 missing English strings in en.json structure, ready for manual translation |
| `docs/localization/HOMEPAGE_LOCALIZATION_AUDIT.md` | This audit report |

## Next Steps

1. **User manually translates** the 51 English strings in `HOMEPAGE_LOCALIZATION_GAPS.json` into French and Kinyarwanda
2. **Merge translations** into `fr.json` and `rw.json` (or termbase, then sync)
3. **Run sync script**: `node scripts/sync_rw_with_termbase.js` to propagate termbase translations to `rw.json`
4. **Validate** all locale files have matching key sets
5. **Remove dead code**: The unused `features` const array in `index.tsx`
