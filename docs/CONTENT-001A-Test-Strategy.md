# CONTENT-001A — Test Strategy

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Testing Requirements for CONTENT-002  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define what must be tested when CONTENT-002 implementation begins. Tests are NOT written in this mission — this document defines the testing requirements.

## 2. Test Layers

### 2.1 Unit Tests

| # | Test | Layer | What It Verifies |
|---|------|-------|-----------------|
| U1 | Slug generation | Service | Slug is URL-safe, lowercase, hyphenated, unique |
| U2 | Slug collision detection | Service | Throws on duplicate slug |
| U3 | Content type validation | Service | Rejects invalid content types |
| U4 | Status transition validation | Service | Accepts valid transitions, rejects invalid ones |
| U5 | Role-based transition permission | Service | EDITOR cannot approve, REVIEWER cannot publish, etc. |
| U6 | Article creation | Service | Creates article with DRAFT status, creates ContentTransition |
| U7 | Article update restrictions | Service | Cannot edit body when status is REVIEW/APPROVED/SCHEDULED |
| U8 | Article deletion restrictions | Service | Can only delete DRAFT/REJECTED |
| U9 | Topic hierarchy | Service | parentId creates valid tree, no circular references |
| U10 | Tag uniqueness | Service | Duplicate tag name throws |
| U11 | Product link validation | Service | productKey non-empty, linkType valid |
| U12 | SEO metadata fallback | Service | metaTitle falls back to title + suffix |
| U13 | Markdown sanitization | Utility | Script tags, iframes, on* attributes removed |
| U14 | Newsletter subscribe with new fields | Service | New fields stored, backward compatible |
| U15 | UTM cookie parsing | Utility | Extracts UTM values from cookies correctly |

### 2.2 Integration Tests

| # | Test | What It Verifies |
|---|------|-----------------|
| I1 | Article CRUD via API | Create, read, update, delete through API endpoints |
| I2 | Article transition via API | All valid transitions work, invalid transitions return 400 |
| I3 | Transition audit trail | ContentTransition created for every status change |
| I4 | Topic CRUD via API | Create, list, update, delete topics |
| I5 | Tag CRUD via API | Create, list, delete tags |
| I6 | Media upload via API | Upload image, verify PlatformMediaAsset created |
| I7 | Media upload validation | Reject invalid file type, oversized file |
| I8 | Public article list API | Returns only PUBLISHED articles, paginated |
| I9 | Public article detail API | Returns published article by slug, 404 for non-published |
| I10 | Product links via API | Set and retrieve product links |
| I11 | Content event tracking | POST event creates ContentEvent with UTM from cookies |
| I12 | Newsletter subscribe extended | New fields accepted, old format still works |
| I13 | Sitemap generation | sitemap-pages.xml has static URLs, sitemap-articles.xml has published articles |
| I14 | Scheduled publication | SCHEDULED article with past scheduledAt gets published by cron |
| I15 | Auth check on admin API | Unauthenticated request returns 401, non-editorial returns 403 |

### 2.3 End-to-End (E2E) Tests

| # | Test | Flow |
|---|------|------|
| E1 | Editor creates article | Login → /admin/content/articles/new → fill form → save draft → article appears in list |
| E2 | Submit for review | Editor → open draft → submit for review → status changes to REVIEW |
| E3 | Reviewer approves | Login as reviewer → open article in REVIEW → approve → status changes to APPROVED |
| E4 | Publisher publishes | Login as publisher → open approved article → publish → status changes to PUBLISHED |
| E5 | Public article access | Visit /blog/[slug] → article content displayed with SEO metadata |
| E6 | Draft inaccessible publicly | Visit /blog/[draft-slug] → 404 page |
| E7 | SEO metadata rendered | View page source → correct title, meta description, OG tags, JSON-LD |
| E8 | Sitemap contains article | Fetch /sitemap-articles.xml → published article URL present |
| E9 | Archive article | Admin → published article → archive → public URL returns 404 |
| E10 | Scheduled publication | Publisher schedules article → wait (or mock time) → article auto-publishes |

