# Localization Browser Verification Test Plan — ImboniServe v1.0

## Objective
Verify that all public-facing pages render correctly in EN, FR, and RW across desktop, tablet, and mobile viewports. Confirm no hardcoded strings, no fallback keys, no mixed-language content, and no layout regressions.

---

## Test Matrix

| Language | Desktop (1920×1080) | Tablet (768×1024) | Mobile (375×667) |
|----------|---------------------|-------------------|-------------------|
| EN       | ☐                   | ☐                 | ☐                 |
| FR       | ☐                   | ☐                 | ☐                 |
| RW       | ☐                   | ☐                 | ☐                 |

**Total: 9 combinations per page.**

---

## Pages to Verify

### Public Pages
1. **Homepage** (`/`) — hero slides, features section, stats, pricing preview, CTA buttons
2. **Pricing** (`/pricing`) — plan names, descriptions, feature lists, billing toggle, CTAs
3. **Features index** (`/features`) — category cards, badges, CTAs
4. **Features: Operations** (`/features/operations`)
5. **Features: AI** (`/features/ai`)
6. **Features: Analytics** (`/features/analytics`)
7. **Features: Finance** (`/features/finance`)
8. **Features: Growth** (`/features/growth`)
9. **Features: Infrastructure** (`/features/infrastructure`)
10. **Refer** (`/refer`) — referral program details, rewards, FAQ, share buttons
11. **Login** (`/login`) — credentials step, OTP step, resend, error messages
12. **Signup** (`/signup`) — form labels, plan selection, terms links
13. **Forgot Password** (`/forgot-password`) — form, success state
14. **Reset Password** (`/reset-password`) — form, validation, success state
15. **Welcome** (`/welcome`) — post-signup confirmation, next steps, CTAs
16. **404** (`/404`) — title, description, CTA
17. **500** (`/500`) — title, description, CTA
18. **FAQ** (`/faq`) — all FAQ items, contact section, links
19. **Terms** (`/terms`) — legal content
20. **Privacy** (`/privacy`) — legal content
21. **Cookies** (`/cookies`) — legal content
22. **Service Terms** (`/service-terms`) — legal content
23. **Unsubscribe** (`/unsubscribe`) — form, success/error states
24. **Discover** (`/discover`) — business listings, filters

### Layout Components
25. **PublicLayout header** — nav links, solutions dropdown, language switcher, dark/light toggle, mobile menu
26. **PublicLayout footer** — links, newsletter signup, social share, powered by, legal links

---

## Checklist Per Page Per Language

- [ ] **No hardcoded English strings** — all text rendered via `t()` calls
- [ ] **No fallback keys visible** — no raw key paths (e.g., `homepage.hero.title`) displayed
- [ ] **No mixed-language content** — entire page in selected language (except brand/product names)
- [ ] **Meta description localized** — check `<meta name="description">` in page source
- [ ] **Page title localized** — check `<title>` tag
- [ ] **Layout intact** — no overflow, truncation, or broken alignment
- [ ] **Buttons/CTAs functional** — links work, text fits within button bounds
- [ ] **Form labels/placeholders localized** — all input fields show correct language
- [ ] **Error messages localized** — trigger validation errors and verify language
- [ ] **ARIA labels localized** — check `aria-label` attributes on interactive elements

---

## Terminology Verification (RW only)

- [ ] "Komande" used everywhere (no "Commande" or "commande")
- [ ] "Kafeyi" used everywhere (no "kafe" or "kafé")
- [ ] "Rezerivasiyo" used for reservations (no "reservation" or "Guteganya")
- [ ] "Ibikorenerwa" used in supplier/procurement context (not "ibikoresho")
- [ ] "Igikoni" used for kitchen
- [ ] "Ububiko" used for inventory
- [ ] Brand terms preserved: Dashboard, AI, POS, QR Code, Service Replay™, Smart Dining Slips™

---

## Terminology Verification (FR only)

- [ ] "Réservation" used (not "Reservation")
- [ ] "Cuisine" used for kitchen
- [ ] "Serveur" used for waiter
- [ ] Note: "Inventaire" is currently used (not "Stocks" per guide) — this is a pending decision, not a bug

---

## Special Test Cases

1. **Language switching**: Switch between EN → FR → RW on each page and verify immediate re-render
2. **SSR hydration**: Check for hydration mismatch warnings in console (suppressHydrationWarning used on dynamic content)
3. **Error pages**: Navigate to non-existent URL for 404; trigger server error for 500
4. **OTP flow**: Complete login flow and verify OTP screen in all languages
5. **Password reset**: Request reset link and verify email/success screen in all languages
6. **Mobile menu**: Open/close mobile menu and verify all nav items localized
7. **Dark mode**: Toggle dark mode and verify no text visibility issues in any language
8. **RTL/long text**: RW text is often longer than EN — verify no truncation on mobile

---

## How to Run

1. Start dev server: `npm run dev`
2. Open browser at `http://localhost:3000`
3. For each language, append `?lang=en`, `?lang=fr`, or `?lang=rw` to URL (or use language switcher)
4. Use browser DevTools device emulation for tablet/mobile viewports
5. Check page source for meta tags and title
6. Check browser console for errors/warnings
7. Document any issues found with screenshot and page URL
