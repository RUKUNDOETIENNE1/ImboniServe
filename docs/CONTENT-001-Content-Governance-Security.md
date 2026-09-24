# CONTENT-001 — Content Governance & Security

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Governance & Security Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the governance model (roles, permissions, audit) and security architecture (safe content, XSS prevention, access control) for the editorial content system.

## 2. Governance Model

### 2.1 Editorial Roles

| Role | Create | Edit Own | Edit Others | Submit for Review | Review | Publish | Delete | Manage Topics/Tags |
|------|--------|----------|-------------|-------------------|--------|---------|--------|-------------------|
| EDITOR | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| REVIEWER | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUBLISHER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.2 Role Storage

- `User.editorialRoles`: String array (e.g., `["EDITOR", "REVIEWER"]`)
- Roles are additive — a user can have multiple editorial roles
- Editorial roles are separate from business roles (`User.roles`)
- ADMIN/PLATFORM_ADMIN in `roles` implies all editorial permissions

### 2.3 Role Assignment

- Only ADMIN/PLATFORM_ADMIN can assign editorial roles
- Assignment via admin user management page
- Role changes are auditable

### 2.4 Audit Trail

All content state transitions are recorded in `ContentTransition`:
- `fromStatus`, `toStatus`, `actorId`, `note`, `createdAt`
- Immutable — transitions cannot be deleted or modified
- Queryable for compliance reporting

## 3. Access Control

### 3.1 API Route Protection

All editorial API routes require:
1. Authenticated session (NextAuth)
2. Editorial role check (EDITOR, REVIEWER, PUBLISHER, or ADMIN)
3. Action-specific permission (e.g., publish requires PUBLISHER+)

### 3.2 Public vs Private Separation

| Content Status | Public Access | Admin Access |
|---------------|---------------|-------------|
| IDEA, DRAFT, REVIEW, APPROVED, SCHEDULED, REJECTED | No (404) | Yes (role-based) |
| PUBLISHED | Yes | Yes |
| ARCHIVED | No (410 Gone) | Yes |
| UPDATED | No (original PUBLISHED is public) | Yes |

### 3.3 Admin Page Protection

- All `/admin/content/*` pages require editorial role
- Server-side check in `getServerSideProps`
- Client-side check via `useSession`
- Non-editorial users redirected to `/dashboard`

## 4. Content Security

### 4.1 XSS Prevention

**Markdown Rendering**:
- Use `remark` + `rehype` with `rehype-sanitize` plugin
- Sanitization whitelist: headings, paragraphs, lists, links, images, code, blockquotes, tables
- **No**: `<script>`, `<iframe>`, `<object>`, `<embed>`, `on*` attributes, `javascript:` URLs
- Links: `href` must be `http:`, `https:`, or relative path only
- Images: `src` must be `http:`, `https:`, or relative path only

**Rich Text (LATER)**:
- If using ProseMirror/Lexical, output is structured JSON → HTML via safe renderer
- No raw HTML input in rich text mode

**HTML Body Format**:
- If `bodyFormat: "HTML"`, content is sanitized with `DOMPurify` server-side before storage
- Stored HTML is re-sanitized on render (defense in depth)

### 4.2 CSRF Protection

- All state-changing API routes require NextAuth session (JWT-based)
- Next.js API routes with `getServerSession` are CSRF-safe by default (SameSite cookies)
- No additional CSRF token needed for NOW (NextAuth handles this)

### 4.3 Safe Media

- File type validation (MIME type + extension check)
- File size limits enforced
- No executable file types
- Images: jpeg, png, webp, gif only
- Videos: mp4, quicktime, webm only
- Documents: pdf only (for resources)
- SVG: sanitized (no `<script>` tags) — stored as png or sanitized svg

### 4.4 No Secret Exposure

- Editorial content is public — no secrets in content
- API keys, database credentials, etc. must never appear in article body
- Content is reviewed before publishing (editorial workflow)
- Automated scan (NEXT): check for patterns resembling API keys/credentials before publish

## 5. Content Integrity

### 5.1 Revision History

- `ContentRevision` records immutable snapshots of content at each save
- Revisions can be compared and restored (NEXT scope)
- Revision number is sequential per article

### 5.2 Deletion Policy

- **No hard deletes** for published content
- Archived content remains in database (status: ARCHIVED)
- Admin can delete DRAFT/REJECTED content (not published)
- Deletion is auditable via ContentTransition
- Media assets: soft delete (mark inactive), preserve storage key

### 5.3 Slug Permanence

- Once a slug is used for a PUBLISHED article, it cannot be reused
- Slug changes create a redirect (NEXT scope: redirect table)
- Archived article slugs are reserved (cannot be reused)

## 6. Privacy & Data Protection

### 6.1 Subscriber Data

- NewsletterSubscriber data is PII (email/phone)
- Access restricted to ADMIN role
- CSV export requires ADMIN role
- No PII in analytics (analytics provider configured for privacy)
- Subscriber data not shared with third parties

### 6.2 Author Privacy

- Author name displayed on articles (from User.name)
- Author email is never public
- Author profile page shows only: name, bio (if provided), articles

### 6.3 Cookie Compliance

- Existing `CookieConsentBanner` component
- Analytics script loaded only after consent
- UTM cookies are functional (first-party, httpOnly) — not tracking cookies
- Referral cookies are functional — not tracking cookies

## 7. Security Checklist

| Control | Status | Implementation |
|---------|--------|---------------|
| Authentication | ✅ | NextAuth with JWT, MFA/OTP |
| Authorization | ✅ | Editorial roles, per-action permissions |
| XSS prevention | ✅ | Markdown sanitization, HTML sanitization |
| CSRF protection | ✅ | NextAuth SameSite cookies |
| SQL injection | ✅ | Prisma ORM (parameterized queries) |
| File upload security | ✅ | Type validation, size limits, no executables |
| Audit trail | ✅ | ContentTransition for all state changes |
| Revision history | ✅ | ContentRevision (immutable) |
| No hard deletes | ✅ | Archive instead of delete |
| Slug permanence | ✅ | Unique constraint, reserved slugs |
| PII protection | ✅ | Admin-only access, no PII in analytics |
| Cookie consent | ✅ | Existing CookieConsentBanner |
| Secret prevention | ✅ | Editorial workflow review, automated scan (NEXT) |

## 8. What We Do NOT Build

- **No complex RBAC engine** — simple editorial roles are sufficient
- **No content approval workflow engine** — fixed lifecycle is sufficient
- **No content legal review workflow** — handled by editorial process, not software
- **No DRM or content protection** — public content is public
- **No rate limiting on public content** — CDN/caching handles scale (LATER)

---

*End of Content Governance & Security*
