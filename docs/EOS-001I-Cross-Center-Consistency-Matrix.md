# EOS-001I Cross-Center Consistency Matrix

## Assessment: CONSISTENT

All 7 Executive Operating Centers follow consistent patterns. This matrix documents the exact state of consistency across all centers.

---

## Consistency Matrix

### Architecture Patterns

| Pattern | CEO | CFO | COO | CMO | PD | CSD | EI |
|---------|-----|-----|-----|-----|----|----|----|
| API method check (405) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| API session check (401) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| API role check (403) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| API generatedAt field | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| API error format {error} | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page SSR auth guard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page role redirect | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page useCallback fetch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page useState (data/loading/error) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page AdminLayout wrapper | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page error retry button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Component Patterns

| Pattern | Count | Consistency |
|---------|-------|-------------|
| rounded-2xl container | 68/68 | 100% |
| border-slate-200 (or variant) | 68/68 | 100% |
| bg-white (or gradient) | 68/68 | 100% |
| Header: icon w-5 h-5 + h3 text-base font-bold | 68/68 | 100% |
| Loading: animate-pulse skeleton | 68/68 | 100% |
| Empty: text-sm text-slate-400 (or emerald positive) | 68/68 | 100% |
| onNavigate prop for drill-down | 52/68 | 76% (briefs/focus cards don't need it) |
| loading prop | 68/68 | 100% |

### Severity Color Scheme

| Severity | Color | Badge | Used In |
|----------|-------|-------|---------|
| CRITICAL | text-red-600 | bg-red-100 text-red-700 | All attention centers, decisions, risks, priority queue |
| HIGH | text-orange-600 | bg-orange-100 text-orange-700 | All attention centers, decisions, risks, priority queue |
| MEDIUM | text-amber-600 | bg-amber-100 text-amber-700 | All attention centers, decisions, risks, priority queue |
| LOW | text-blue-600 | bg-blue-100 text-blue-700 | All attention centers, decisions, risks, priority queue |

**Verdict**: 100% consistent across all components.

### Health Score Scale

| Range | Status | Color | Used In |
|-------|--------|-------|---------|
| ≥70 | HEALTHY | emerald | All pulse/health components |
| ≥40 | WARNING | amber | All pulse/health components |
| <40 | CRITICAL | red | All pulse/health components |

**Verdict**: 100% consistent.

---

## Role Permission Matrix

| Center | API Roles | SSR Roles | EXECUTIVE? |
|--------|-----------|-----------|------------|
| CEO | CEO, ADMIN, EXECUTIVE | CEO, ADMIN, EXECUTIVE | ✓ |
| CFO | CFO, ADMIN, FINANCE, EXECUTIVE | CFO, ADMIN, FINANCE, EXECUTIVE | ✓ |
| COO | COO, ADMIN, OPERATIONS_MANAGER, EXECUTIVE | COO, ADMIN, OPERATIONS_MANAGER, EXECUTIVE | ✓ |
| CMO | CMO, ADMIN, EXECUTIVE | CMO, ADMIN, EXECUTIVE | ✓ |
| Partnership Director | PARTNERSHIP_DIRECTOR, ADMIN, PARTNERSHIP_MANAGER, EXECUTIVE | PARTNERSHIP_DIRECTOR, ADMIN, PARTNERSHIP_MANAGER, EXECUTIVE | ✓ |
| Customer Success Director | CUSTOMER_SUCCESS_DIRECTOR, ADMIN, CUSTOMER_SUCCESS_MANAGER, EXECUTIVE | CUSTOMER_SUCCESS_DIRECTOR, ADMIN, CUSTOMER_SUCCESS_MANAGER, EXECUTIVE | ✓ |
| Executive Intelligence | CEO, ADMIN, EXECUTIVE | CEO, ADMIN, EXECUTIVE | ✓ |

**Verdict**: EXECUTIVE role accepted by all 7 centers. API and SSR roles match perfectly for each center.

---

## Navigation Consistency

| Item | Sidebar Label | Icon | Route |
|------|--------------|------|-------|
| CEO | CEO Command Center | Crown | /admin/executive/ceo |
| CFO | CFO Command Center | Landmark | /admin/executive/cfo |
| COO | COO Command Center | Activity | /admin/executive/coo |
| CMO | CMO Command Center | Megaphone | /admin/executive/cmo |
| Partnership | Partnership Command Center | Network | /admin/executive/partnership-director |
| Customer Success | Customer Success Center | Heart | /admin/executive/customer-success-director |
| Intelligence | Executive Intelligence | Brain | /admin/executive/executive-intelligence |

**Verdict**: All 7 centers in sidebar, grouped at top, consistent naming pattern.

---

## Deviations (Non-Blocking)

| Deviation | Impact | Recommendation |
|-----------|--------|----------------|
| 3 error UI patterns | Cosmetic | Standardize in future phase |
| CFO timestamp in header (not footer) | Cosmetic | Acceptable variation |
| CEO greeting in FocusCard (not header) | Cosmetic | Intentional design |
| Page wrapper class variations | Cosmetic | Standardize in future phase |
| SSR session check pattern (2 variants) | None (both secure) | Standardize in future phase |
| CFO 403 message differs | None | Standardize in future phase |

**None of these deviations block operational readiness.**
