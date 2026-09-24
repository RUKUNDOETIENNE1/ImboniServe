# CONTENT-001A — Admin UI Contract

> **Mission**: ImboniServe Knowledge & Growth Platform — Implementation Readiness  
> **Document Type**: Admin UI Screen & Field Specification  
> **Date**: 2025-08-15  
> **Status**: COMPLETE

---

## 1. Purpose

Define every admin screen, its fields, actions, permissions, state transitions, validation, and error states for Phase A implementation.

## 2. Screen Inventory

| # | Route | Screen | Phase |
|---|-------|--------|-------|
| 1 | `/admin/content` | Content Dashboard | A |
| 2 | `/admin/content/articles` | Article List | A |
| 3 | `/admin/content/articles/new` | Create Article | A |
| 4 | `/admin/content/articles/[id]` | Edit Article | A |
| 5 | `/admin/content/topics` | Topic Management | A |
| 6 | `/admin/content/tags` | Tag Management | A |
| 7 | `/admin/content/media` | Media Library | A |
| 8 | `/admin/content/media/upload` | Upload Media | A |
| 9 | `/admin/content/media/[id]` | Media Detail | A |
| 10 | `/admin/content/settings` | Editorial Settings | A |

## 3. Access Control

- All `/admin/content/*` pages require authenticated session
- Server-side check: `session.user.roles.includes('ADMIN')` OR `session.user.editorialRoles` is non-empty
- Non-editorial users redirected to `/dashboard`
- Client-side: `useSession()` check with loading state

## 4. Screen: Content Dashboard

**Route**: `/admin/content`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Page Title: "Content Dashboard"]
  [Stats Row]
    [Total Articles] [Published] [In Review] [Drafts]
  [Recent Activity]
    [Latest transitions: article title, status change, actor, timestamp]
  [Quick Actions]
    [New Article] [Upload Media] [Manage Topics]
[/AdminLayout]
```

### Data
- Stats: COUNT articles grouped by status
- Recent activity: Last 10 ContentTransition records with article title and actor name

## 5. Screen: Article List

**Route**: `/admin/content/articles`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Page Title: "Articles"]
  [Filter Bar]
    [Status dropdown] [Type dropdown] [Topic dropdown] [Search input]
  [Article Table]
    [Columns: Title | Type | Status | Topic | Author | Published Date | Actions]
    [Row actions: Edit, Preview (if published)]
  [Pagination]
  [New Article button]
[/AdminLayout]
```

### Fields
| Column | Source | Sortable |
|--------|--------|----------|
| Title | article.title | Yes |
| Type | article.type | Yes |
| Status | article.status (badge) | Yes |
| Topic | article.topic?.name | Yes |
| Author | article.author?.name | Yes |
| Published Date | article.publishedAt | Yes |
| Actions | Edit link, Preview link (if PUBLISHED) | — |

### Filters
- Status: All, DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, UPDATED, ARCHIVED, REJECTED
- Type: All, Article, FounderStory, IndustryInsight, ProductStory, CaseStudy, Guide, Report, Newsletter, Announcement, Resource
- Topic: All + list of active topics
- Search: title + excerpt (case-insensitive)

### Pagination
- Default: 20 per page
- Max: 100 per page
- Show: "Showing 1–20 of 145"

## 6. Screen: Create Article

**Route**: `/admin/content/articles/new`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Editor Header: "New Article" | Save Draft button]
  [Two-column layout]
    [Left: Editor]
      [Type selector (dropdown)]
      [Title input]
      [Subtitle input (optional)]
      [Slug input (auto-generated, editable)]
      [Excerpt textarea]
      [Body editor (Markdown textarea + live preview toggle)]
      [Cover image selector (button → media picker modal)]
    [Right: Sidebar]
      [Status: DRAFT badge]
      [Topic selector (dropdown)]
      [Tag input (multi-select with create)]
      [SEO Panel (collapsible)]
        [Meta title (with char count /60)]
        [Meta description (with char count /160)]
        [OG image selector]
        [SERP preview]
      [Product Links Panel (collapsible)]
        [Add product link: productKey dropdown + linkType + add button]
        [List of product links with remove]
      [Save Draft button]
  [Preview button (opens /preview/[slug] in new tab — Phase B)]
