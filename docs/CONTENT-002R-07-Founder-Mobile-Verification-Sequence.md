# CONTENT-002R — Founder-Led Physical Mobile Verification Sequence

## Purpose
The fixes and matrix in `CONTENT-002R-03-Viewport-Verification-Matrix.md` are **code-level/emulated verification**. This document is the required **physical real-device** confirmation sequence to be performed by the founder before certifying the mission complete.

## Devices Recommended
- **Small mobile**: iPhone SE / any Android ~360-390px width (e.g., Pixel, Galaxy S-series compact)
- **Large mobile**: iPhone 14/15/16 Pro Max or similar ~412-430px width
- **Tablet**: iPad or Android tablet, both portrait (~768px) and landscape (~1024px)

## Sequence

### Step 1 — Editorial Dashboard (Mobile)
1. Log in as an editorial user (EDITOR/REVIEWER/PUBLISHER role or ADMIN).
2. Navigate to `/admin/content`.
3. **Verify**: Stats cards show 2 per row, no cramped text.
4. **Verify**: Filter buttons (`All`, `Draft`, `Review`, etc.) wrap to multiple rows without overflowing the screen edge.
5. **Verify**: Articles table can be scrolled horizontally without vertical content clipping; no text is cut off.
6. Tap hamburger menu (top-left) — confirm the mobile sidebar drawer opens/closes cleanly.

### Step 2 — Article Creation (Mobile)
1. Tap **+ New Article**.
2. **Verify**: All form fields (Type, Title, Subtitle, Excerpt, Topic, Tags, Body) are full-width, readable, and not overlapping labels.
3. Fill in a test article and tap **Create Draft**.
4. **Verify**: Redirect to edit page works, no layout break.

### Step 3 — Editorial Workflow Transitions (Mobile)
1. On the edit page, scroll to **Editorial Workflow** panel.
2. **Verify**: Transition buttons wrap cleanly (`flex-wrap` already present) without horizontal overflow.
3. Transition DRAFT → REVIEW → APPROVED → PUBLISHED (use a disposable test article).
4. **Verify**: Transition history list displays without text collision.

### Step 4 — Topics & Tags (Mobile)
1. Navigate to `/admin/content/topics`.
2. **Verify**: Each topic row shows name + description on the left, **Delete** button on the right, with visible spacing (no touching text).
3. Navigate to `/admin/content/tags`.
4. Tap **+ New Topic** equivalent / use the tag form.
5. **Verify**: Name and Slug fields stack vertically on the phone screen; **Add** button is easily tappable below them.

### Step 5 — Media Library (Mobile)
1. Navigate to `/admin/content/media`.
2. **Verify**: Media grid shows 2 columns on phone, thumbnails are square and not distorted.
3. Upload a test image.
4. **Verify**: Grid updates without layout shift issues.

### Step 6 — Public Article Reading (Mobile, both device sizes)
1. Visit a published article at `/blog/[slug]` (or `/stories`, `/insights`, `/guides`).
2. **Verify**: Breadcrumb (Home / Section / Title) does not overflow; long titles truncate with ellipsis instead of wrapping off-screen.
3. **Verify**: Article title, subtitle, and metadata (author, date, reading time) wrap naturally without collision.
4. **Verify**: Cover image displays full-width without distortion.
5. Scroll through body content — confirm no horizontal scroll is introduced by the article body itself.
6. **Verify**: "Related Articles" section stacks to 1 column on mobile.
7. Test the **Share** buttons (WhatsApp, Facebook, Twitter, Copy Link) — confirm they are tappable and not cramped.

### Step 7 — Public Listing Pages (Mobile & Tablet)
1. Visit `/blog`, `/stories`, `/insights`, `/guides`.
2. **Verify**: Article cards display 1 column on phone, 2 on tablet portrait, transitioning cleanly.
3. **Verify**: Pagination controls (if present) are tappable and not overlapping.

### Step 8 — Tablet Landscape Check
1. Rotate tablet to landscape (~1024px width, matches `lg` breakpoint).
2. Navigate `/admin/content` — **verify** desktop sidebar now appears (fixed left rail), hamburger menu disappears.
3. Navigate a public article — **verify** related articles now show 3 columns.

### Step 9 — Business CMS Spot Check (Isolation Confirmation)
1. Navigate to `/admin/restaurants` (or another business CMS page) on mobile.
2. **Verify**: Page renders and functions exactly as before this mission — sidebar/hamburger behavior identical, no visual regression from the shared `AdminLayout` padding tweak.

## Sign-Off Criteria
Mission is certified complete only when **all 9 steps pass on at least one physical small-mobile device, one large-mobile device, and one tablet**, with zero text collision, overflow, or clipping observed.

## Reporting
Record device model, OS version, browser, and pass/fail per step. Any failure should be filed with a screenshot referencing the specific step number above.
