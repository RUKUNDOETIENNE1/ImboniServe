# OEC-001D Accessibility Assessment

## Area 5: Accessibility

---

## 1. ARIA Attributes

### Current Usage

| Attribute | Instances | Assessment |
|-----------|-----------|------------|
| aria-label | 12+ | Limited — interactive elements lack comprehensive labeling |
| aria-hidden | 30+ | Moderate — decorative icons properly hidden |
| aria-describedby | 1 | Very limited — only referral code input |
| aria-live | 2 | Limited — only chat widgets |
| aria-expanded | 5 | Limited — mobile menu, FAQ accordion |
| aria-selected | 3 | Limited — tab navigation in partnership detail |

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Decorative icons hidden | ✅ | aria-hidden used consistently |
| Interactive elements labeled | ⚠️ | Many lack aria-label |
| Live regions | ⚠️ | Only chat widgets |
| Form field descriptions | ⚠️ | Only 1 instance |

**Score: 5.0/10 — Needs Improvement**

---

## 2. Keyboard Navigation

### Current State
- **onKeyDown**: 23 instances (OTP input, escape key, enter key navigation)
- **onKeyPress**: 7 instances (AI copilot, WhatsApp bot, menu builder)
- **tabIndex**: 15 instances (some divs made keyboard focusable)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| OTP keyboard navigation | ✅ | Backspace navigation, auto-focus |
| Escape key for modals | ✅ | Chat widgets |
| Enter key for actions | ✅ | Search, navigation |
| Comprehensive keyboard support | ⚠️ | Inconsistent across pages |

**Score: 6.0/10 — Moderate**

---

## 3. Focus Management

### Current State
- **Focus restoration**: Present in chat widgets (saves and restores focused element)
- **Focus trap**: Implemented in chat widgets (Tab key trap)
- **Auto-focus**: Limited (OTP first input, rejection reason textarea, seat selection)
- **Skip-to-content links**: ❌ NOT FOUND

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Modal focus trap | ⚠️ | Only chat widgets, not all modals |
| Focus restoration | ⚠️ | Only chat widgets |
| Auto-focus | ⚠️ | Limited usage |
| Skip-to-content | ❌ | Not implemented (UX-HIGH-002) |

**Score: 4.0/10 — Needs Improvement**

---

## 4. Color Contrast

### WCAG AA Analysis

| Color | Hex | Contrast (on white) | WCAG AA | Notes |
|-------|-----|---------------------|---------|-------|
| imboni.blue | #1B2D65 | 13.04:1 | ✅ Pass AAA | Excellent |
| imboni.orange | #E76F51 | 3.09:1 | ⚠️ AA Large only | Fails for normal text |
| imboni.green | #1F7A5A | 5.26:1 | ✅ Pass AA | Good |
| imboni.gold | #C9A227 | 2.42:1 | ❌ Fail AA | Not suitable for text |
| imboni.dark | #1C1E21 | 21.00:1 | ✅ Pass AAA | Excellent |

### Critical Issue
**imboni.gold (#C9A227)** has only 2.42:1 contrast with white, failing WCAG AA minimum of 4.5:1. Used for "AI insights, badges" — if used for text, it's inaccessible.

**Classification: Pre-Launch Improvement (UX-HIGH-001)**

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Primary text colors | ✅ | Blue, dark pass AAA |
| Success color | ✅ | Green passes AA |
| Accent color | ⚠️ | Orange passes AA Large only |
| Gold color | ❌ | Fails AA — must not use for text |

**Score: 5.0/10 — Needs Improvement**

---

## 5. Screen Reader Support

### Current State
- **sr-only class**: 6 instances (custom toggle switches, install button)
- **visually-hidden**: NOT FOUND
- **No comprehensive screen reader utilities** in globals.css

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| sr-only usage | ⚠️ | Very limited |
| Screen reader utilities | ❌ | Not comprehensive |
| ARIA landmarks | ⚠️ | Some nav, main elements |

**Score: 4.0/10 — Needs Improvement**

---

## 6. Semantic HTML

### Current State
| Element | Usage | Assessment |
|---------|-------|------------|
| `<main>` | 6 instances (layouts) | ✅ Good |
| `<nav>` | 11 instances (layouts, navigation) | ✅ Good |
| `<h1>-<h3>` | Used appropriately | ✅ Good |
| `<button>` | Used for actions (not divs with onClick) | ✅ Good |
| `<a>/<Link>` | Next.js Link used consistently | ✅ Good |
| `<form>` | 20+ instances with proper labels | ✅ Good |
| `<label>` | Used with htmlFor | ✅ Good |

### Image Alt Text
- Most images have descriptive alt text
- 3 instances with empty alt="" on homepage (decorative)

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| Semantic elements | ✅ | Good usage of main, nav, button, form, label |
| Heading hierarchy | ✅ | Appropriate h1-h3 usage |
| Image alt text | ⚠️ | Mostly good, 3 empty alt on decorative |

**Score: 8.0/10 — Good**

---

## 7. Existing Accessibility Tests

### Test File: `tests/accessibility/a11y.test.ts` (190 lines)
- Homepage accessibility (alt text, heading hierarchy)
- Login page (form labels, ARIA attributes)
- Dashboard (skip links, ARIA landmarks)
- Button accessible names
- Link accessible names
- Form labels
- Color contrast
- Keyboard navigation
- Focus indicators
- Page language attribute
- WCAG 2.1 AA compliance

### Assessment
| Criterion | Status | Notes |
|-----------|--------|-------|
| A11y test suite | ✅ | Comprehensive test file exists |
| Test coverage | ✅ | Covers major pages and WCAG criteria |
| Automated testing | ⚠️ | @axe-core/playwright commented out |

**Score: 7.0/10 — Good**

---

## Overall Accessibility Score: 6.0/10 — Moderate

**Strengths**: Semantic HTML, existing a11y test suite, proper button/form/label usage  
**Gaps**: Gold color contrast failure, no skip-to-content, limited ARIA, limited sr-only, inconsistent focus management