### 2.4 Security Tests

| # | Test | What It Verifies |
|---|------|-----------------|
| S1 | Unauthorized editor access | No session → 401 on admin API |
| S2 | Non-editorial user access | Authenticated user without editorialRoles → 403 on admin API |
| S3 | Public/private boundary | Draft article slug → 404 (not 403, no information leak) |
| S4 | XSS via Markdown | Article body with `<script>alert(1)</script>` → script tag removed in rendered HTML |
| S5 | XSS via HTML body format | If bodyFormat=HTML, content sanitized with DOMPurify |
| S6 | Unsafe image URL | Markdown with `![alt](javascript:alert(1))` → URL rejected/sanitized |
| S7 | Media access without auth | Upload endpoint without session → 401 |
| S8 | Media upload malicious file | Upload .exe file → rejected |
| S9 | CSRF on state-changing endpoints | NextAuth SameSite cookies prevent CSRF |
| S10 | Editorial role escalation | User cannot self-assign editorialRoles via API |
| S11 | Slug injection | Slug with path traversal (`../admin`) → rejected |
| S12 | Mass assignment | API ignores `editorialRoles` field in article update body |

## 3. Test File Structure

```
tests/
  unit/
    content/
      editorial-service.test.ts        (U1-U8, U12)
      topic-service.test.ts             (U9)
      tag-service.test.ts               (U10)
      product-link.test.ts              (U11)
      markdown-sanitize.test.ts         (U13)
      newsletter-extended.test.ts       (U14)
      utm-parser.test.ts                (U15)
  integration/
    content/
      articles-api.test.ts              (I1-I3, I15)
      topics-api.test.ts                (I4)
      tags-api.test.ts                  (I5)
      media-api.test.ts                 (I6-I7)
      public-content-api.test.ts        (I8-I9)
      product-links-api.test.ts         (I10)
      content-events-api.test.ts        (I11)
      newsletter-subscribe.test.ts      (I12)
      sitemap.test.ts                   (I13)
      scheduled-publish.test.ts         (I14)
  e2e/
    content/
      editorial-workflow.spec.ts        (E1-E4, E9-E10)
      public-article.spec.ts            (E5-E6)
      seo-metadata.spec.ts              (E7-E8)
  security/
    content/
      access-control.test.ts            (S1-S3, S7, S10)
      xss-prevention.test.ts            (S4-S6)
      upload-security.test.ts           (S8)
      injection-prevention.test.ts      (S11-S12)
```

## 4. Test Data Requirements

| Data | Purpose |
|------|---------|
| Test users with each editorial role (EDITOR, REVIEWER, PUBLISHER) | Role-based tests |
| Test user with ADMIN role | Admin-only tests |
| Test user with no editorial roles | Access denial tests |
| Test articles in each status (DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, UPDATED, ARCHIVED, REJECTED) | Status-based tests |
| Test topics with hierarchy (parent + children) | Hierarchy tests |
| Test tags (including duplicate-name test case) | Uniqueness tests |
| Test media assets (image, video, document) | Media tests |
| Test markdown content with XSS payloads | Security tests |

## 5. Test Execution

| Layer | Command | When |
|-------|---------|------|
| Unit | `npm test -- --testPathPattern=tests/unit/content` | Every commit |
| Integration | `npm test -- --testPathPattern=tests/integration/content` | Pre-merge |
| E2E | `npm run test:e2e -- --spec=tests/e2e/content` | Pre-deploy |
| Security | `npm test -- --testPathPattern=tests/security/content` | Pre-merge |

## 6. Coverage Requirements

| Layer | Minimum Coverage |
|--------|-----------------|
| EditorialService (transitions, CRUD, permissions) | 90% |
| Public content API | 85% |
| Markdown sanitization | 100% |
| Auth/role checks | 95% |
| Other services | 75% |

---

*End of Test Strategy*