[/AdminLayout]
```

### Validation
| Field | Rule | Error |
|-------|------|-------|
| type | Required, must be valid type | "Please select a content type" |
| title | Required, non-empty | "Title is required" |
| slug | Auto-generated from title, editable, must be unique | "Slug already exists" |
| body | Required, non-empty | "Content body is required" |
| metaTitle | Max 60 characters | "Meta title should be under 60 characters" |
| metaDescription | Max 160 characters | "Meta description should be under 160 characters" |

### Actions
| Action | Effect | Required Role |
|--------|--------|--------------|
| Save Draft | Creates article with status DRAFT | EDITOR+ |
| Cancel | Returns to article list | — |

## 7. Screen: Edit Article

**Route**: `/admin/content/articles/[id]`  
**Authorization**: Any editorial role or ADMIN (EDITORS can only edit own articles unless ADMIN)

### Layout
```
[AdminLayout]
  [Editor Header: Article title | Status badge | Workflow actions]
  [Two-column layout]
    [Left: Editor (same as Create, pre-filled)]
      [Body editor with Markdown + preview]
      [Cover image]
    [Right: Sidebar]
      [Workflow Panel]
        [Current status badge]
        [Available transition buttons (context-dependent)]
        [Transition history (last 5 transitions)]
      [Topic selector]
      [Tag input]
      [SEO Panel]
      [Product Links Panel]
      [Metadata Panel (collapsible)]
        [Author (read-only or ADMIN-editable)]
        [Reviewer (read-only)]
        [Publisher (read-only)]
        [Published At (read-only)]
        [Scheduled At (editable if APPROVED)]
      [Save button] [Delete button (ADMIN, DRAFT/REJECTED only)]
[/AdminLayout]
```

### Workflow Actions (Context-Dependent)

| Current Status | Available Actions | Required Role |
|---------------|-------------------|--------------|
| DRAFT | Submit for Review, Archive | EDITOR+ / ADMIN |
| REVIEW | Approve, Reject (with note), Request Changes | REVIEWER+ |
| APPROVED | Schedule (with date picker), Publish Now | PUBLISHER+ |
| SCHEDULED | Unschedule, Publish Now | PUBLISHER+ |
| PUBLISHED | Edit (→ UPDATED), Archive | EDITOR+ / ADMIN |
| UPDATED | Submit for Review, Publish Now | EDITOR+ / PUBLISHER+ |
| ARCHIVED | Revive (→ DRAFT) | ADMIN |
| REJECTED | Revise (→ DRAFT) | EDITOR+ |

### Edit Locking

| Status | Body Editable | SEO Editable | Topic/Tags Editable |
|--------|--------------|-------------|-------------------|
| DRAFT | ✅ | ✅ | ✅ |
| REVIEW | ❌ | ❌ | ❌ |
| APPROVED | ❌ | ✅ | ❌ |
| SCHEDULED | ❌ | ✅ | ❌ |
| PUBLISHED | ❌ (must → UPDATED) | ❌ | ❌ |
| UPDATED | ✅ | ✅ | ✅ |
| ARCHIVED | ❌ | ❌ | ❌ |
| REJECTED | ❌ | ❌ | ❌ |

When fields are locked, display them as read-only with a tooltip: "This field is locked while article is in [STATUS] status."

### Error States
| Error | Display |
|-------|---------|
| Article not found | 404 page |
| No editorial role | Redirect to /dashboard |
| Invalid transition | Toast: "Cannot transition from [X] to [Y]" |
| Slug collision | Inline error on slug field |
| Save failure | Toast: "Failed to save article" |

## 8. Screen: Topic Management

**Route**: `/admin/content/topics`  
**Authorization**: Any editorial role (view), ADMIN (create/edit/delete)

### Layout
```
[AdminLayout]
  [Page Title: "Topics"]
  [Topic Tree (hierarchical list)]
    [Topic: name, slug, article count, actions (Edit, Add Child, Deactivate)]
  [New Topic button (ADMIN)]
  [Topic Form Modal]
    [Name, Description, Parent (dropdown), Color, Icon, Sort Order]
