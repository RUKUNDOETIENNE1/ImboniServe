# OEC-001D Product Experience Improvement Matrix

## Prioritized Improvements for Product Experience

---

## Improvement Priority Matrix

### Tier 1: Customer #1 Blockers (COMPLETED)

| # | Improvement | Effort | Impact | Status |
|---|-------------|--------|--------|--------|
| 1 | Replace alert() with showToast() on customer-facing pages | Medium | Critical | ✅ Complete |
| 2 | Replace alert() with showToast() on admin/portal pages | Medium | High | ✅ Complete |

### Tier 2: Pre-Launch Improvements

| # | Improvement | Effort | Impact | Priority |
|---|-------------|--------|--------|----------|
| 3 | Fix gold color contrast (UX-HIGH-001) | Low | High | HIGH |
| 4 | Add skip-to-content links (UX-HIGH-002) | Low | High | HIGH |
| 5 | Create shared Modal with accessibility (UX-HIGH-003) | Medium | High | HIGH |
| 6 | Create shared Table component (UX-MED-001) | Medium | Medium | MEDIUM |
| 7 | Replace prompt() with modal forms (UX-MED-006) | Medium | Medium | MEDIUM |
| 8 | Add guided tours (UX-MED-003) | High | Medium | MEDIUM |
| 9 | Add breadcrumbs (UX-MED-004) | Low | Medium | MEDIUM |
| 10 | Increase touch targets to 44px (UX-MED-005) | Low | Medium | MEDIUM |

### Tier 3: Post-Launch Evolution

| # | Improvement | Effort | Impact | Priority |
|---|-------------|--------|--------|----------|
| 11 | Standardize terminology (UX-LOW-001) | Medium | Medium | LOW |
| 12 | Daily opening workflow (UX-LOW-002) | High | Medium | LOW |
| 13 | Shift handover workflow (UX-LOW-003) | High | Medium | LOW |
| 14 | Consistent Button usage (UX-LOW-004) | Low | Low | LOW |
| 15 | Card-based mobile tables (UX-LOW-005) | Medium | Medium | LOW |
| 16 | Framer Motion transitions (UX-LOW-006) | High | Low | LOW |
| 17 | Session timeout warning (UX-LOW-007) | Medium | Medium | LOW |
| 18 | Confetti for achievements (UX-LOW-008) | Low | Low | LOW |
| 19 | Comprehensive sr-only utilities (UX-LOW-009) | Low | Medium | LOW |
| 20 | Wider ARIA landmark usage (UX-LOW-010) | Medium | Medium | LOW |

---

## Effort vs Impact Analysis

```
Impact
  High │  ✅(1,2)    (3,4,5)    
       │
  Med  │            (6,7,8,9,10)  (11,12,13,17,19,20)
       │
  Low  │            (14,18)      (15,16)
       └──────────────────────────────────
          Low      Medium      High
                    Effort
```

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Low Effort, High Impact)
1. ✅ Replace alert() with showToast() — **COMPLETED**
2. Fix gold color contrast — Darken or restrict to decorative
3. Add skip-to-content links — Add to all layout components
4. Increase touch targets — Adjust button/input heights

### Phase 2: Shared Components (Medium Effort, High Impact)
5. Create shared Modal component — With focus trap, ARIA, escape
6. Create shared Table component — With consistent styling and ARIA
7. Replace prompt() with modal forms — For payout and delivery inputs

### Phase 3: Navigation Enhancement (Low-Medium Effort, Medium Impact)
8. Add breadcrumbs — For Analytics and Reports sections
9. Add guided tours — For first-time dashboard users

### Phase 4: Post-Launch Evolution
10. Standardize terminology
11. Daily opening workflow
12. Shift handover workflow
13. Card-based mobile tables
14. Session timeout warning
15. Framer Motion transitions
16. Confetti for achievements
17. Comprehensive sr-only utilities
18. Wider ARIA landmark usage
