# CONTENT-001 — Editorial Experience Architecture

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: Editorial Experience (Admin UI) Architecture  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define the editorial admin experience for creating, managing, reviewing, publishing, and distributing editorial content. This is the interface used by editors, reviewers, and publishers.

## 2. Design Principle

> **A focused editorial workspace, not a generic admin panel.**

The editorial experience is purpose-built for content creation and management. It extends the existing `AdminLayout` but provides a distinct editorial workspace with content-specific tools.

## 3. Editorial Roles & Access

| Role | Admin Access | Editorial Access |
|------|-------------|-----------------|
| ADMIN | Full admin | Full editorial (implicit) |
| EDITOR | Editorial workspace only | Create, edit own, submit for review |
| REVIEWER | Editorial workspace only | All EDITOR + review, approve, reject |
| PUBLISHER | Editorial workspace only | All REVIEWER + schedule, publish |

### Access Control

- Editorial roles stored in `User.editorialRoles` (String array)
- Admin pages check `editorialRoles` (or `ADMIN`/`PLATFORM_ADMIN` in `roles`)
- API routes enforce same checks
- Non-editorial users redirected to `/dashboard`

## 4. Editorial Admin Pages

### 4.1 Page Structure

```
/admin/content                    → Content dashboard
/admin/content/articles           → Article list
/admin/content/articles/new       → Create article
/admin/content/articles/[id]      → Edit article
/admin/content/ideas              → Idea pipeline
/admin/content/ideas/new          → Create idea
/admin/content/ideas/[id]         → Edit idea
/admin/content/topics             → Topic management
/admin/content/tags               → Tag management
/admin/content/media              → Media library
/admin/content/media/upload       → Upload media
/admin/content/media/[id]         → Media detail
/admin/content/signals            → Signal inbox
/admin/content/signals/[id]       → Signal detail
/admin/content/knowledge          → Knowledge entities
/admin/content/knowledge/new      → Create knowledge entity
/admin/content/knowledge/[id]     → Edit knowledge entity
/admin/content/narratives         → Narrative management
/admin/content/narratives/new     → Create narrative
/admin/content/narratives/[id]    → Edit narrative
/admin/content/newsletter         → Newsletter issues
/admin/content/newsletter/new     → Create newsletter issue
/admin/content/newsletter/[id]    → Edit/send newsletter issue
/admin/content/settings           → Editorial settings
```

### 4.2 Content Dashboard (`/admin/content`)

- **Stats**: Total articles, published, in review, drafts, ideas
- **Recent activity**: Latest transitions, new ideas, new signals
- **Quick actions**: New article, new idea, upload media
- **Pipeline view**: Visual funnel from idea → draft → review → published

## 5. Article Editor

### 5.1 Editor Layout

```
[AdminLayout]
  [Editor header: title input, status badge, save button]
  [Two-column layout]
    [Left: Editor area]
      [Type selector]
      [Title input]
      [Subtitle input]
      [Slug input (auto-generated, editable)]
      [Excerpt textarea]
      [Body editor (Markdown textarea with preview)]
      [Cover image selector]
    [Right: Sidebar]
      [Status & workflow controls]
      [Topic selector]
      [Tag input]
      [SEO metadata]
      [Content truth / evidence]
      [Distribution metadata]
      [Product links]
      [Knowledge links]
      [Narrative links]
      [Related articles]
      [Publish/schedule controls]
  [Preview button → opens /preview/[slug] in new tab]
[/AdminLayout]
```

### 5.2 Markdown Editor

- **NOW**: Textarea with live preview side-by-side
- Toolbar: bold, italic, heading, link, image, list, code, quote
- Image insertion: select from media library or upload
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- **NEXT**: Rich text editor (ProseMirror or Lexical) with inline media

### 5.3 Workflow Controls

| Current Status | Available Actions |
|---------------|-------------------|
| IDEA | Move to DRAFT, Archive |
| DRAFT | Submit for REVIEW, Archive |
| REVIEW | Approve (→ APPROVED), Reject (→ REJECTED), Request changes (→ DRAFT) |
| APPROVED | Schedule (→ SCHEDULED), Publish (→ PUBLISHED) |
| SCHEDULED | Unschedule (→ APPROVED), Publish now (→ PUBLISHED) |
| PUBLISHED | Edit (→ UPDATED), Archive (→ ARCHIVED) |
| UPDATED | Republish (→ PUBLISHED), Archive |
| REJECTED | Revise (→ DRAFT), Archive |
| ARCHIVED | Revive (→ DRAFT) |

### 5.4 SEO Panel

- Slug (auto-generated, editable, uniqueness validation)
- Meta title (with character count, max 60)
- Meta description (with character count, max 160)
- OG title, OG description, OG image
- Canonical URL override
- No-index toggle
- SERP preview (how it looks in Google)

### 5.5 Content Truth Panel

- List of claims with verification level selector
- Evidence references per claim
- Overall verification level
- Public display toggle

## 6. Idea Pipeline UI

### 6.1 Idea Board

Kanban-style board with columns:
```
IDEA | RESEARCH | READY | DRAFTED | PUBLISHED | ARCHIVED
```

- Drag-and-drop between columns (updates status)
- Cards show: title, source, priority, assigned to, topic
- Filter by source type, priority, topic

### 6.2 Idea Detail

- Title, description, source type, source link
- Priority selector
- Assignee selector
- Topic and tags
- Notes
- "Create article from idea" button → pre-fills new article editor

## 7. Signal Inbox

### 7.1 Signal List

- Filterable by type, source, status
- Sortable by date
- Status badges: NEW (red), TRIAGED (yellow), ACTED_ON (green), ARCHIVED (gray)

### 7.2 Signal Detail

- Signal content, type, source, metadata
- Status management (NEW → TRIAGED → ACTED_ON)
- "Create idea from signal" button → pre-fills new idea
- "Create article from signal" button → pre-fills new article
- Link to related article (if `articleId` set)

## 8. Media Library UI

### 8.1 Grid View

- Responsive grid of media thumbnails
- Filter by type, tags
- Search by filename, alt text, caption
- Sort by date, size, usage count
- Click to view detail / edit

### 8.2 Upload

- Drag-and-drop zone
- Multi-file upload
- Progress indicators
- Auto-fill: filename, type, size, dimensions
- Post-upload: add alt text, caption, attribution, tags

## 9. Newsletter Issue Editor

### 9.1 Newsletter-Specific Fields

In addition to standard article editor fields:
- Issue number (auto-incremented, editable)
- Subject line (email subject)
- Preheader text (preview text)
- Target segment selector
- Send/schedule controls
- Email preview (rendered HTML email)
- Send test email button

## 10. Settings

### 10.1 Editorial Settings Page

- Default content type for new articles
- Default topic assignments
- Slug generation rules
- SEO defaults (meta title suffix, default OG image)
- Email provider configuration (env var display, not editable)
- Feature flag toggles for editorial features

## 11. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save draft |
| Ctrl+Enter | Submit for review |
| Ctrl+P | Preview |
| Ctrl+Shift+P | Publish |
| Esc | Close panels/modals |

## 12. Notifications

- **In-app**: Toast notifications for save, status changes, errors
- **Email** (NEXT): Notify editors when content is assigned, reviewed, approved, rejected
- **WhatsApp** (LATER): Notify publishers when scheduled content is ready

---

*End of Editorial Experience Architecture*