[/AdminLayout]
```

## 9. Screen: Tag Management

**Route**: `/admin/content/tags`  
**Authorization**: Any editorial role (view), EDITOR+ (create), ADMIN (delete)

### Layout
```
[AdminLayout]
  [Page Title: "Tags"]
  [Search input]
  [Tag List]
    [Tag: name, slug, article count, actions (Delete - ADMIN)]
  [New Tag form: Name, Description]
[/AdminLayout]
```

## 10. Screen: Media Library

**Route**: `/admin/content/media`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Page Title: "Media Library"]
  [Filter Bar: Type dropdown, Search input]
  [Upload button → /admin/content/media/upload]
  [Media Grid]
    [Card: thumbnail, filename, type badge, usage count]
    [Click → /admin/content/media/[id]]
  [Pagination]
[/AdminLayout]
```

## 11. Screen: Upload Media

**Route**: `/admin/content/media/upload`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Page Title: "Upload Media"]
  [Drag-and-drop zone]
  [File input (fallback)]
  [Upload progress]
  [Post-upload form: Alt text, Caption, Attribution, Tags]
  [Save button]
[/AdminLayout]
```

### Validation
| Field | Rule |
|-------|------|
| File type | IMAGE: jpeg/png/webp/gif; VIDEO: mp4/quicktime/webm; DOCUMENT: pdf |
| File size | IMAGE: ≤10MB; VIDEO: ≤50MB; DOCUMENT: ≤15MB |
| Alt text | Recommended (accessibility warning if empty, not blocking) |

## 12. Screen: Media Detail

**Route**: `/admin/content/media/[id]`  
**Authorization**: Any editorial role or ADMIN

### Layout
```
[AdminLayout]
  [Media preview (image/video thumbnail)]
  [File info: filename, type, size, dimensions, uploaded by, date]
  [Edit form: Alt text, Caption, Attribution, Tags]
  [Save button]
  [Delete button (ADMIN)]
  [Usage info: "Used in N articles" (if usageCount > 0)]
[/AdminLayout]
```

## 13. Screen: Editorial Settings

**Route**: `/admin/content/settings`  
**Authorization**: ADMIN

### Layout
```
[AdminLayout]
  [Page Title: "Editorial Settings"]
  [Default content type for new articles (dropdown)]
  [Default topic (dropdown)]
  [Slug generation rules (display only)]
  [SEO defaults: meta title suffix, default OG image]
  [Analytics provider status (display: configured/not configured)]
  [Email provider status (display: not configured — Phase B)]
[/AdminLayout]
```

## 14. Markdown Editor Specification

### Phase A Implementation
- **Editor**: Textarea with monospace font
- **Toolbar**: Bold (Ctrl+B), Italic (Ctrl+I), Heading (H1/H2/H3), Link (Ctrl+K), Image, List, Code, Quote
- **Preview**: Toggle button shows rendered HTML side-by-side or below
- **Image insertion**: Button opens media picker modal → inserts `![alt text](url)` at cursor
- **Auto-save**: Draft auto-saves every 30 seconds (if status is DRAFT)
- **Keyboard shortcuts**: Ctrl+S (save), Ctrl+Enter (submit for review)

## 15. Responsive Design

- All admin pages must be responsive (mobile-friendly)
- Two-column layout collapses to single column on mobile
- Table becomes card list on mobile
- Media grid: 4 columns desktop, 2 columns tablet, 1 column mobile

---

*End of Admin UI Contract*
